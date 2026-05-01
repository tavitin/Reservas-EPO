const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

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
    if (!rows[0] || !rows[0].activo) {
      return res.status(401).json({ error: 'Cuenta deshabilitada o no encontrada' });
    }

    req.user = { ...payload, rol: rows[0].rol };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};
