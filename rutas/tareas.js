// Importar express
const express = require("express");

// Crear enrutador
const router = express.Router();

// Importar funciones del controlador
const {
  crearTarea,
  obtenerTareasProyecto,
  obtenerTareaProyecto,
  actualizarTarea,
  eliminarTarea,
} = require("../controladores/tareas");

// Importar middleware
const verificarToken = require("../middleware/autenticacion");

// Ruta para crear una tarea
router.post("/:proyectoId/tareas", verificarToken, crearTarea);

// Ruta para consultar todas las tareas de un proyecto
router.get("/:proyectoId/tareas", verificarToken, obtenerTareasProyecto);

// Ruta para consultar una tarea específica
router.get(
  "/:proyectoId/tareas/:tareaId",
  verificarToken,
  obtenerTareaProyecto,
);

// Ruta para actualizar una tarea
router.put("/:proyectoId/tareas/:tareaId", verificarToken, actualizarTarea);

// Ruta para eliminar una tarea
router.delete("/:proyectoId/tareas/:tareaId", verificarToken, eliminarTarea);

// Exportar rutas
module.exports = router;
