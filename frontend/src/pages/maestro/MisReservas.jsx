import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { format, differenceInMinutes, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarioReservas from '../../components/CalendarioReservas';

/* ── Modal ────────────────────────────────────────────────────────────────── */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar"
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function formatDuracion(inicio, fin) {
  const mins = differenceInMinutes(new Date(fin), new Date(inicio));
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function getProgressPercent(fechaInicio, fechaFin) {
  const now    = new Date();
  const inicio = new Date(fechaInicio);
  const fin    = new Date(fechaFin);
  if (now < inicio) return 0;
  if (now > fin)    return 100;
  return Math.round(((now - inicio) / (fin - inicio)) * 100);
}

/* Ícono por tipo de recurso */
function RecursoIcon({ tipo, className = 'w-5 h-5' }) {
  if (tipo === 'Laptop')
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
  if (tipo === 'Tablet')
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
  if (tipo === 'Bocina')
    return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072" /></svg>;
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>;
}

/* Paleta visual por estado */
function estadoVisual(estado) {
  if (estado === 'confirmada') return {
    border  : 'border-l-emerald-400',
    iconBg  : 'bg-emerald-50',
    iconTxt : 'text-emerald-600',
    badge   : 'bg-emerald-100 text-emerald-700',
    dot     : 'bg-emerald-500',
    label   : 'Confirmada',
  };
  if (estado === 'completada') return {
    border  : 'border-l-blue-400',
    iconBg  : 'bg-blue-50',
    iconTxt : 'text-blue-500',
    badge   : 'bg-blue-100 text-blue-700',
    dot     : 'bg-blue-400',
    label   : 'Completada',
  };
  return {
    border  : 'border-l-red-300',
    iconBg  : 'bg-red-50',
    iconTxt : 'text-red-400',
    badge   : 'bg-red-100 text-red-700',
    dot     : 'bg-red-400',
    label   : 'Cancelada',
  };
}

/* Skeleton */
function CardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 border-l-4 border-l-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-100 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-48" />
            <div className="h-3 bg-gray-100 rounded w-64" />
          </div>
          <div className="h-6 bg-gray-100 rounded-full w-24 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* ── Componente principal ─────────────────────────────────────────────────── */
export default function MisReservas() {
  const { user }  = useAuth();
  const isAdmin   = user?.rol === 'admin';
  const nuevaRuta = isAdmin ? '/admin/nueva-reserva' : '/maestro/nueva-reserva';

  const [reservas,      setReservas]      = useState([]);
  const [filtro,        setFiltro]        = useState('activas');
  const [busqueda,      setBusqueda]      = useState('');
  const [detalle,       setDetalle]       = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [vista,         setVista]         = useState('lista');
  const [cargando,      setCargando]      = useState(true);
  const [canceling,     setCanceling]     = useState(false);

  /* Paginación */
  const PAGE_SIZE = 6;
  const [pagina, setPagina] = useState(1);

  const load = () => {
    setCargando(true);
    const params = isAdmin ? { own: 'true' } : {};
    api.get('/reservas', { params })
      .then(r => setReservas(r.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  };
  useEffect(() => { load(); }, []);

  const handleCancel = async () => {
    if (!confirmCancel) return;
    setCanceling(true);
    try {
      await api.put(`/reservas/${confirmCancel}/cancelar`);
      toast.success('Reserva cancelada');
      load();
    } catch { toast.error('No se pudo cancelar'); }
    finally { setConfirmCancel(null); setCanceling(false); }
  };

  /* Contadores por estado (sin filtro de búsqueda) */
  const cntActivas    = reservas.filter(r => r.estado === 'confirmada').length;
  const cntHistorial  = reservas.filter(r => r.estado === 'completada' || r.estado === 'cancelada').length;
  const cntTodas      = reservas.length;

  /* Estadísticas de la semana */
  const semanaInicio = startOfWeek(new Date(), { locale: es, weekStartsOn: 1 });
  const semanaFin    = endOfWeek(new Date(),   { locale: es, weekStartsOn: 1 });
  const estaSemana   = reservas.filter(r =>
    r.estado === 'confirmada' &&
    isWithinInterval(new Date(r.fecha_inicio), { start: semanaInicio, end: semanaFin })
  ).length;
  const completadas  = reservas.filter(r => r.estado === 'completada').length;

  /* Filtrado */
  const filtered = reservas.filter(r => {
    const matchFiltro =
      filtro === 'activas'   ? r.estado === 'confirmada' :
      filtro === 'historial' ? r.estado === 'completada' || r.estado === 'cancelada' :
      true;
    const matchBusqueda = busqueda
      ? r.recurso_nombre?.toLowerCase().includes(busqueda.toLowerCase())
      : true;
    return matchFiltro && matchBusqueda;
  });

  useEffect(() => { setPagina(1); }, [filtro, busqueda]);
  const totalPaginas = Math.ceil(filtered.length / PAGE_SIZE);
  const paginados    = filtered.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  const FILTROS = [
    { val: 'activas',   label: 'Activas',   cnt: cntActivas   },
    { val: 'historial', label: 'Historial', cnt: cntHistorial },
    { val: 'todas',     label: 'Todas',     cnt: cntTodas     },
  ];

  return (
    <div className="space-y-5">

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Reservas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{reservas.length} reservas en total</p>
        </div>
        <Link to={nuevaRuta}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva reserva
        </Link>
      </div>

      {/* ── Tarjetas de estadísticas (todos los usuarios) ─────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Activas */}
        <div className="bg-white border border-emerald-200 rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600 leading-none">{cntActivas}</p>
            <p className="text-xs text-gray-500 mt-0.5">Activas</p>
          </div>
        </div>
        {/* Esta semana */}
        <div className="bg-white border border-blue-200 rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600 leading-none">{estaSemana}</p>
            <p className="text-xs text-gray-500 mt-0.5">Esta semana</p>
          </div>
        </div>
        {/* Completadas */}
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-600 leading-none">{completadas}</p>
            <p className="text-xs text-gray-500 mt-0.5">Completadas</p>
          </div>
        </div>
      </div>

      {/* ── Filtros + búsqueda + toggle vista ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        {/* Fila 1: tabs de filtro */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTROS.map(({ val, label, cnt }) => (
            <button key={val} onClick={() => setFiltro(val)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtro === val
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}>
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                filtro === val ? 'bg-white/25 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {cnt}
              </span>
            </button>
          ))}

          {/* Toggle vista */}
          <div className="ml-auto flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
            {[['lista', 'Lista'], ['calendario', 'Calendario']].map(([v, lbl]) => (
              <button key={v} onClick={() => setVista(v)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  vista === v ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Fila 2: búsqueda */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input type="text" placeholder="Buscar por nombre de recurso..."
            className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 bg-gray-50 transition-colors"
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          {busqueda && (
            <button onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Modales ───────────────────────────────────────────────────────── */}
      {detalle && (
        <Modal title="Detalle de reserva" onClose={() => setDetalle(null)}>
          <div className="space-y-4 text-sm">
            {/* Badge de estado */}
            {(() => { const v = estadoVisual(detalle.estado); return (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${v.iconBg}`}>
                <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                <span className={`text-sm font-semibold ${v.iconTxt}`}>{v.label}</span>
              </div>
            ); })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { lbl: 'Recurso', val: detalle.recurso_nombre },
                { lbl: 'Tipo',    val: detalle.recurso_tipo },
                { lbl: 'Inicio',  val: format(new Date(detalle.fecha_inicio), "dd MMM yyyy · HH:mm", { locale: es }) },
                { lbl: 'Fin',     val: format(new Date(detalle.fecha_fin),    "dd MMM yyyy · HH:mm", { locale: es }) },
              ].map(({ lbl, val }) => (
                <div key={lbl} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-gray-400 text-xs mb-0.5">{lbl}</p>
                  <p className="font-semibold text-gray-800">{val}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
              <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-600">Duración: <strong>{formatDuracion(detalle.fecha_inicio, detalle.fecha_fin)}</strong></span>
            </div>

            {detalle.notas && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-1">Notas</p>
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{detalle.notas}</p>
              </div>
            )}

            {detalle.estado === 'confirmada' && (
              <button onClick={() => { setConfirmCancel(detalle.id); setDetalle(null); }}
                className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-800 hover:bg-red-50 text-sm px-4 py-2.5 rounded-xl transition-colors border border-red-100 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cancelar esta reserva
              </button>
            )}
          </div>
        </Modal>
      )}

      {confirmCancel && (
        <Modal title="Cancelar reserva" onClose={() => setConfirmCancel(null)}>
          <div className="flex items-start gap-3 mb-5 p-3 bg-red-50 rounded-xl">
            <svg className="w-6 h-6 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-700">¿Cancelar esta reserva? Esta acción <strong>no se puede deshacer</strong>.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCancel} disabled={canceling}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              {canceling && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {canceling ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
            <button onClick={() => setConfirmCancel(null)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm transition-colors">
              No, mantener
            </button>
          </div>
        </Modal>
      )}

      {/* ── Vista ─────────────────────────────────────────────────────────── */}
      {vista === 'calendario' ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <CalendarioReservas reservas={filtered} />
        </div>
      ) : cargando ? (
        <CardSkeleton />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          {busqueda ? (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-semibold text-sm">Sin resultados para "{busqueda}"</p>
              <button onClick={() => setBusqueda('')} className="mt-2 text-blue-600 hover:underline text-sm">
                Limpiar búsqueda
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-600 font-semibold text-sm">
                {filtro === 'activas' ? 'Sin reservas activas' : filtro === 'historial' ? 'Sin historial de reservas' : 'Sin reservas aún'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {filtro === 'activas' ? 'Crea una nueva reserva para verla aquí' : 'Tus reservas completadas y canceladas aparecerán aquí'}
              </p>
              {filtro === 'activas' && (
                <Link to={nuevaRuta}
                  className="inline-flex items-center gap-1.5 mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Crear primera reserva
                </Link>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {paginados.map(r => {
            const v      = estadoVisual(r.estado);
            const dur    = formatDuracion(r.fecha_inicio, r.fecha_fin);
            const activa = r.estado === 'confirmada';

            return (
              <div key={r.id}
                className={`bg-white rounded-2xl border border-gray-200 border-l-4 ${v.border} shadow-sm hover:shadow-md hover:-translate-y-px transition-all cursor-pointer p-4 flex items-center gap-4`}
                onClick={() => setDetalle(r)}>

                {/* Ícono recurso */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${v.iconBg}`}>
                  <RecursoIcon tipo={r.recurso_tipo} className={`w-5 h-5 ${v.iconTxt}`} />
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {r.recurso_nombre}
                    <span className="text-gray-400 font-normal text-xs ml-1.5">({r.recurso_tipo})</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {format(new Date(r.fecha_inicio), 'dd MMM yyyy · HH:mm', { locale: es })}
                    <span className="mx-1 text-gray-300">→</span>
                    {format(new Date(r.fecha_fin), 'HH:mm')}
                    {dur && (
                      <span className="ml-2 text-gray-400">· {dur}</span>
                    )}
                  </p>
                  {r.notas && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.notas}</p>}

                  {/* Barra de progreso solo para activas */}
                  {activa && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000"
                          style={{ width: `${getProgressPercent(r.fecha_inicio, r.fecha_fin)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {getProgressPercent(r.fecha_inicio, r.fecha_fin)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end" onClick={e => e.stopPropagation()}>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${v.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
                    {v.label}
                  </span>
                  {activa && (
                    <button onClick={() => setConfirmCancel(r.id)}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors font-medium">
                      Cancelar
                    </button>
                  )}
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Paginador ─────────────────────────────────────────────────────── */}
      {!cargando && vista === 'lista' && totalPaginas > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3">
          <p className="text-xs text-gray-500">
            Mostrando <span className="font-semibold text-gray-700">{(pagina - 1) * PAGE_SIZE + 1}–{Math.min(pagina * PAGE_SIZE, filtered.length)}</span> de <span className="font-semibold text-gray-700">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPagina(n)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${n === pagina ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
