const { pool } = require('../config/db');
const audit   = require('../utils/audit');

exports.getAll = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM recursos WHERE activo = true ORDER BY tipo, nombre'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, tipo, descripcion } = req.body;
    if (!nombre || !tipo)
      return res.status(400).json({ error: 'Nombre y tipo son requeridos' });

    const { rows } = await pool.query(
      'INSERT INTO recursos (nombre, tipo, descripcion) VALUES ($1, $2, $3) RETURNING *',
      [nombre.trim(), tipo.trim(), descripcion?.trim() || null]
    );
    audit.log('RECURSO_CREADO', req.user, { recurso_id: rows[0].id, nombre: rows[0].nombre, tipo: rows[0].tipo });
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.update = async (req, res) => {
  try {
    const { nombre, tipo, descripcion } = req.body;
    if (!nombre || !tipo)
      return res.status(400).json({ error: 'Nombre y tipo son requeridos' });
    const { rows } = await pool.query(
      'UPDATE recursos SET nombre=$1, tipo=$2, descripcion=$3 WHERE id=$4 AND activo=true RETURNING *',
      [nombre, tipo, descripcion || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Recurso no encontrado' });
    audit.log('RECURSO_EDITADO', req.user, { recurso_id: rows[0].id, nombre: rows[0].nombre });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.remove = async (req, res) => {
  try {
    // Verificar si hay reservas activas (pendiente o confirmada) para este recurso
    const { rows: activas } = await pool.query(
      "SELECT id FROM reservas WHERE recurso_id=$1 AND estado IN ('pendiente','confirmada') LIMIT 1",
      [req.params.id]
    );
    if (activas.length > 0) {
      return res.status(409).json({
        error: 'No se puede eliminar el recurso porque tiene reservas activas. Cancela las reservas primero.'
      });
    }

    const { rows } = await pool.query(
      'UPDATE recursos SET activo=false WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Recurso no encontrado' });
    audit.log('RECURSO_ELIMINADO', req.user, { recurso_id: rows[0].id });
    res.json({ message: 'Recurso eliminado' });
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};
