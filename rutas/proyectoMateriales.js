// Importar express
const express = require("express");

// Crear enrutador
const router = express.Router();

// Importar las funciones del controlador
const {
  agregarMaterialProyecto,
  obtenerMaterialesProyecto,
  actualizarMaterialProyecto,
  eliminarMaterialProyecto,
} = require("../controladores/proyectoMateriales");

// Importar middleware
const verificarToken = require("../middleware/autenticacion");

// Ruta para asociar un material a un proyecto
router.post("/:proyectoId/materiales", verificarToken, agregarMaterialProyecto);

// Ruta para consultar los materiales de un proyecto
router.get(
  "/:proyectoId/materiales",
  verificarToken,
  obtenerMaterialesProyecto,
);

// Ruta para actualizar las cantidades de un material asociado
router.put(
  "/:proyectoId/materiales/:asociacionId",
  verificarToken,
  actualizarMaterialProyecto,
);

// Ruta para eliminar la asociación de un material con un proyecto
router.delete(
  "/:proyectoId/materiales/:asociacionId",
  verificarToken,
  eliminarMaterialProyecto,
);

// Exportar rutas
module.exports = router;
