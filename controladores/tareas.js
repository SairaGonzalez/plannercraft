// Importar la conexión con la db
const db = require("../configuracion/basedatos");

// ----- Función para crear una tarea
function crearTarea(req, res) {
  // Obtener el ID del proyecto desde la URL
  const proyectoId = Number(req.params.proyectoId);

  // Obtener los datos enviados en la solicitud
  const { nombre, descripcion, prioridad, estado } = req.body || {};

  // Establecer valores predeterminados
  const prioridadTarea = prioridad === undefined ? "media" : prioridad;
  const estadoTarea = estado === undefined ? "pendiente" : estado;
  const descripcionTarea = descripcion ?? "";

  // Comprobar que el ID del proyecto sea válido
  if (!Number.isInteger(proyectoId) || proyectoId <= 0) {
    return res.status(400).json({
      mensaje: "El ID del proyecto no es válido",
    });
  }

  // Comprobar que el nombre sea válido
  if (typeof nombre !== "string" || nombre.trim() === "") {
    return res.status(400).json({
      mensaje: "El nombre de la tarea es obligatorio",
    });
  }

  // Comprobar que la descripción sea válida
  if (descripcion !== undefined && typeof descripcion !== "string") {
    return res.status(400).json({
      mensaje: "La descripción debe ser texto",
    });
  }

  // Comprobar que la prioridad sea válida
  if (!["baja", "media", "alta"].includes(prioridadTarea)) {
    return res.status(400).json({
      mensaje: "La prioridad debe ser baja, media o alta",
    });
  }

  // Comprobar que el estado sea válido
  if (!["pendiente", "en progreso", "completada"].includes(estadoTarea)) {
    return res.status(400).json({
      mensaje: "El estado de la tarea no es válido",
    });
  }

  // Comprobar que el proyecto pertenece al usuario
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

      // Registrar la tarea en la db
      db.run(
        `
            INSERT INTO tareas 
            (proyecto_id, nombre, descripcion, prioridad, estado)
            VALUES (?, ?, ?, ?, ?)
        `,
        [
          proyectoId,
          nombre.trim(),
          descripcionTarea,
          prioridadTarea,
          estadoTarea,
        ],
        function (error) {
          if (error) {
            console.error("Error al crear la tarea:", error.message);
            return res.status(500).json({
              mensaje: "Error al registrar la tarea",
            });
          }

          // Confirmar el registro de la tarea
          res.status(201).json({
            mensaje: "Tarea registrada correctamente",
            tarea: {
              id: this.lastID,
              proyecto_id: proyectoId,
              nombre: nombre.trim(),
              descripcion: descripcionTarea,
              prioridad: prioridadTarea,
              estado: estadoTarea,
            },
          });
        },
      );
    },
  );
}

// ------ Función para consultar las tareas de un proyecto
function obtenerTareasProyecto(req, res) {
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
        console.error("Error al consultar el proyecto", error.message);
        return res.status(500).json({
          mensaje: "Error al consultar el proyecto",
        });
      }

      if (!proyecto) {
        return res.status(404).json({
          mensaje: "Proyecto no encontrado",
        });
      }

      // Consultar las tareas del proyecto
      db.all(
        `SELECT * FROM tareas WHERE proyecto_id = ? ORDER BY fecha_creacion DESC`,
        [proyectoId],
        (error, tareas) => {
          if (error) {
            console.error("Error al consultar las tareas:", error.message);
            return res.status(500).json({
              mensaje: "Error al consultar las tareas",
            });
          }

          // Devolver las tareas encontradas
          res.json({
            mensaje: "Tareas del proyecto consultadas correctamente",
            proyecto_id: proyectoId,
            tareas,
          });
        },
      );
    },
  );
}

// ------ Función para consultar una tarea específica
function obtenerTareaProyecto(req, res) {
  // Obtener los ID desde el URL
  const proyectoId = Number(req.params.proyectoId);
  const tareaId = Number(req.params.tareaId);

  // Comprobar que los ID sean válidos
  if (
    !Number.isInteger(proyectoId) ||
    proyectoId <= 0 ||
    !Number.isInteger(tareaId) ||
    tareaId <= 0
  ) {
    return res.status(400).json({
      mensaje: "Los ID del proyecto y de la tarea deben ser válidos",
    });
  }

  // Consultar la tarea y comprobar que sea del usuario
  db.get(
    `SELECT t.*
         FROM tareas AS t
         INNER JOIN proyectos AS p ON t.proyecto_id = p.id
         WHERE t.id = ? AND t.proyecto_id = ? AND p.usuario_id = ?
    `,
    [tareaId, proyectoId, req.usuario.id],
    (error, tarea) => {
      if (error) {
        console.error("Error al consultar la tarea:", error.message);
        return res.status(500).json({
          mensaje: "Error al consultar la tarea",
        });
      }

      if (!tarea) {
        return res.status(404).json({
          mensaje: "Tarea no encontrada",
        });
      }

      // Devolver la tarea encontrada
      res.status(200).json({
        mensaje: "Tarea consultada correctamente",
        tarea: tarea,
      });
    },
  );
}

