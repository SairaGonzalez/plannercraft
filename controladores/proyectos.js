// Importar la conexión con la db
const db = require("../configuracion/basedatos");

// ------ Función para crear un proyecto
function crearProyecto(req, res) {
  // Obtener los datos enviados
  const { nombre, descripcion, categoria, estado } = req.body || {};

  // Comprobar que estén llenos los campos obligatorios
  if (
    typeof nombre !== "string" ||
    nombre.trim() === "" ||
    typeof categoria !== "string" ||
    categoria.trim() === ""
  ) {
    return res.status(400).json({
      mensaje: "El nombre y la categoría son obligatorios y deben ser texto",
    });
  }

  // Definir los estados
  const estadosPermitidos = ["pendiente", "en progreso", "completado"];

  // Utilizar pendiente como predeterminado
  const estadoProyecto = estado === undefined ? "pendiente" : estado;

  // Comprobar que el estado sea válido
  if (!estadosPermitidos.includes(estadoProyecto)) {
    return res.status(400).json({
      mensaje: "El estado del proyecto no es válido",
    });
  }

  // Comprobar que la descripción sea válida
  if (descripcion !== undefined && typeof descripcion !== "string") {
    return res.status(400).json({
      mensaje: "La descripción debe ser texto",
    });
  }

  // Obtener el ID del usuario autenticado
  const usuarioId = req.usuario.id;

  // Insertar el proyecto en la db
  db.run(
    `INSERT INTO proyectos (usuario_id, nombre, descripcion, categoria, estado) VALUES (?, ?, ?, ?, ?)`,
    [
      usuarioId,
      nombre.trim(),
      descripcion ?? "",
      categoria.trim(),
      estadoProyecto,
    ],
    function (error) {
      // Comprobar si ocurrió un error al insertar
      if (error) {
        console.error("Error al crear el proyecto:", error.message);
        return res.status(500).json({
          mensaje: "Error al crear el proyecto",
        });
      }

      // Responder con los datos del proyecto creado
      res.status(201).json({
        mensaje: "Proyecto creado correctamente",
        proyecto: {
          id: this.lastID,
          usuario_id: usuarioId,
          nombre: nombre.trim(),
          descripcion: descripcion ?? "",
          categoria: categoria.trim(),
          estado: estadoProyecto,
        },
      });
    },
  );
}

// ----- Función para consultar los proyectos del usuario
function obtenerProyectos(req, res) {
  // Obtener el ID del usuario desde el token
  const usuarioId = req.usuario.id;

  // Consultar únicamente los proyectos del usuario autenticado
  db.all(
    `SELECT id, usuario_id, nombre, descripcion, categoria, estado, fecha_creacion
        FROM proyectos
        WHERE usuario_id = ?
        ORDER BY fecha_creacion DESC
        `,
    [usuarioId],
    (error, proyectos) => {
      // Comprobar si ocurrió un error en la consulta
      if (error) {
        console.error("Error al consultar proyectos:", error.message);
        return res.status(500).json({
          mensaje: "Error al consultar los proyectos",
        });
      }

      // Devolver la lista de proyectos
      res.json({
        mensaje: "Proyectos consultados correctamente",
        proyectos: proyectos,
      });
    },
  );
}

// ----- Función para consultar un solo proyecto
function obtenerProyecto(req, res) {
  // Obtener ID del proyecto desde la URL
  const proyectoId = Number(req.params.id);

  // Verificar que el ID sea válido
  if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
    return res.status(400).json({
      mensaje: "El ID del proyecto no es válido",
    });
  }

  // Obtener el ID del usuario
  const usuarioId = req.usuario.id;

  // Buscar el proyecto y comprobar que sea del usuario
  db.get(
    `
    SELECT * FROM proyectos WHERE id = ? AND usuario_id = ?
    `,
    [proyectoId, usuarioId],
    (error, proyecto) => {
      // Comprobar error
      if (error) {
        console.error("Error al consultar el proyecto:", error.message);

        return res.status(500).json({
          mensaje: "Error al consultar el proyecto",
        });
      }

      // Comprobar si el proyecto existe y es del usuario
      if (!proyecto) {
        return res.status(404).json({
          mensaje: "Proyecto no encontrado",
        });
      }

      // Devolver los datos del proyecto
      res.json({
        mensaje: "Proyecto consultado correctamente",
        proyecto: proyecto,
      });
    },
  );
}

