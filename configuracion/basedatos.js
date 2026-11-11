// Importar la biblioteca sqlite3
const sqlite3 = require("sqlite3").verbose();

// Importar path para la ruta del archivo de la db
const path = require("path");

// Definir la ubicación de almacenamiento
const rutaBD = path.join(__dirname, "..", "base_datos", "plannerCraft.db");

// Crear la conexión con la db
// Si no existe el archivo, SQLite lo crea
const db = new sqlite3.Database(rutaBD, (error) => {
  // Comprobar si hubo un problema al conectar con la db
  if (error) {
    console.error("Error al conectarse con la base de datos:", error.message);
  } else {
    console.log("Conexión exitosa con la base de datos");
  }
});

// Variable para detener la ejecución en caso de fallo
let huboErrores = false;

// Organizar las instrucciones SQL
db.serialize(() => {
  // Activar claves foráneas
  db.run("PRAGMA foreign_keys = ON", (error) => {
    if (error) {
      console.error("Error al activar las claves foráneas:", error.message);
    }
  });

  // TABLA 1 - USUARIOS
  db.run(
    `CREATE TABLE IF NOT EXISTS usuarios(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            correo TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `,
    (error) => {
      if (error) {
        huboErrores = true;
        console.error("Error al crear la tabla usuarios", error.message);
        return;
      }
    },
  );

  // TABLA 2 - PROYECTOS
  db.run(
    `CREATE TABLE IF NOT EXISTS proyectos(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            categoria TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en progreso', 'completado')),
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        `,
    (error) => {
      if (error) {
        huboErrores = true;
        console.error("Error al crear la tabla proyectos", error.message);
        return;
      }
    },
  );

  // TABLA 3 - MATERIALES
  db.run(
    `CREATE TABLE IF NOT EXISTS materiales(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL UNIQUE,
            descripcion TEXT,
            unidad TEXT NOT NULL DEFAULT 'unidades'
            )
        `,
    (error) => {
      if (error) {
        huboErrores = true;
        console.error("Error al crear la tabla materiales", error.message);
        return;
      }
    },
  );

  // TABLA 4 - PROYECTO_MATERIALES
  db.run(
    `CREATE TABLE IF NOT EXISTS proyecto_materiales(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proyecto_id INTEGER NOT NULL,
            material_id INTEGER NOT NULL,
            cantidad_necesaria REAL NOT NULL CHECK (cantidad_necesaria >= 0),
            cantidad_disponible REAL NOT NULL DEFAULT 0 CHECK (cantidad_disponible >= 0),
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
            FOREIGN KEY (material_id) REFERENCES materiales(id),
            UNIQUE (proyecto_id, material_id)
            )
        `,
    (error) => {
      if (error) {
        huboErrores = true;
        console.error(
          "Error al crear la tabla proyecto_materiales",
          error.message,
        );
        return;
      }
    },
  );

  // TABLA 5 - TAREAS
  db.run(
    `CREATE TABLE IF NOT EXISTS tareas(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proyecto_id INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            descripcion TEXT,
            prioridad TEXT NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta')),
            estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en progreso', 'completada')),
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE    
        )
    `,
    (error) => {
      if (error) {
        huboErrores = true;
        console.error("Error al crear la tabla tareas:", error.message);
        return;
      }

      if (!huboErrores) {
        console.log("Inicialización de las tablas finalizada");
      }
    },
  );
});

// Exportar la conexión
module.exports = db;
