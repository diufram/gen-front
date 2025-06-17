// server.js
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import expressLayouts from 'express-ejs-layouts';

import { sessionStore, sessionConfig } from './config/session_store.js';
import { socketController } from './controllers/socketController.js';
import mainRouter from './routes/index.js';
import sequelize from './config/database.js';

// __dirname emulado en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear servidor Express
const app = express();
const server = http.createServer(app);
const io = new SocketIO(server);

// Configurar middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Configurar vistas y estáticos
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.set('layout', 'layouts/main');

// Session
app.use(sessionConfig);

// Rutas
app.get('/', (req, res) => {
  res.redirect('/index-singin');
});

app.use(mainRouter);

app.get('/editor', (req, res) => {
  res.render('editor', { title: 'Editor de Página' });
});

// Socket.IO
socketController(io, sessionConfig);

// Sincronización y arranque del servidor
const startServer = async () => {
  try {
    // Verificamos si ya existe alguna tabla en la DB
    const [results] = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);

    const tablasYaExisten = results.length > 0;

    if (!tablasYaExisten) {
      // Solo sincroniza si no hay tablas aún
      await sessionStore.sync();
      console.log("✅ Tabla de sesiones sincronizada");

      await sequelize.sync({ force: false });
      console.log("✅ Modelos sincronizados con la base de datos");
    } else {
      console.log("🔁 Tablas ya existen. No se ejecuta sync()");
    }

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Servidor iniciado en el puerto ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Error al verificar/sincronizar tablas:", err);
  }
};

startServer();

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Error interno del servidor');
});
