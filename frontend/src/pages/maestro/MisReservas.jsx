import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { format, differenceInMinutes, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarioReservas from '../../components/CalendarioReservas';

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar" title="Cerrar"
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

function formatDuracion(inicio, fin) {
  const mins = differenceInMinutes(new Date(fin), new Date(inicio));
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/* Icono de recurso por tipo */
function RecursoIcon({ tipo, className = 'w-5 h-5' }) {
  switch (tipo) {
    case 'Laptop':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'Tablet':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'Bocina':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
      );
  }
}

function getEstadoVisual(estado) {
  if (estado === 'cancelada')   return { border: 'border-l-red-400',     badge: 'bg-red-100 text-red-700',       dotColor: 'bg-red-400' };
  if (estado === 'completada')  return { border: 'border-l-blue-300',    badge: 'bg-blue-100 text-blue-600',     dotColor: 'bg-blue-400' };
  return                               { border: 'border-l-emerald-400', badge: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-500' };
}

/* Calcula el porcentaje de duración transcurrida de una reserva activa */
function getProgressPercent(fechaInicio, fechaFin) {
  const now = new Date();
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (now < inicio) return 0; // No ha comenzado
  if (now > fin) return 100; // Ya finalizó

  const total = fin.getTime() - inicio.getTime();
  const elapsed = now.getTime() - inicio.getTime();
  return Math.round((elapsed / total) * 100);
}

function CardSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow border-l-4 border-l-gray-200 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-64" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-6 bg-gray-200 rounded-full w-20" />
            <div className="h-6 bg-gray-200 rounded w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MisReservas() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';
  const nuevaRuta = isAdmin ? '/admin/nueva-reserva' : '/maestro/nueva-reserva';

  const [reservas, setReservas]       = useState([]);
  const [filtro, setFiltro]           = useState('activas');
  const [busqueda, setBusqueda]       = useState('');
  const [detalle, setDetalle]         = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [vista, setVista]             = useState('lista');
  const [cargando, setCargando]       = useState(true);
  const [canceling, setCanceling]     = useState(false);

  const load = () => {
    setCargando(true);
    // El admin usa ?own=true para ver solo sus propias reservas (no todas)
    const params = isAdmin ? { own: 'true' } : {};
    api.get('/reservas', { params }).then(r => setReservas(r.data)).catch(() => {}).finally(() => setCargando(false));
  };
  useEffect(() => { load(); }, []);

  const handleCancel = async () => {
    if (!confirmCancel) return;
    setCanceling(true);
    try { await api.put(`/reservas/${confirmCancel}/cancelar`); toast.success('Reserva cancelada'); load(); }
    catch { toast.error('No se pudo cancelar'); }
    finally { setConfirmCancel(null); setCanceling(false); }
  };

  const filtered = reservas.filter(r => {
    const matchFiltro = filtro === 'activas'
      ? r.estado === 'confirmada'
      : filtro === 'historial'
      ? r.estado === 'completada' || r.estado === 'cancelada'
      : true;
    const matchBusqueda = busqueda
      ? r.recurso_nombre?.toLowerCase().includes(busqueda.toLowerCase())
      : true;
    return matchFiltro && matchBusqueda;
  });

  /* Estadísticas para la barra de contexto */
  const activas = reservas.filter(r => r.estado === 'confirmada').length;
  const thisWeek = (() => {
    const now = new Date();
    const semanaInicio = startOfWeek(now, { locale: es, weekStartsOn: 1 });
    const semanaFin = endOfWeek(now, { locale: es, weekStartsOn: 1 });
    return reservas.filter(r =>
      r.estado === 'confirmada' &&
      isWithinInterval(new Date(r.fecha_inicio), { start: semanaInicio, end: semanaFin })
    ).length;
  })();
  const historicas = reservas.filter(r => r.estado === 'completada' || r.estado === 'cancelada').length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Reservas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{reservas.length} reservas en total</p>
        </div>
        <Link to={nuevaRuta}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva reserva
        </Link>
      </div>

      {/* Barra de contexto de estadísticas para admin */}
      {isAdmin && (
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="flex-1 min-w-max bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-2xl font-bold text-emerald-600">{activas}</span>
            <span className="text-sm text-emerald-700 font-medium">activas</span>
          </div>
          <div className="flex-1 min-w-max bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">{thisWeek}</span>
            <span className="text-sm text-blue-700 font-medium">esta semana</span>
          </div>
          <div className="flex-1 min-w-max bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-600">{historicas}</span>
            <span className="text-sm text-slate-700 font-medium">históricas</span>
          </div>
        </div>
      )}

      {/* Filtros y vista */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {[['activas', 'Activas'], ['historial', 'Historial'], ['todas', 'Todas']].map(([val, label]) => (
          <button key={val} onClick={() => setFiltro(val)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filtro === val ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}>
            {label}
          </button>
        ))}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg ml-auto">
          <button onClick={() => setVista('lista')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${vista === 'lista' ? 'bg-white shadow font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            Lista
          </button>
          <button onClick={() => setVista('calendario')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${vista === 'calendario' ? 'bg-white shadow font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            Calendario
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="mb-5 relative max-w-xs">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
        </div>
        <input type="text" placeholder="Buscar por recurso..."
          className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
          value={busqueda} onChange={e => setBusqueda(e.target.value)} />
      </div>

      {/* Modal detalle */}
      {detalle && (
        <Modal title="Detalle de reserva" onClose={() => setDetalle(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Recurso</p>
                <p className="font-semibold text-gray-800">{detalle.recurso_nombre}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Tipo</p>
                <p className="font-semibold text-gray-800">{detalle.recurso_tipo}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Inicio</p>
                <p className="font-semibold text-gray-800">{format(new Date(detalle.fecha_inicio), "dd MMM yyyy HH:mm", { locale: es })}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Fin</p>
                <p className="font-semibold text-gray-800">{format(new Date(detalle.fecha_fin), "dd MMM yyyy HH:mm", { locale: es })}</p>
              </div>
            </div>
            {/* Duración en detalle */}
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Duración: <strong>{formatDuracion(detalle.fecha_inicio, detalle.fecha_fin)}</strong></span>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Estado</p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getEstadoVisual(detalle.estado).badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getEstadoVisual(detalle.estado).dotColor}`} />
                {detalle.estado}
              </span>
            </div>
            {detalle.notas && (
              <div className="pt-2 border-t">
                <p className="text-gray-400 text-xs mb-1">Notas</p>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-3">{detalle.notas}</p>
              </div>
            )}
            {detalle.estado === 'confirmada' && (
              <button onClick={() => { setConfirmCancel(detalle.id); setDetalle(null); }}
                className="flex items-center gap-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 text-sm px-3 py-2 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cancelar esta reserva
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Modal confirmación */}
      {confirmCancel && (
        <Modal title="Cancelar reserva" onClose={() => setConfirmCancel(null)}>
          <div className="flex items-center gap-3 mb-4 p-3 bg-red-50 rounded-xl">
            <svg className="w-7 h-7 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-700">¿Cancelar esta reserva? Esta acción no se puede deshacer.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCancel} disabled={canceling}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              {canceling && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {canceling ? 'Cancelando...' : 'Sí, cancelar'}
            </button>
            <button onClick={() => setConfirmCancel(null)}
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition-colors">No</button>
          </div>
        </Modal>
      )}

      {/* Vista lista o calendario */}
      {vista === 'calendario' ? (
        <CalendarioReservas reservas={filtered} />
      ) : cargando ? (
        <CardSkeleton />
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl shadow p-12 text-center">
          {busqueda ? (
            <>
              <svg className="w-14 h-14 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <p className="text-gray-500 font-medium">Sin resultados para "{busqueda}"</p>
              <button onClick={() => setBusqueda('')} className="mt-2 text-blue-600 hover:underline text-sm">
                Limpiar búsqueda
              </button>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 font-medium text-base">
                {filtro === 'activas' ? 'Sin reservas activas' : filtro === 'historial' ? 'Sin historial de reservas' : 'Sin reservas aún'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {filtro === 'activas' ? 'Crea una nueva reserva para verla aquí' : 'Tus reservas pasadas aparecerán aquí'}
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
        <div className="space-y-3">
          {filtered.map(r => {
            const visual  = getEstadoVisual(r.estado);
            const dur     = formatDuracion(r.fecha_inicio, r.fecha_fin);
            const activa  = r.estado === 'confirmada';

            return (
              <div key={r.id}
                className={`bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-200 border-l-4 ${visual.border} p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-blue-50/30 transition-all`}
                onClick={() => setDetalle(r)}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Icono tipo recurso */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    r.estado === 'confirmada' ? 'bg-emerald-50' : r.estado === 'cancelada' ? 'bg-red-50' : 'bg-gray-100'
                  }`}>
                    <RecursoIcon tipo={r.recurso_tipo} className={`w-5 h-5 ${
                      r.estado === 'confirmada' ? 'text-emerald-600' : r.estado === 'cancelada' ? 'text-red-400' : 'text-gray-400'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {r.recurso_nombre}
                      <span className="text-gray-400 font-normal text-xs ml-2">({r.recurso_tipo})</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {format(new Date(r.fecha_inicio), 'dd MMM yyyy HH:mm', { locale: es })}
                      <span className="mx-1.5 text-gray-300">→</span>
                      {format(new Date(r.fecha_fin), 'HH:mm')}
                      {dur && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-gray-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {dur}
                        </span>
                      )}
                    </p>
                    {r.notas && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.notas}</p>}

                    {/* Barra de progreso para reservas activas */}
                    {activa && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000"
                            style={{ width: `${getProgressPercent(r.fecha_inicio, r.fecha_fin)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {getProgressPercent(r.fecha_inicio, r.fecha_fin)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${visual.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${visual.dotColor}`} />
                    {r.estado}
                  </span>
                  {activa && (
                    <button
                      onClick={() => setConfirmCancel(r.id)}
                      title="Cancelar reserva"
                      aria-label="Cancelar reserva"
                      className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors font-medium">
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
    </div>
  );
}
