const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const audit  = require('../utils/audit');

/**
 * Valida complejidad de contraseña.
 * Requiere: mínimo 8 chars, al menos 1 mayúscula y 1 número.
 * Retorna null si es válida, o un mensaje de error.
 */
function validarPassword(pwd) {
  if (!pwd || pwd.length < 8)      return 'La contraseña debe tener al menos 8 caracteres';
  if (!/[A-Z]/.test(pwd))          return 'La contraseña debe incluir al menos una letra mayúscula';
  if (!/[0-9]/.test(pwd))          return 'La contraseña debe incluir al menos un número';
  return null;
}

exports.getAll = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, nombre, email, rol, activo, created_at FROM usuarios ORDER BY rol, nombre"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, email, password, rol = 'maestro' } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    if (!['maestro', 'admin'].includes(rol))
      return res.status(400).json({ error: 'Rol inválido' });
    const errPwd = validarPassword(password);
    if (errPwd) return res.status(400).json({ error: errPwd });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol',
      [nombre.trim(), email.toLowerCase().trim(), hash, rol]
    );
    audit.log('USUARIO_CREADO', req.user, { nuevo_usuario: rows[0].email, rol });
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Ese email ya está registrado' });
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.getAdmins = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, nombre, email, rol, activo, created_at FROM usuarios WHERE rol = 'admin' ORDER BY nombre"
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.update = async (req, res) => {
  try {
    const { nombre, email } = req.body;
    if (!nombre || !email)
      return res.status(400).json({ error: 'Nombre y email son requeridos' });
    const { rows } = await pool.query(
      'UPDATE usuarios SET nombre = $1, email = $2 WHERE id = $3 RETURNING id, nombre, email, rol, activo',
      [nombre.trim(), email.toLowerCase().trim(), req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Ese email ya está registrado' });
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password_nuevo } = req.body;
    if (!password_nuevo)
      return res.status(400).json({ error: 'La nueva contraseña es requerida' });
    const errPwd = validarPassword(password_nuevo);
    if (errPwd) return res.status(400).json({ error: errPwd });

    // Verificar que el target no es otro admin (un admin no puede resetear a otro admin)
    const { rows: target } = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [req.params.id]);
    if (!target[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (target[0].rol === 'admin' && Number(req.params.id) !== req.user.id)
      return res.status(403).json({ error: 'No puedes modificar la contraseña de otro administrador' });

    const hash = await bcrypt.hash(password_nuevo, 10);
    const { rows } = await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2 RETURNING id, nombre',
      [hash, req.params.id]
    );
    audit.log('PASSWORD_RESET', req.user, { usuario_id: req.params.id, usuario_nombre: rows[0].nombre });
    res.json({ message: `Contraseña de ${rows[0].nombre} actualizada` });
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.toggle = async (req, res) => {
  try {
    // No puede desactivarse a sí mismo
    if (Number(req.params.id) === req.user.id)
      return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });

    // Un admin no puede desactivar a otro admin
    const { rows: target } = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [req.params.id]);
    if (!target[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (target[0].rol === 'admin')
      return res.status(403).json({ error: 'No puedes desactivar a otro administrador' });

    const { rows } = await pool.query(
      'UPDATE usuarios SET activo = NOT activo WHERE id = $1 RETURNING id, nombre, activo',
      [req.params.id]
    );
    audit.log('USUARIO_TOGGLE', req.user, {
      usuario_id     : rows[0].id,
      usuario_nombre : rows[0].nombre,
      nuevo_estado   : rows[0].activo ? 'activado' : 'desactivado',
    });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { password_actual, password_nuevo } = req.body;
    if (!password_actual || !password_nuevo)
      return res.status(400).json({ error: 'Ambas contraseñas son requeridas' });
    const errPwd = validarPassword(password_nuevo);
    if (errPwd) return res.status(400).json({ error: errPwd });

    const { rows } = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valida = await bcrypt.compare(password_actual, rows[0].password_hash);
    if (!valida) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

    const hash = await bcrypt.hash(password_nuevo, 10);
    await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};
