import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { seedDatabase } from './db/seed.js';
import apiRoutes from './routes/apiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Seguridad con Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Permitir firmas en canvas y QR data URLs
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// CORS habilitado para frontend local y producción
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser(config.jwt.cookieSecret));

// Servir archivos estáticos subidos localmente
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Rutas de API
app.use('/api', apiRoutes);

// En producción, servir frontend compilado
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.resolve(clientDist, 'index.html'));
  });
}

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('💥 Error no controlado en servidor:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Error interno del servidor.',
    ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
  });
});

// Inicializar DB y Servidor
async function startServer() {
  try {
    await seedDatabase();
    app.listen(config.port, () => {
      console.log(`\n==================================================`);
      console.log(`⚡ NEXBYTE Manager Backend iniciado exitosamente`);
      console.log(`📡 Puerto: ${config.port}`);
      console.log(`🌍 Entorno: ${config.nodeEnv}`);
      console.log(`==================================================\n`);
    });
  } catch (err) {
    console.error('Error fatal al iniciar servidor:', err);
    process.exit(1);
  }
}

startServer();

export default app;
