// Importar express
const express = require("express");

// Crear el enrutador
const router = express.Router();

// Importar las funciones del controlador de proyecto
const {
  crearProyecto,
  obtenerProyectos,
  actualizarProyecto,
  eliminarProyecto,
  obtenerProyecto,
} = require("../controladores/proyectos");

// Importar middleware
const verificarToken = require("../middleware/autenticacion");

// Ruta para crear un proyecto
router.post("/", verificarToken, crearProyecto);

// Ruta para consultar todos los proyectos del usuario
router.get("/", verificarToken, obtenerProyectos);

// Ruta para consultar un solo proyecto
router.get("/:id", verificarToken, obtenerProyecto);

// Ruta para actualizar un proyecto
router.put("/:id", verificarToken, actualizarProyecto);

// Ruta para eliminar un proyecto
router.delete("/:id", verificarToken, eliminarProyecto);

// Exportar rutas
module.exports = router;
