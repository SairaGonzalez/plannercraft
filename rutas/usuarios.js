// Importar Express para las rutas
const express = require("express");

// Importar el middleware de autenticación
const verificarToken = require("../middleware/autenticacion");

// Crear enrutador para organizar las rutas
const router = express.Router();

// Importar las funciones del controlador de usuarios
const {
  registrarUsuario,
  iniciarSesion,
} = require("../controladores/usuarios");

// Ruta protegida para consultar el perfil de usuario
router.get("/perfil", verificarToken, (req, res) => {
  res.json({
    mensaje: "Acceso autorizado",
    usuario: req.usuario,
  });
});

// Ruta para registrar una cuenta
router.post("/registro", registrarUsuario);

// Ruta para iniciar sesión
router.post("/login", iniciarSesion);

// Exportar rutas
module.exports = router;
