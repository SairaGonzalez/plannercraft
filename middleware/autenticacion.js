// Importar jsonwebtoken para verificar los tokens
const jwt = require("jsonwebtoken");

// Función para verificar el token
function verificarToken(req, res, next) {
  // Obtener encabezado de la solicitud
  const encabezado = req.headers.authorization;

  // Comprobar que exista el encabezado y use el formato Bearer
  if (!encabezado || !encabezado.startsWith("Bearer ")) {
    return res.status(401).json({
      mensaje: "Acceso denegado. Se requiere token de autenticación",
    });
  }

  // Extraer el token del encaebezado
  const token = encabezado.slice(7).trim();

  // Obtener la clave secreta que verifica el token
  const claveSecreta = process.env.JWT_SECRET;

  // Comprobar que exista la clave secreta
  if (!claveSecreta) {
    return res.status(500).json({
      mensaje: "No se ha configurado la clave secreta",
    });
  }

  // Verificar que el token sea válido
  jwt.verify(token, claveSecreta, (error, datosUsuario) => {
    // Si el token no es válido, se rechaza la solicitud
    if (error) {
      return res.status(401).json({
        mensaje: "Token inválido",
      });
    }

    // Guardar los datos del usuario para utilizarlos en los controladores
    req.usuario = datosUsuario;

    // Permitir la continuación de la solicitud
    next();
  });
}

// Exportar el middleware para usarlo en las rutas
module.exports = verificarToken;
