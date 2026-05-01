import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarioReservas from '../../components/CalendarioReservas';
import EntregaModal from '../../components/EntregaModal';

/* ── helpers ── */
function duracion(inicio, fin) {
  const min = differenceInMinutes(new Date(fin), new Date(inicio));
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const estadoBadge = (estado) => {
  if (estado === 'confirmada') return { bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', label: 'Confirmada' };
  if (estado === 'cancelada')  return { bg: 'bg-red-50 text-red-700',         dot: 'bg-red-400',    label: 'Cancelada'  };
  if (estado === 'completada') return { bg: 'bg-blue-50 text-blue-700',       dot: 'bg-blue-400',   label: 'Completada' };
  return { bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', label: estado };
};

/* ── Modal genérico ── */
function Modal({ title, children, onClose, maxW = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h3 className="font-semibold text-base text-gray-800">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar"
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ── Lightbox de firma ── */
function FirmaLightbox({ src, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-6 cursor-zoom-out"
      onClick={onClose}
    >
      <div className="bg-white rounded-2xl p-4 shadow-2xl max-w-xl w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">Firma del maestro</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="border rounded-xl overflow-hidden bg-gray-50 p-4">
          <img src={src} alt="Firma" className="w-full h-auto" />
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function TableSkeleton() {
  return (
    <tbody className="animate-pulse">
      {[...Array(6)].map((_, i) => (
        <tr key={i} className="border-t">
          <td className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded w-32" /></td>
          <td className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded w-28" /></td>
          <td className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded w-24" /></td>
          <td className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded w-12" /></td>
          <td className="px-4 py-3.5"><div className="h-5 bg-gray-100 rounded-full w-20" /></td>
          <td className="px-4 py-3.5"><div className="h-4 bg-gray-100 rounded w-16" /></td>
        </tr>
      ))}
    </tbody>
  );
}

/* ── PDF export ── */
function exportPDF(filtered) {
  const fecha = format(new Date(), "dd/MM/yyyy HH:mm");
  const filas = filtered.map(r => `
    <tr>
      <td>${r.maestro_nombre}</td>
      <td>${r.recurso_nombre} <small style="color:#6b7280">(${r.recurso_tipo})</small></td>
      <td>${format(new Date(r.fecha_inicio), 'dd/MM/yyyy HH:mm')}</td>
      <td>${format(new Date(r.fecha_fin), 'dd/MM/yyyy HH:mm')}</td>
      <td>${duracion(r.fecha_inicio, r.fecha_fin)}</td>
      <td class="estado-${r.estado}">${r.estado}</td>
      <td>${r.notas || '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Reservas EPO — ${fecha}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;padding:28px 32px;color:#111827;font-size:12px}
      header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid #1d4ed8}
      .logo{font-size:18px;font-weight:700;color:#1d4ed8}
      .logo span{font-weight:400;color:#6b7280;font-size:13px;display:block;margin-top:1px}
      .meta{color:#6b7280;text-align:right;font-size:11px}
      table{width:100%;border-collapse:collapse}
      th{background:#1d4ed8;color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:600;letter-spacing:.5px}
      td{padding:7px 10px;border-bottom:1px solid #f1f5f9;vertical-align:top}
      tr:last-child td{border-bottom:none}
      tr:nth-child(even) td{background:#f8fafc}
      .estado-confirmada{color:#065f46;font-weight:700}
      .estado-completada{color:#1d4ed8;font-weight:700}
      .estado-cancelada{color:#991b1b;font-weight:700}
      footer{margin-top:24px;text-align:center;color:#9ca3af;font-size:10px;border-top:1px solid #e5e7eb;padding-top:12px}
      @media print{@page{margin:1.5cm}header{-webkit-print-color-adjust:exact;print-color-adjust:exact}th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
    <header>
      <div class="logo">Reservas EPO<span>Sistema de gestión de recursos educativos</span></div>
      <div class="meta">Generado: ${fecha}<br>${filtered.length} registro(s)</div>
    </header>
    <table><thead><tr>
      <th>Maestro</th><th>Recurso</th><th>Inicio</th><th>Fin</th><th>Duración</th><th>Estado</th><th>Notas</th>
    </tr></thead><tbody>${filas}</tbody></table>
    <footer>© EPO 2026 — Documento generado automáticamente</footer>
    </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

/* ── componente principal ── */
export default function ReservasAdmin() {
  const [reservas,      setReservas]      = useState([]);
  const [filtro,        setFiltro]        = useState('todas');
  const [busqueda,      setBusqueda]      = useState('');
  const [fechaDesde,    setFechaDesde]    = useState('');
  const [fechaHasta,    setFechaHasta]    = useState('');
  const [detalle,       setDetalle]       = useState(null);
  const [firmaSrc,      setFirmaSrc]      = useState(null); // lightbox
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [entregaReserva, setEntregaReserva] = useState(null);
  const [vista,         setVista]         = useState('tabla');
  const [cargando,      setCargando]      = useState(true);
  const [filtrosOpen,   setFiltrosOpen]   = useState(false);

  /* ── Paginación ── */
  const PAGE_SIZE = 10;
  const [pagina, setPagina] = useState(1);

  const load = () => {
    setCargando(true);
    api.get('/reservas').then(r => setReservas(r.data)).catch(() => {}).finally(() => setCargando(false));
  };
  useEffect(() => { load(); }, []);

  const handleCancel = async () => {
    if (!confirmCancel) return;
    try { await api.put(`/reservas/${confirmCancel}/cancelar`); toast.success('Reserva cancelada'); load(); }
    catch { toast.error('Error al cancelar'); }
    finally { setConfirmCancel(null); }
  };

  const filtered = reservas.filter(r => {
    if (filtro !== 'todas' && r.estado !== filtro) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (!r.maestro_nombre?.toLowerCase().includes(q) && !r.recurso_nombre?.toLowerCase().includes(q)) return false;
    }
    if (fechaDesde && new Date(r.fecha_inicio) < new Date(fechaDesde)) return false;
    if (fechaHasta && new Date(r.fecha_inicio) > new Date(fechaHasta + 'T23:59:59')) return false;
    return true;
  });

  const hayFiltros = busqueda || fechaDesde || fechaHasta;
  const limpiarFiltros = () => { setBusqueda(''); setFechaDesde(''); setFechaHasta(''); };

  useEffect(() => { setPagina(1); }, [filtro, busqueda, fechaDesde, fechaHasta]);
  const totalPaginas = Math.ceil(filtered.length / PAGE_SIZE);
  const paginados    = filtered.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  const ESTADOS = [
    ['todas', 'Todas'],
    ['confirmada', 'Confirmadas'],
    ['completada', 'Completadas'],
    ['cancelada', 'Canceladas'],
  ];

  return (
    <div className="space-y-5">

      {/* ── Cabecera ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Todas las reservas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{reservas.length} reservas registradas</p>
        </div>
        <button
          onClick={() => exportPDF(filtered)}
          className="flex items-center gap-1.5 text-sm bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-2 rounded-xl transition-colors shadow-sm font-medium self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar PDF
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {/* Chips de estado + controles */}
        <div className="px-4 pt-4 pb-3 space-y-3">

          {/* Fila 1: chips con scroll horizontal — nunca wrappean */}
          <div
            className="flex gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {ESTADOS.map(([val, label]) => (
              <button key={val} onClick={() => setFiltro(val)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  filtro === val
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}>
                {label}
                {val === 'todas' && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    filtro === val ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {reservas.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Fila 2: Filtros (mobile) + Toggle vista */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltrosOpen(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all md:hidden shrink-0 ${
                filtrosOpen || hayFiltros
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filtros
              {hayFiltros && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
            </button>

            <div className="ml-auto flex gap-0.5 bg-gray-100 p-0.5 rounded-lg shrink-0">
              {[['tabla','Tabla'],['calendario','Cal.']].map(([v,lbl]) => (
                <button key={v} onClick={() => setVista(v)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
                    vista === v ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                  }`}>{lbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filtros avanzados — siempre visible en desktop, acordeón en mobile */}
        <div className={`border-t border-gray-200 px-4 py-3 flex flex-wrap gap-3 items-center
          ${filtrosOpen ? 'block' : 'hidden md:flex'}`}>

          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input
              type="text" placeholder="Buscar maestro o recurso..."
              className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 bg-white transition-colors"
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {/* Rango de fechas */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400">Desde</span>
            <input type="date"
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 bg-white transition-colors"
              value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400">Hasta</span>
            <input type="date"
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 bg-white transition-colors"
              value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {hayFiltros && (
              <button onClick={limpiarFiltros}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </button>
            )}
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── Modales ── */}

      {/* Detalle */}
      {detalle && (
        <Modal title="Detalle de reserva" onClose={() => setDetalle(null)} maxW="max-w-lg">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Maestro',   val: detalle.maestro_nombre },
                { label: 'Recurso',   val: `${detalle.recurso_nombre} (${detalle.recurso_tipo})` },
                { label: 'Inicio',    val: format(new Date(detalle.fecha_inicio), "dd MMM yyyy · HH:mm", { locale: es }) },
                { label: 'Fin',       val: format(new Date(detalle.fecha_fin),    "dd MMM yyyy · HH:mm", { locale: es }) },
                { label: 'Duración',  val: duracion(detalle.fecha_inicio, detalle.fecha_fin) },
              ].map(({ label, val }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-0.5">{label}</p>
                  <p className="font-semibold text-gray-800 text-sm">{val}</p>
                </div>
              ))}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-1">Estado</p>
                {(() => { const b = estadoBadge(detalle.estado); return (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${b.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                    {b.label}
                  </span>
                ); })()}
              </div>
            </div>

            {detalle.notas && (
              <div className="border-t pt-3">
                <p className="text-gray-400 text-xs mb-1">Notas</p>
                <p className="text-gray-700 bg-gray-50 rounded-xl p-3 text-sm whitespace-pre-wrap">{detalle.notas}</p>
              </div>
            )}

            {/* Acciones con jerarquía clara */}
            {detalle.estado === 'confirmada' && (
              <div className="border-t pt-3 space-y-2">
                <button
                  onClick={() => { setEntregaReserva(detalle); setDetalle(null); }}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-semibold shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Registrar entrega
                </button>
                <button
                  onClick={() => { setConfirmCancel(detalle.id); setDetalle(null); }}
                  className="w-full flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 text-xs px-4 py-2 rounded-xl transition-colors border border-red-100 font-medium"
                >
                  Cancelar reserva
                </button>
              </div>
            )}

            {/* Detalle de entrega completada */}
            {detalle.estado === 'completada' && detalle.fecha_entrega && (
              <div className="border-t pt-4 space-y-3">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Entrega registrada
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-0.5">Fecha de entrega</p>
                    <p className="font-semibold text-gray-800 text-xs">
                      {format(new Date(detalle.fecha_entrega), "dd MMM yyyy · HH:mm", { locale: es })}
                    </p>
                  </div>
                  {detalle.recibido_por_nombre && (
                    <div className="bg-emerald-50 rounded-xl p-3">
                      <p className="text-gray-400 text-xs mb-0.5">Recibido por</p>
                      <p className="font-semibold text-gray-800 text-xs">{detalle.recibido_por_nombre}</p>
                    </div>
                  )}
                </div>
                {detalle.comentario_entrega && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 text-xs mb-1">Observaciones</p>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{detalle.comentario_entrega}</p>
                  </div>
                )}
                {detalle.firma_base64 && (
                  <div>
                    <p className="text-gray-400 text-xs mb-1.5">Firma del maestro</p>
                    <button
                      onClick={() => setFirmaSrc(detalle.firma_base64)}
                      className="block w-full border border-gray-200 rounded-xl overflow-hidden bg-gray-50 hover:border-blue-300 transition-colors p-2 cursor-zoom-in group"
                    >
                      <img src={detalle.firma_base64} alt="Firma" className="max-h-20 w-auto mx-auto group-hover:opacity-80 transition-opacity" />
                      <p className="text-center text-[10px] text-gray-400 mt-1">Click para ampliar</p>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancelar */}
      {confirmCancel && (
        <Modal title="Cancelar reserva" onClose={() => setConfirmCancel(null)}>
          <div className="flex items-start gap-3 mb-5 p-3 bg-red-50 rounded-xl">
            <svg className="w-6 h-6 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-700 leading-relaxed">¿Cancelar esta reserva? Esta acción <strong>no se puede deshacer</strong>.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              Sí, cancelar
            </button>
            <button onClick={() => setConfirmCancel(null)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              No, mantener
            </button>
          </div>
        </Modal>
      )}

      {/* Entrega con firma */}
      {entregaReserva && (
        <EntregaModal
          reserva={entregaReserva}
          onClose={() => setEntregaReserva(null)}
          onSuccess={load}
        />
      )}

      {/* Lightbox firma */}
      {firmaSrc && <FirmaLightbox src={firmaSrc} onClose={() => setFirmaSrc(null)} />}

      {/* ── Vista ── */}
      {vista === 'calendario' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <CalendarioReservas reservas={filtered} />
        </div>
      ) : (
        <>
          {/* Tabla desktop */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr className="text-left text-gray-600 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">Maestro</th>
                  <th className="px-4 py-3 font-semibold">Recurso</th>
                  <th className="px-4 py-3 font-semibold">Inicio</th>
                  <th className="px-4 py-3 font-semibold">Duración</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              {cargando ? (
                <TableSkeleton />
              ) : (
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-semibold">
                          {hayFiltros ? 'Sin resultados para estos filtros' : 'Sin reservas registradas'}
                        </p>
                        {hayFiltros && (
                          <button onClick={limpiarFiltros} className="mt-2 text-blue-600 hover:underline text-sm">
                            Limpiar filtros
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginados.map((r) => {
                      const badge = estadoBadge(r.estado);
                      return (
                        <tr key={r.id}
                          className="border-t border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors group"
                          onClick={() => setDetalle(r)}>
                          <td className="px-4 py-3.5 font-medium text-gray-800">{r.maestro_nombre}</td>
                          <td className="px-4 py-3.5">
                            <span className="font-medium text-gray-700">{r.recurso_nombre}</span>
                            <span className="text-gray-400 text-xs ml-1.5">({r.recurso_tipo})</span>
                          </td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                            {format(new Date(r.fecha_inicio), 'dd MMM yy · HH:mm', { locale: es })}
                          </td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs font-medium">
                            {duracion(r.fecha_inicio, r.fecha_fin)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              {r.estado === 'confirmada' && (
                                <>
                                  {/* Recibir — botón principal */}
                                  <button
                                    onClick={() => setEntregaReserva(r)}
                                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors shadow-sm"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Recibir
                                  </button>
                                  {/* Cancelar — acción secundaria */}
                                  <button
                                    onClick={() => setConfirmCancel(r.id)}
                                    className="text-gray-400 hover:text-red-500 text-xs px-1.5 py-1.5 rounded-lg transition-colors hover:bg-red-50"
                                    title="Cancelar reserva"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </>
                              )}
                              <svg className="w-4 h-4 text-gray-200 group-hover:text-blue-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              )}
            </table>
          </div>

          {/* ── Paginador ── */}
          {!cargando && totalPaginas > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-700">{(pagina - 1) * PAGE_SIZE + 1}–{Math.min(pagina * PAGE_SIZE, filtered.length)}</span>
                <span className="hidden sm:inline"> de </span>
                <span className="hidden sm:inline font-semibold text-gray-700">{filtered.length} reservas</span>
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 1}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Anterior">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {/* Números en desktop */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPagina(n)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${n === pagina ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                      {n}
                    </button>
                  ))}
                </div>
                {/* Contador compacto en mobile */}
                <span className="sm:hidden text-xs font-semibold text-gray-700 px-2">
                  {pagina} / {totalPaginas}
                </span>
                <button onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label="Siguiente">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Cards mobile */}
          <div className="md:hidden space-y-3">
            {cargando ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-40" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-100 rounded-full w-20" />
                    <div className="h-6 bg-gray-100 rounded-full w-14" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-gray-400 text-sm">Sin resultados</p>
                {hayFiltros && (
                  <button onClick={limpiarFiltros} className="mt-2 text-blue-600 text-sm hover:underline">
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              paginados.map((r) => {
                const badge = estadoBadge(r.estado);
                return (
                  <div key={r.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer active:bg-gray-50 transition-colors"
                    onClick={() => setDetalle(r)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{r.maestro_nombre}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{r.recurso_nombre}
                          <span className="text-gray-400 ml-1">({r.recurso_tipo})</span>
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${badge.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <span>{format(new Date(r.fecha_inicio), 'dd MMM · HH:mm', { locale: es })}</span>
                      <span>→</span>
                      <span>{format(new Date(r.fecha_fin), 'HH:mm', { locale: es })}</span>
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded font-medium text-gray-500">
                        {duracion(r.fecha_inicio, r.fecha_fin)}
                      </span>
                    </div>
                    {r.estado === 'confirmada' && (
                      <div className="flex gap-2 pt-2 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setEntregaReserva(r)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-2 rounded-xl font-semibold transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Registrar entrega
                        </button>
                        <button
                          onClick={() => setConfirmCancel(r.id)}
                          className="text-gray-400 hover:text-red-500 text-xs px-3 py-2 rounded-xl hover:bg-red-50 transition-colors border border-gray-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