// ------ Función para actualizar un proyecto
function actualizarProyecto(req, res) {
  // Obtener ID del proyecto desde la URL
  const proyectoId = Number(req.params.id);

  // Verificar que el ID sea válido
  if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
    return res.status(400).json({
      mensaje: "El ID del proyecto no es válido",
    });
  }

  // Obtener los datos enviados en la solicitud
  const { nombre, descripcion, categoria, estado } = req.body || {};

  // Obtener el ID del usuario autenticado
  const usuarioId = req.usuario.id;

  // Comprobar que los campos obligatorios estén llenos
  if (
    typeof nombre !== "string" ||
    nombre.trim() === "" ||
    typeof categoria !== "string" ||
    categoria.trim() === "" ||
    typeof estado !== "string" ||
    estado.trim() === ""
  ) {
    return res.status(400).json({
      mensaje:
        "Los campos nombre, categoría y estado son obligatorios y deben ser válidos",
    });
  }

  // Definir estados permitidos
  const estadosPermitidos = ["pendiente", "en progreso", "completado"];

  // Comprobar que el estado sea válido
  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      mensaje: "El estado del proyecto no es válido",
    });
  }

  // Comprobar que la descripción sea válida
  if (descripcion !== undefined && typeof descripcion !== "string") {
    return res.status(400).json({
      mensaje: "La descripción debe ser texto",
    });
  }

  // Actualizar el proyecto
  db.run(
    `UPDATE proyectos SET nombre = ?, descripcion = ?, categoria = ?, estado = ? WHERE id = ? AND usuario_id = ?`,
    [
      nombre.trim(),
      descripcion ?? "",
      categoria.trim(),
      estado,
      proyectoId,
      usuarioId,
    ],
    function (error) {
      // Comprobar errores
      if (error) {
        console.error("Error al actualizar el proyecto:", error.message);
        return res.status(500).json({
          mensaje: "Error al actualizar el proyecto",
        });
      }

      // Comprobar si se encontró y actualizó el proyecto
      if (this.changes === 0) {
        return res.status(404).json({
          mensaje: "Proyecto no encontrado",
        });
      }

      // Confirmar la actualización
      res.json({
        mensaje: "Proyecto actualizado correctamente",
      });
    },
  );
}

// ------ Función para eliminar un proyecto
function eliminarProyecto(req, res) {
  // Obtener ID del proyecto desde la URL
  const proyectoId = Number(req.params.id);

  // Verificar que el ID sea válido
  if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
    return res.status(400).json({
      mensaje: "El ID del proyecto no es válido",
    });
  }

  // Obtener el ID del usuario
  const usuarioId = req.usuario.id;

  // Eliminar el proyecto perteneciente al usuario
  db.run(
    `
    DELETE FROM proyectos WHERE id = ? AND usuario_id = ?
    `,
    [proyectoId, usuarioId],
    function (error) {
      // Comprobar errores
      if (error) {
        console.error("Error al eliminar el proyecto:", error.message);
        return res.status(500).json({
          mensaje: "Error al eliminar el proyecto",
        });
      }

      // Comprobar si se encontró y eliminó el proyecto
      if (this.changes === 0) {
        return res.status(404).json({
          mensaje: "Proyecto no encontrado",
        });
      }

      // Confirmar la eliminación
      res.json({
        mensaje: "Proyecto eliminado correctamente",
      });
    },
  );
}

// Exportar las funciones para utilizarlas en las rutas
module.exports = {
  crearProyecto,
  obtenerProyectos,
  obtenerProyecto,
  actualizarProyecto,
  eliminarProyecto,
};
