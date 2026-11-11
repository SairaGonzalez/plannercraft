// Importar la conexión con la db
const db = require("../configuracion/basedatos");

// ------ Función para registrar un material
function crearMaterial(req, res) {
  // Obtener los datos enviados en la solicitud
  const { nombre, descripcion, unidad } = req.body || {};

  // Comprobar que se haya proporcionado el nombre
  if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
    return res.status(400).json({
      mensaje: "El nombre del material es obligatorio",
    });
  }

  // Comprobar que la descripción sea válida
  if (descripcion !== undefined && typeof descripcion !== "string") {
    return res.status(400).json({
      mensaje: "La descripción debe ser texto",
    });
  }

  // Comprobar que la unidad sea válida
  if (unidad !== undefined && typeof unidad !== "string") {
    return res.status(400).json({
      mensaje: "La unidad debe ser texto",
    });
  }

  // Utilizar unidades
  const unidadMaterial = unidad === undefined ? "unidades" : unidad.trim();

  // Comprobar que no se envíen cadenas vacías o con espacios
  if (!unidadMaterial) {
    return res.status(400).json({
      mensaje: "La unidad del material no puede estar vacía",
    });
  }

  // Insertar el material al db
  db.run(
    `INSERT INTO materiales (nombre, descripcion, unidad) VALUES (?, ?, ?)`,
    [nombre.trim(), descripcion ?? "", unidadMaterial],
    function (error) {
      // Comprobar errores
      if (error) {
        // Comprobar si el material ya existe
        if (error.code === "SQLITE_CONSTRAINT") {
          return res.status(409).json({
            mensaje: "Ya existe un material con ese nombre",
          });
        }

        console.error("Error al crear el material:", error.message);

        return res.status(500).json({
          mensaje: "Error al registrar el material",
        });
      }

      // Devolver los datos del material registrado
      res.status(201).json({
        mensaje: "Material registrado correctamente",
        material: {
          id: this.lastID,
          nombre: nombre.trim(),
          descripcion: descripcion ?? "",
          unidad: unidadMaterial,
        },
      });
    },
  );
}

// ------ Función para consultar todos los materiales
function obtenerMateriales(req, res) {
  // Consultar todos los materiales registrados
  db.all(
    `SELECT * FROM materiales ORDER BY nombre ASC`,
    [],
    (error, materiales) => {
      // Comprobar errores
      if (error) {
        console.error("Error al consultar materiales:", error.message);
        return res.status(500).json({
          mensaje: "Error al consultar los materiales",
        });
      }

      // Devolver la lista de materiales
      res.json({
        mensaje: "Materiales consultados correctamente",
        materiales: materiales,
      });
    },
  );
}

// ------ Función para consultar un material específico
function obtenerMaterial(req, res) {
  // Obtener el ID del material desde la URL
  const materialId = Number(req.params.id);

  // Verificar que el ID sea válido
  if (!Number.isInteger(materialId) || materialId <= 0) {
    return res.status(400).json({
      mensaje: "El ID del material no es válido",
    });
  }

  // Buscar el material en la base de datos
  db.get(
    `SELECT * FROM materiales WHERE id = ?`,
    [materialId],
    (error, material) => {
      // Comprobar si ocurrió un error
      if (error) {
        console.error("Error al consultar el material:", error.message);
        return res.status(500).json({
          mensaje: "Error al consultar el material",
        });
      }

      // Comprobar si el material existe
      if (!material) {
        return res.status(404).json({
          mensaje: "Material no encontrado",
        });
      }

      // Devolver el material encontrado
      res.json({
        mensaje: "Material consultado correctamente",
        material: material,
      });
    },
  );
}

// ------ Función para actualizar un material
function actualizarMaterial(req, res) {
  // Obtener el ID del material desde la URL
  const materialId = Number(req.params.id);

  // Verificar que el ID sea válido
  if (!Number.isInteger(materialId) || materialId <= 0) {
    return res.status(400).json({
      mensaje: "El ID del material no es válido",
    });
  }

  // Obtener los datos enviados
  const { nombre, descripcion, unidad } = req.body || {};

  // Comprobar que el nombre sea válido
  if (typeof nombre !== "string" || nombre.trim() === "") {
    return res.status(400).json({
      mensaje: "El nombre del material es obligatorio y debe ser texto",
    });
  }

  // Comprobar que la unidad sea válida
  if (typeof unidad !== "string" || unidad.trim() === "") {
    return res.status(400).json({
      mensaje: "La unidad del material es obligatoria y debe ser texto",
    });
  }

  // Comprobar que la descripción sea válida
  if (descripcion !== undefined && typeof descripcion !== "string") {
    return res.status(400).json({
      mensaje: "La descripción debe ser texto",
    });
  }

  // Actualizar los datos del material
  db.run(
    `UPDATE materiales SET nombre = ?, descripcion = ?, unidad = ? WHERE id = ?`,
    [nombre.trim(), descripcion ?? "", unidad.trim(), materialId],
    function (error) {
      // Comprobar errores
      if (error) {
        if (error.code === "SQLITE_CONSTRAINT") {
          return res.status(409).json({
            mensaje: "Ya existe un material con ese nombre",
          });
        }

        console.error("Error al actualizar el material:", error.message);

        return res.status(500).json({
          mensaje: "Error al actualizar el material",
        });
      }

      // Comprobar si se encontró el material
      if (this.changes === 0) {
        return res.status(404).json({
          mensaje: "Material no encontrado",
        });
      }

      // Confirmar la actualización
      res.json({
        mensaje: "Material actualizado correctamente",
        material: {
          id: materialId,
          nombre: nombre.trim(),
          descripcion: descripcion ?? "",
          unidad: unidad.trim(),
        },
      });
    },
  );
}

// ------ Función para eliminar un material
function eliminarMaterial(req, res) {
  // Obtener el ID del material desde la URL
  const materialId = Number(req.params.id);

  // Verificar que el ID sea válido
  if (!Number.isInteger(materialId) || materialId <= 0) {
    return res.status(400).json({
      mensaje: "El ID del material no es válido",
    });
  }

  // Eliminar el material de la base de datos
  db.run(`DELETE FROM materiales WHERE id = ?`, [materialId], function (error) {
    // Comprobar si ocurrió un error
    if (error) {
      // Comprobar si el material está relacionado con un proyecto
      if (error.code === "SQLITE_CONSTRAINT") {
        return res.status(409).json({
          mensaje:
            "No se puede eliminar el material porque está asociado a uno o más proyectos",
        });
      }

      console.error("Error al eliminar el material:", error.message);

      return res.status(500).json({
        mensaje: "Error al eliminar el material",
      });
    }
    // Comprobar si se encontró el material
    if (this.changes === 0) {
      return res.status(404).json({
        mensaje: "Material no encontrado",
      });
    }

    // Confirmar la eliminación
    res.json({
      mensaje: "Material eliminado correctamente",
    });
  });
}

// Exportar las funciones
module.exports = {
  crearMaterial,
  obtenerMateriales,
  obtenerMaterial,
  actualizarMaterial,
  eliminarMaterial,
};
