const { pool } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const isAdmin = req.user.rol === 'admin';
    const showAll = isAdmin && req.query.own !== 'true';

    const query = showAll
      ? `SELECT r.id, r.usuario_id, r.recurso_id, r.fecha_inicio, r.fecha_fin, r.notas, r.created_at,
                r.estado,
                r.comentario_entrega, r.fecha_entrega, r.firma_base64,
                u.nombre AS maestro_nombre, u.email AS maestro_email,
                rc.nombre AS recurso_nombre, rc.tipo AS recurso_tipo,
                recv.nombre AS recibido_por_nombre
         FROM reservas r
         JOIN usuarios u    ON r.usuario_id  = u.id
         JOIN recursos rc   ON r.recurso_id  = rc.id
         LEFT JOIN usuarios recv ON r.recibido_por = recv.id
         ORDER BY r.fecha_inicio DESC`
      : `SELECT r.id, r.usuario_id, r.recurso_id, r.fecha_inicio, r.fecha_fin, r.notas, r.created_at,
                CASE WHEN r.estado = 'confirmada' AND r.fecha_fin < NOW() THEN 'completada' ELSE r.estado END AS estado,
                r.comentario_entrega, r.fecha_entrega,
                u.nombre AS maestro_nombre,
                rc.nombre AS recurso_nombre, rc.tipo AS recurso_tipo
         FROM reservas r
         JOIN usuarios u  ON r.usuario_id = u.id
         JOIN recursos rc ON r.recurso_id = rc.id
         WHERE r.usuario_id = $1
         ORDER BY r.fecha_inicio DESC`;

    const params = showAll ? [] : [req.user.id];
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.create = async (req, res) => {
  try {
    const { recurso_id, fecha_inicio, fecha_fin, notas } = req.body;
    if (!recurso_id || !fecha_inicio || !fecha_fin)
      return res.status(400).json({ error: 'Recurso, fecha inicio y fecha fin son requeridos' });

    if (new Date(fecha_inicio) >= new Date(fecha_fin))
      return res.status(400).json({ error: 'La fecha de inicio debe ser anterior a la fecha de fin' });

    // Verificar conflicto de horario
    const { rows: conflictos } = await pool.query(
      `SELECT id FROM reservas
       WHERE recurso_id = $1
         AND estado = 'confirmada'
         AND NOT (fecha_fin <= $2 OR fecha_inicio >= $3)`,
      [recurso_id, fecha_inicio, fecha_fin]
    );

    if (conflictos.length > 0)
      return res.status(409).json({ error: 'El recurso ya está reservado en ese horario' });

    const { rows } = await pool.query(
      `INSERT INTO reservas (usuario_id, recurso_id, fecha_inicio, fecha_fin, notas)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, recurso_id, fecha_inicio, fecha_fin, notas || null]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.cancel = async (req, res) => {
  try {
    const isAdmin = req.user.rol === 'admin';
    const params  = isAdmin ? [req.params.id] : [req.params.id, req.user.id];
    const where   = isAdmin ? '' : ' AND usuario_id = $2';

    const { rows } = await pool.query(
      `UPDATE reservas SET estado = 'cancelada'
       WHERE id = $1${where} AND estado = 'confirmada' AND fecha_fin > NOW()
       RETURNING *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Reserva no encontrada, sin permiso o ya finalizada' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.entregar = async (req, res) => {
  try {
    const { firma_base64, comentario_entrega } = req.body;
    if (!firma_base64) return res.status(400).json({ error: 'La firma es requerida para registrar la entrega' });

    const { rows: check } = await pool.query(
      'SELECT id, estado FROM reservas WHERE id = $1',
      [req.params.id]
    );
    if (!check[0]) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (check[0].estado !== 'confirmada')
      return res.status(400).json({ error: 'Solo se pueden recibir reservas confirmadas' });

    const { rows } = await pool.query(
      `UPDATE reservas
       SET estado = 'completada',
           firma_base64       = $1,
           comentario_entrega = $2,
           fecha_entrega      = NOW(),
           recibido_por       = $3
       WHERE id = $4
       RETURNING id, estado, fecha_entrega`,
      [firma_base64, comentario_entrega?.trim() || null, req.user.id, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('[reservas.entregar]', err);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.disponibilidad = async (req, res) => {
  try {
    const { recurso_id, fecha_inicio, fecha_fin } = req.query;
    if (!recurso_id) return res.status(400).json({ error: 'recurso_id requerido' });

    // Reservas futuras del recurso
    const { rows: reservas_activas } = await pool.query(
      `SELECT fecha_inicio, fecha_fin FROM reservas
       WHERE recurso_id = $1 AND estado = 'confirmada' AND fecha_fin > NOW()
       ORDER BY fecha_inicio`,
      [recurso_id]
    );

    let disponible = true;
    if (fecha_inicio && fecha_fin) {
      const { rows: conflictos } = await pool.query(
        `SELECT id FROM reservas
         WHERE recurso_id = $1
           AND estado = 'confirmada'
           AND NOT (fecha_fin <= $2 OR fecha_inicio >= $3)`,
        [recurso_id, fecha_inicio, fecha_fin]
      );
      disponible = conflictos.length === 0;
    }

    res.json({ disponible, reservas_activas });
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};
