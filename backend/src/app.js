require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { pool } = require('./config/db');
const { seedAdmin } = require('./config/seed');
const fs = require('fs');
const path = require('path');

const authRoutes     = require('./routes/auth.routes');
const recursosRoutes = require('./routes/recursos.routes');
const reservasRoutes = require('./routes/reservas.routes');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();

// Confiar en el proxy de Railway (necesario para que express-rate-limit identifique IPs correctamente)
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '50kb' }));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting estricto para autenticación y acciones sensibles
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/usuarios', sensitiveLimiter);
app.use('/api/auth',     authRoutes);
app.use('/api/recursos', recursosRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/usuarios', usuariosRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const PORT = process.env.PORT || 4000;

async function waitForDB(retries = 10, delay = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (err) {
      if (i === retries) throw err;
      console.log(`DB no disponible, reintentando (${i}/${retries})...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

(async () => {
  try {
    await waitForDB();
    console.log('Conectado a PostgreSQL');
    const initSQL = fs.readFileSync(path.join(__dirname, 'config/init.sql'), 'utf8');
    await pool.query(initSQL);
    console.log('Tablas inicializadas');
    await seedAdmin();
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
  } catch (err) {
    console.error('Error al iniciar servidor:', err.message);
    process.exit(1);
  }
})();
