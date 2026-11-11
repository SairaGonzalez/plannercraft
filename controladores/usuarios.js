// Importar bcryptjs para la protección de contraseñas y compararlas
const bcrypt = require("bcryptjs");

// Importar jsonwebtoken para los token de autenticación
const jwt = require("jsonwebtoken");

// Importar la conexión con la db
const db = require("../configuracion/basedatos");

// --- Registro de usuario
// Función encargada del registro
function registrarUsuario(req, res) {
  // Obtener los datos del cliente
  const { nombre, correo, password } = req.body || {};

  // Comprobar que los campos estén completos
  if (
    typeof nombre !== "string" ||
    nombre.trim() === "" ||
    typeof correo !== "string" ||
    correo.trim() === "" ||
    typeof password !== "string" ||
    password.length === 0
  ) {
    return res.status(400).json({
      mensaje: "Todos los campos son obligatorios y deben ser válidos",
    });
  }

  // Convertir el correo a minúsculas y se eliminan los espacios
  const correoNormalizado = correo.trim().toLowerCase();

  // Comprobar que el correo tenga un formato básico válido
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoNormalizado)) {
    return res.status(400).json({
      mensaje: "El correo electrónico no es válido",
    });
  }

  // Establecer longitud mínima para la contraseña
  if (password.length < 8) {
    return res.status(400).json({
      mensaje: "La contraseña debe contener al menos 8 caracteres",
    });
  }

  // Generar hash de la contraseña
  bcrypt.hash(password, 10, (error, hash) => {
    // Comprobar errores al generar el hash
    if (error) {
      return res.status(500).json({
        mensaje: "Error al proteger la contraseña",
      });
    }

    // Insertar datos del usuario en la base de datos
    db.run(
      `
            INSERT INTO usuarios (nombre, correo, password) VALUES (?, ?, ?)
            `,
      [nombre.trim(), correoNormalizado, hash],
      function (error) {
        // Comprobar si le correo ya está registrado
        if (error) {
          if (error.code === "SQLITE_CONSTRAINT") {
            return res.status(409).json({
              mensaje: "El correo ya está registrado",
            });
          }

          // Mensaje de error al guardar
          return res.status(500).json({
            mensaje: "Error al registrar el usuario",
          });
        }

        // Responder con los datos básicos
        res.status(201).json({
          mensaje: "Usuario registrado correctamente",
          usuario: {
            id: this.lastID,
            nombre: nombre.trim(),
            correo: correoNormalizado,
          },
        });
      },
    );
  });
}

// --- Inicio de sesión
// Función encargada de la autenticación
function iniciarSesion(req, res) {
  // Obtener correo y contraseña del cliente
  const { correo, password } = req.body || {};

  // Comprobar que los campos estén completos
  if (
    typeof correo !== "string" ||
    correo.trim() === "" ||
    typeof password !== "string" ||
    password.length === 0
  ) {
    return res.status(400).json({
      mensaje: "El correo y la contraseña son obligatorios y deben ser válidos",
    });
  }

  // Normalizar correo para la búsqueda
  const correoNormalizado = correo.trim().toLowerCase();

  // Buscar mediante el correo
  db.get(
    "SELECT * FROM usuarios WHERE correo = ?",
    [correoNormalizado],
    (error, usuario) => {
      // Comprobar si hubo un error
      if (error) {
        console.error("Error al consultar el usuario:", error.message);
        return res.status(500).json({
          mensaje: "Error al consultar el usuario",
        });
      }

      // Comprobar si existe una cuenta con ese correo
      if (!usuario) {
        return res.status(401).json({
          mensaje: "Correo o contraseña incorrectos",
        });
      }

      // Comparar contraseñas
      bcrypt.compare(password, usuario.password, (error, coincide) => {
        // Comprobar si ocurrió un error
        if (error) {
          return res.status(500).json({
            mensaje: "Error al verificar la contraseña",
          });
        }

        // Rechazar el inicio de sesión si no coincide la contraseña
        if (!coincide) {
          return res.status(401).json({
            mensaje: "Correo o contraseña incorrectos",
          });
        }

        // Obtener clave de .env
        const claveSecreta = process.env.JWT_SECRET;

        // Comprobar la clave secreta
        if (!claveSecreta) {
          return res.status(500).json({
            mensaje: "No se ha configurado la clave para el servidor",
          });
        }

        // Crear token con los datos básicos del usuario
        const token = jwt.sign(
          {
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
          },
          claveSecreta,
          {
            expiresIn: "1h",
          },
        );

        // Enviar el token y los datos básicos al cliente
        res.json({
          mensaje: "Inicio de sesión exitoso",
          token: token,
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
          },
        });
      });
    },
  );
}

// Exportar las funciones para usarlas desde las rutas
module.exports = {
  registrarUsuario,
  iniciarSesion,
};