// ----- Función para actualizar una tarea
function actualizarTarea(req, res) {
  // Obtener los ID desde la URL
  const proyectoId = Number(req.params.proyectoId);
  const tareaId = Number(req.params.tareaId);

  // Obtener los datos enviados en la solicitud
  const { nombre, descripcion, prioridad, estado } = req.body || {};

  // Comprobar que los ID sean válidos
  if (
    !Number.isInteger(proyectoId) ||
    proyectoId <= 0 ||
    !Number.isInteger(tareaId) ||
    tareaId <= 0
  ) {
    return res.status(400).json({
      mensaje: "Los ID del proyecto y tarea deben ser válidos",
    });
  }

  // Comprobar que el nombre sea válido
  if (typeof nombre !== "string" || nombre.trim() === "") {
    return res.status(400).json({
      mensaje: "El nombre de la tarea es obligatorio y debe ser texto",
    });
  }

  // Comprobar que la prioridad sea válida
  if (
    typeof prioridad !== "string" ||
    !["baja", "media", "alta"].includes(prioridad)
  ) {
    return res.status(400).json({
      mensaje: "La prioridad debe ser baja, media o alta",
    });
  }

  // Comprobar que el estado sea válido
  if (
    typeof estado !== "string" ||
    !["pendiente", "en progreso", "completada"].includes(estado)
  ) {
    return res.status(400).json({
      mensaje: "El estado de la tarea no es válido",
    });
  }

  // Comprobar que la descripción sea texto
  if (descripcion !== undefined && typeof descripcion !== "string") {
    return res.status(400).json({
      mensaje: "La descripción debe ser un texto",
    });
  }

  // Establecer una descripción vacía
  const descripcionTarea = descripcion ?? "";

  // Comprobar que la tarea pertenezca a un proyecto del usuario
  db.run(
    `
        UPDATE tareas
        SET nombre = ?, descripcion = ?, prioridad = ?, estado = ?
        WHERE id = ? AND proyecto_id = ?
        AND proyecto_id IN (SELECT id FROM proyectos WHERE usuario_id = ?)
    `,
    [
      nombre.trim(),
      descripcionTarea,
      prioridad,
      estado,
      tareaId,
      proyectoId,
      req.usuario.id,
    ],
    function (error) {
      if (error) {
        console.error("Error al actualizar la tarea:", error.message);
        return res.status(500).json({
          mensaje: "Error al actualizar la tarea",
        });
      }

      // Comprobar si se encontró y actualizó la tarea
      if (this.changes === 0) {
        return res.status(404).json({
          mensaje: "Tarea no encontrada",
        });
      }

      // Confirmar la actualización
      res.json({
        mensaje: "Tarea actualizada correctamente",
        tarea: {
          id: tareaId,
          proyecto_id: proyectoId,
          nombre: nombre.trim(),
          descripcion: descripcionTarea,
          prioridad,
          estado,
        },
      });
    },
  );
}

// ----- Función para eliminar una tarea
function eliminarTarea(req, res) {
  // Obtener los identificadores desde la URL
  const proyectoId = Number(req.params.proyectoId);
  const tareaId = Number(req.params.tareaId);

  // Comprobar que los identificadores sean válidos
  if (
    !Number.isInteger(proyectoId) ||
    proyectoId <= 0 ||
    !Number.isInteger(tareaId) ||
    tareaId <= 0
  ) {
    return res.status(400).json({
      mensaje:
        "Los identificadores del proyecto y de la tarea deben ser válidos",
    });
  }

  // Eliminar únicamente la tarea que pertenece al proyecto del usuario
  db.run(
    `DELETE FROM tareas
     WHERE id = ? AND proyecto_id = ?
     AND proyecto_id IN (
       SELECT id FROM proyectos WHERE usuario_id = ?
     )`,
    [tareaId, proyectoId, req.usuario.id],
    function (error) {
      if (error) {
        console.error("Error al eliminar la tarea:", error.message);
        return res.status(500).json({
          mensaje: "Error al eliminar la tarea",
        });
      }

      // Comprobar si se encontró la tarea
      if (this.changes === 0) {
        return res.status(404).json({
          mensaje: "Tarea no encontrada",
        });
      }

      // Confirmar la eliminación
      res.json({
        mensaje: "Tarea eliminada correctamente",
      });
    },
  );
}

// Exportar las funciones del controlador
module.exports = {
  crearTarea,
  obtenerTareasProyecto,
  obtenerTareaProyecto,
  actualizarTarea,
  eliminarTarea,
};
