/**
 * Utilidad de auditoría.
 * Escribe líneas JSON estructuradas en stdout — Railway las captura
 * en su panel de logs (Settings → Logs).
 *
 * Formato de cada línea:
 *   [AUDIT] {"ts":"…","action":"…","actor":"…","details":{…}}
 */

function log(action, actor, details = {}) {
  const entry = {
    ts    : new Date().toISOString(),
    action,
    actor : actor
      ? `${actor.nombre || '?'} (id:${actor.id}, rol:${actor.rol})`
      : 'sistema',
    ...details,
  };
  console.log('[AUDIT]', JSON.stringify(entry));
}

module.exports = { log };
