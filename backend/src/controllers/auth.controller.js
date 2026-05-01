const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { pool } = require('../config/db');

const isProd = process.env.NODE_ENV === 'production';

const TOKEN_TTL    = '30m';                 // alineado con timeout de inactividad del frontend
const COOKIE_OPTS  = {
  httpOnly : true,                          // inaccesible desde JS (protege contra XSS)
  secure   : isProd,                        // solo HTTPS en producción
  sameSite : isProd ? 'none' : 'lax',       // cross-origin en prod (Railway), lax en dev
  maxAge   : 30 * 60 * 1000,               // 30 minutos en ms
  path     : '/',
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
      [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Credenciales incorrectas' });

    const payload = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });

    // Token en cookie httpOnly — no viaja en el body
    res.cookie('auth_token', token, COOKIE_OPTS);

    // Solo devolvemos datos del usuario (sin el token)
    res.json({ user: payload });
  } catch (err) {
    console.error('[auth.login]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.logout = (_req, res) => {
  res.clearCookie('auth_token', { ...COOKIE_OPTS, maxAge: 0 });
  res.json({ ok: true });
};

exports.me = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};
