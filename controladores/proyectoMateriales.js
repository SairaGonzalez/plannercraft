// Importar la conexión con la db
const db = require("../configuracion/basedatos");

// ----- Función para asociar un material a un proyecto
function agregarMaterialProyecto(req, res) {
  // Obtener el ID del proyecto desde la URL
  const proyectoId = Number(req.params.proyectoId);

  // Obtener los datos enviados en la solicitud
  const { material_id, cantidad_necesaria, cantidad_disponible } =
    req.body || {};

  // Convertir los ID en números
  const materialId = Number(material_id);

  // Establecer la cantidad disponible si no se coloca
  const cantidadDisponible =
    cantidad_disponible === undefined ? 0 : cantidad_disponible;

  // Comprobar que los identificadores sean números positivos
  if (
    !Number.isInteger(proyectoId) ||
    proyectoId <= 0 ||
    !Number.isInteger(materialId) ||
    materialId <= 0
  ) {
    return res.status(400).json({
      mensaje: "El ID del proyecto y del material deben ser válidos",
    });
  }

  // Comprobar que las cantidades sean números iguales o mayores a 0
  if (
    !Number.isFinite(cantidad_necesaria) ||
    cantidad_necesaria < 0 ||
    !Number.isFinite(cantidadDisponible) ||
    cantidadDisponible < 0
  ) {
    return res.status(400).json({
      mensaje: "Las cantidades deben ser números iguales o mayores a 0",
    });
  }

  // Comprobar que el proyecto pertenezca al usuario
  db.get(
    "SELECT id FROM proyectos WHERE id = ? AND usuario_id = ?",
    [proyectoId, req.usuario.id],
    (error, proyecto) => {
      if (error) {
        console.error("Error al consultar el proyecto:", error.message);
        return res.status(500).json({
          mensaje: "Error al consultar el proyecto",
        });
      }

      if (!proyecto) {
        return res.status(404).json({
          mensaje: "Proyecto no encontrado",
        });
      }

      // Comprobar que el material exista en el catálogo
      db.get(
        "SELECT id FROM materiales WHERE id = ?",
        [materialId],
        (error, material) => {
          if (error) {
            console.error("Error al consultar el material:", error.message);
            return res.status(500).json({
              mensaje: "Error al consultar el material",
            });
          }

          if (!material) {
            return res.status(404).json({
              mensaje: "Material no encontrado",
            });
          }

          // Registrar la relación entre el proyecto y el material
          db.run(
            `INSERT INTO proyecto_materiales (proyecto_id, material_id, cantidad_necesaria, cantidad_disponible) VALUES (?, ?, ?, ?)`,
            [proyectoId, materialId, cantidad_necesaria, cantidadDisponible],
            function (error) {
              if (error) {
                // Comprobar si el material está asociado al proyecto
                if (error.code === "SQLITE_CONSTRAINT") {
                  return res.status(409).json({
                    mensaje: "El material ya está asociado a este proyecto",
                  });
                }

                console.error("Error al asociar el material:", error.message);
                return res.status(500).json({
                  mensaje: "Error al asociar el material al proyecto",
                });
              }

              // Confirmar asociación
              res.status(201).json({
                mensaje: "Material asociado correctamente al proyecto",
                asociacion: {
                  id: this.lastID,
                  proyecto_id: proyectoId,
                  material_id: materialId,
                  cantidad_necesaria,
                  cantidad_disponible: cantidadDisponible,
                  cantidad_faltante: Math.max(
                    cantidad_necesaria - cantidadDisponible,
                    0,
                  ),
                },
              });
            },
          );
        },
      );
    },
  );
}

// ----- Función para consultar los materiales de un proyecto
function obtenerMaterialesProyecto(req, res) {
  // Obtener el ID del proyecto desde la URL
  const proyectoId = Number(req.params.proyectoId);

  // Comprobar que el ID sea válido
  if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
    return res.status(400).json({
      mensaje: "El ID del proyecto no es válido",
    });
  }

  // Comprobar que el proyecto pertenezca al usuario
  db.get(
    "SELECT id FROM proyectos WHERE id = ? AND usuario_id = ?",
    [proyectoId, req.usuario.id],
    (error, proyecto) => {
      if (error) {
        console.error("Error al consultar el proyecto:", error.message);
        return res.status(500).json({
          mensaje: "Error al consultar el proyecto",
        });
      }

      if (!proyecto) {
        return res.status(404).json({
          mensaje: "Proyecto no encontrado",
        });
      }

      // Consultar los materiales asociados al proyecto
      db.all(
        `
        SELECT
          pm.id AS asociacion_id,
          m.id AS material_id,
          m.nombre,
          m.descripcion,
          m.unidad,
          pm.cantidad_necesaria,
          pm.cantidad_disponible,
          MAX(pm.cantidad_necesaria - pm.cantidad_disponible, 0)
            AS cantidad_faltante
        FROM proyecto_materiales AS pm
        INNER JOIN materiales AS m ON pm.material_id = m.id
        WHERE pm.proyecto_id = ?
        ORDER BY m.nombre ASC
        `,
        [proyectoId],
        (error, materiales) => {
          if (error) {
            console.error(
              "Error al consultar los materiales del proyecto:",
              error.message,
            );
            return res.status(500).json({
              mensaje: "Error al consultar los materiales del proyecto",
            });
          }

          // Devolver los materiales encontrados
          res.json({
            mensaje: "Materiales del proyecto consultados correctamente",
            proyecto_id: proyectoId,
            materiales,
          });
        },
      );
    },
  );
}

