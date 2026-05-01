const jwt  = require('jsonwebtoken');
const { pool } = require('../config/db');

const isProd      = process.env.NODE_ENV === 'production';
const TOKEN_TTL   = '30m';
const COOKIE_OPTS = {
  httpOnly : true,
  secure   : isProd,
  sameSite : isProd ? 'none' : 'lax',
  maxAge   : 30 * 60 * 1000,
  path     : '/',
};

module.exports = async (req, res, next) => {
  // Prioridad: cookie httpOnly → Authorization header (compatibilidad)
  const token =
    req.cookies?.auth_token ||
    req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario sigue activo en la BD
    const { rows } = await pool.query(
      'SELECT id, rol, activo FROM usuarios WHERE id = $1',
      [payload.id]
    );
    if (!rows[0] || !rows[0].activo)
      return res.status(401).json({ error: 'Cuenta deshabilitada o no encontrada' });

    req.user = { ...payload, rol: rows[0].rol };

    // ── Sliding expiration ───────────────────────────────────────────────────
    // Si quedan menos de 10 minutos, renovar la cookie automáticamente
    // para que usuarios activos no sean expulsados innecesariamente
    const ahoraEpoch    = Math.floor(Date.now() / 1000);
    const minutosRestantes = Math.floor((payload.exp - ahoraEpoch) / 60);
    if (minutosRestantes < 10) {
      const { id, nombre, email, rol } = req.user;
      const nuevoToken = jwt.sign({ id, nombre, email, rol }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
      res.cookie('auth_token', nuevoToken, COOKIE_OPTS);
    }

    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
