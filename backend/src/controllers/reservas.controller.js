const { pool } = require('../config/db');
const audit    = require('../utils/audit');

/* ── Máquina de estados válida ──────────────────────────────────────────────
   confirmada → cancelada   (cancel)
   confirmada → completada  (entregar)
   Ninguna otra transición está permitida.
─────────────────────────────────────────────────────────────────────────── */
const TRANSICIONES = {
  cancelada  : ['confirmada'],
  completada : ['confirmada'],
};

function validarTransicion(estadoActual, estadoDestino) {
  const permitidos = TRANSICIONES[estadoDestino] || [];
  if (!permitidos.includes(estadoActual)) {
    return `No se puede pasar de "${estadoActual}" a "${estadoDestino}"`;
  }
  return null;
}

exports.getAll = async (req, res) => {
  try {
    const isAdmin = req.user.rol === 'admin';
    const showAll = isAdmin && req.query.own !== 'true';

    const query = showAll
      ? `SELECT r.id, r.usuario_id, r.recurso_id, r.fecha_inicio, r.fecha_fin, r.notas, r.created_at,
                CASE WHEN r.estado = 'confirmada' AND r.fecha_fin < NOW() THEN 'completada' ELSE r.estado END AS estado,
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

    audit.log('RESERVA_CREADA', req.user, {
      reserva_id : rows[0].id,
      recurso_id,
      fecha_inicio,
      fecha_fin,
    });

    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.cancel = async (req, res) => {
  try {
    // 1. Obtener estado actual
    const { rows: actual } = await pool.query(
      'SELECT id, estado, usuario_id, fecha_fin FROM reservas WHERE id = $1',
      [req.params.id]
    );
    if (!actual[0]) return res.status(404).json({ error: 'Reserva no encontrada' });

    const reserva    = actual[0];
    const isAdmin    = req.user.rol === 'admin';
    const esPropie   = reserva.usuario_id === req.user.id;

    if (!isAdmin && !esPropie)
      return res.status(403).json({ error: 'Sin permiso para cancelar esta reserva' });

    // 2. Validar transición de estado
    const errTransicion = validarTransicion(reserva.estado, 'cancelada');
    if (errTransicion) return res.status(400).json({ error: errTransicion });

    // 3. No cancelar reservas ya finalizadas
    if (new Date(reserva.fecha_fin) <= new Date())
      return res.status(400).json({ error: 'No se puede cancelar una reserva ya finalizada' });

    const { rows } = await pool.query(
      `UPDATE reservas SET estado = 'cancelada' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    audit.log('RESERVA_CANCELADA', req.user, {
      reserva_id  : reserva.id,
      estado_prev : reserva.estado,
    });

    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.entregar = async (req, res) => {
  try {
    const { firma_base64, comentario_entrega } = req.body;
    if (!firma_base64)
      return res.status(400).json({ error: 'La firma es requerida para registrar la entrega' });
    if (firma_base64.length > 200000)
      return res.status(400).json({ error: 'La firma es demasiado grande (máx 150 KB)' });

    // 1. Obtener estado actual
    const { rows: check } = await pool.query(
      'SELECT id, estado FROM reservas WHERE id = $1',
      [req.params.id]
    );
    if (!check[0]) return res.status(404).json({ error: 'Reserva no encontrada' });

    // 2. Validar transición de estado
    const errTransicion = validarTransicion(check[0].estado, 'completada');
    if (errTransicion) return res.status(400).json({ error: errTransicion });

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

    audit.log('ENTREGA_REGISTRADA', req.user, {
      reserva_id  : check[0].id,
      estado_prev : check[0].estado,
    });

    res.json(rows[0]);
  } catch (err) {
    console.error('[reservas.entregar]', err.message);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.disponibilidad = async (req, res) => {
  try {
    const { recurso_id, fecha_inicio, fecha_fin } = req.query;
    if (!recurso_id) return res.status(400).json({ error: 'recurso_id requerido' });

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