// ----- Función para actualizar las cantidades de un material asociado
function actualizarMaterialProyecto(req, res) {
  // Obtener los identificadores desde la URL
  const proyectoId = Number(req.params.proyectoId);
  const asociacionId = Number(req.params.asociacionId);

  // Obtener las cantidades enviadas en la solicitud
  const { cantidad_necesaria, cantidad_disponible } = req.body || {};

  // Comprobar que los identificadores sean válidos
  if (
    !Number.isInteger(proyectoId) ||
    proyectoId <= 0 ||
    !Number.isInteger(asociacionId) ||
    asociacionId <= 0
  ) {
    return res.status(400).json({
      mensaje: "Los ID del proyecto y de la asociación deben ser válidos",
    });
  }

  // Comprobar que las cantidades sean números iguales o mayores a 0
  if (
    !Number.isFinite(cantidad_necesaria) ||
    cantidad_necesaria < 0 ||
    !Number.isFinite(cantidad_disponible) ||
    cantidad_disponible < 0
  ) {
    return res.status(400).json({
      mensaje: "Las cantidades deben ser números iguales o mayores a 0",
    });
  }

  // Comprobar que el proyecto pertenezca al usuario autenticado
  db.get(
    "SELECT id FROM proyectos WHERE id = ? AND usuario_id = ?",
    [proyectoId, req.usuario.id],
    (error, proyecto) => {
      if (error) {
        console.error("Error al consultar el proyecto:", error.message);
        return res.status(500).json({
          mensaje: "Error al consultar el proyecto",
        });
      }

      if (!proyecto) {
        return res.status(404).json({
          mensaje: "Proyecto no encontrado",
        });
      }

      // Actualizar las cantidades de la asociación
      db.run(
        `
        UPDATE proyecto_materiales
        SET cantidad_necesaria = ?, cantidad_disponible = ? 
        WHERE id = ? AND proyecto_id = ?
        `,
        [cantidad_necesaria, cantidad_disponible, asociacionId, proyectoId],
        function (error) {
          if (error) {
            console.error("Error al actualizar las cantidades:", error.message);
            return res.status(500).json({
              mensaje: "Error al actualizar las cantidades del material",
            });
          }

          // Comprobar si existe la asociación
          if (this.changes === 0) {
            return res.status(404).json({
              mensaje:
                "No se encontró la asociación del material con el proyecto",
            });
          }

          // Confirmar la actualización
          res.json({
            mensaje: "Cantidades actualizadas correctamente",
            asociacion: {
              id: asociacionId,
              proyecto_id: proyectoId,
              cantidad_necesaria,
              cantidad_disponible,
              cantidad_faltante: Math.max(
                cantidad_necesaria - cantidad_disponible,
                0,
              ),
            },
          });
        },
      );
    },
  );
}

// ------ Función para eliminar la asociación de un material con un proyecto
function eliminarMaterialProyecto(req, res) {
  // Obtener los identificadores desde la URL
  const proyectoId = Number(req.params.proyectoId);
  const asociacionId = Number(req.params.asociacionId);

  // Comprobar que los identificadores sean válidos
  if (
    !Number.isInteger(proyectoId) ||
    proyectoId <= 0 ||
    !Number.isInteger(asociacionId) ||
    asociacionId <= 0
  ) {
    return res.status(400).json({
      mensaje:
        "Los identificadores del proyecto y de la asociación deben ser válidos",
    });
  }

  // Comprobar que el proyecto pertenezca al usuario autenticado
  db.get(
    "SELECT id FROM proyectos WHERE id = ? AND usuario_id = ?",
    [proyectoId, req.usuario.id],
    (error, proyecto) => {
      if (error) {
        console.error("Error al consultar el proyecto:", error.message);
        return res.status(500).json({
          mensaje: "Error al consultar el proyecto",
        });
      }

      if (!proyecto) {
        return res.status(404).json({
          mensaje: "Proyecto no encontrado",
        });
      }

      // Eliminar únicamente la asociación del proyecto
      db.run(
        `DELETE FROM proyecto_materiales
         WHERE id = ? AND proyecto_id = ?`,
        [asociacionId, proyectoId],
        function (error) {
          if (error) {
            console.error("Error al eliminar la asociación:", error.message);
            return res.status(500).json({
              mensaje: "Error al eliminar la asociación del material",
            });
          }

          // Comprobar si se encontró la asociación
          if (this.changes === 0) {
            return res.status(404).json({
              mensaje:
                "No se encontró la asociación del material con el proyecto",
            });
          }

          // Confirmar la eliminación
          res.json({
            mensaje: "Material eliminado del proyecto correctamente",
          });
        },
      );
    },
  );
}

// Exportar las funciones
module.exports = {
  agregarMaterialProyecto,
  obtenerMaterialesProyecto,
  actualizarMaterialProyecto,
  eliminarMaterialProyecto,
};
