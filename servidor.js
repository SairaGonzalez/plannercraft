// Importar Express para la creación del servidor y rutas de la API
const express = require("express");

// Importar CORS para permitir solicitudes externas
const cors = require("cors");

// Importar dotenv para leer variables del archivo .env
require("dotenv").config();

// Importar la conexión con la db
const db = require("./configuracion/basedatos");

// Importar rutas relacionadas con los usuarios
const rutasUsuarios = require("./rutas/usuarios");

// Importar las rutas de proyectos
const rutasProyectos = require("./rutas/proyectos");

// Importar las rutas de materiales
const rutasMateriales = require("./rutas/materiales");

// Importar las rutas de proyecto_materiales
const rutasProyectoMateriales = require("./rutas/proyectoMateriales");

// Importar las rutas de tareas
const rutasTareas = require("./rutas/tareas");

// ----- Configuración del servidor
// Crear aplicación Express
const app = express();

// Definir puerto
const PUERTO = process.env.PORT || 3000;

// Permitir solicitudes de otros orígenes
app.use(cors());

// Permitir que Express interprete datos en JSON
app.use(express.json());

// Registrar las rutas de usuarios en /api/usuarios
app.use("/api/usuarios", rutasUsuarios);

// Registrar las rutas de proyectos
app.use("/api/proyectos", rutasProyectos);

// Registrar las rutas de materiales
app.use("/api/materiales", rutasMateriales);

// Registrar las rutas de proyecto_materiales
app.use("/api/proyectos", rutasProyectoMateriales);

// Registrar las rutas de tareas
app.use("/api/proyectos", rutasTareas);

// Ruta principal
// Definir ruta para comprobar el funcionamiento del servidor
app.get("/", (req, res) => {
  // Enviar respuesta al cliente
  res.json({
    mensaje: "API REST de PlannerCraft",
    estado: "Servidor funcionando correctamente",
  });
});

// Ruta para comprobar la conexión con la db
app.get("/api/estado", (req, res) => {
  // Ejecutar consulta para comprobar la db
  db.get("SELECT 1 AS resultado", (error) => {
    // Comprobar error de la consulta
    if (error) {
      console.error("Error al consultar la base de datos", error.message);

      return res.status(500).json({
        mensaje: "Error al consultar la base de datos",
      });
    }

    // Confirmación de la consulta
    res.json({
      mensaje: "Conexión exitosa con la base de datos",
      base_datos: "Funcionando",
    });
  });
});

// Iniciar servidor
app.listen(PUERTO, () => {
  // Mostrar dónde se está ejecutando el servidor
  console.log(
    `Servidor de PlannerCraft funcionando en http://localhost:${PUERTO}`,
  );
});
