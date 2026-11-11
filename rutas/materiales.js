// Importar express
const express = require("express");

// Crear enrutador
const router = express.Router();

// Importar las funciones del controlador
const {
  crearMaterial,
  obtenerMateriales,
  obtenerMaterial,
  actualizarMaterial,
  eliminarMaterial,
} = require("../controladores/materiales");

// Importar middleware
const verificarToken = require("../middleware/autenticacion");

// Ruta para registrar un material
router.post("/", verificarToken, crearMaterial);

// Ruta para consultar todos los materiales
router.get("/", verificarToken, obtenerMateriales);

// Ruta para consultar un material específico
router.get("/:id", verificarToken, obtenerMaterial);

// Ruta para actualizar un material
router.put("/:id", verificarToken, actualizarMaterial);

// Ruta para eliminar un material
router.delete("/:id", verificarToken, eliminarMaterial);

// Exportar rutas
module.exports = router;
