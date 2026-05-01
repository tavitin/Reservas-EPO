import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { format, startOfWeek, addDays, isToday, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarioReservas from '../../components/CalendarioReservas';

/* ── Modal ── */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
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

/* ── helpers ── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/* ── gráfico semanal limpio ── */
function BarChart({ data, onDayClick }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const hoy = new Date().getDay(); // 0=dom,1=lun…
  return (
    <div className="flex items-end gap-1.5 h-28 pt-2">
      {data.map((d, i) => {
        // el index 0 = lunes (i+1 en .getDay())
        const esDia = (i + 1) % 7 === hoy;
        return (
          <button
            key={i}
            onClick={() => onDayClick?.(i)}
            disabled={d.value === 0}
            title={d.value > 0 ? `${d.value} reservas - Click para ver detalles` : 'Sin reservas'}
            className="flex-1 flex flex-col items-center gap-1 group disabled:cursor-default hover:disabled:opacity-50"
          >
            <span className={`text-[11px] font-semibold ${esDia ? 'text-blue-600' : 'text-gray-400'}`}>
              {d.value > 0 ? d.value : ''}
            </span>
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ${
                esDia ? 'bg-blue-500' : 'bg-blue-200'
              } ${d.value > 0 ? 'hover:opacity-80 cursor-pointer' : 'opacity-50'}`}
              style={{
                height: `${(d.value / max) * 88}%`,
                minHeight: d.value ? '4px' : '2px',
                opacity: d.value ? 1 : 0.25,
              }}
            />
            <span className={`text-[10px] capitalize font-medium ${esDia ? 'text-blue-600' : 'text-gray-400'}`}>
              {d.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── timeline del día ── */
function TimelineHoy({ reservas, onReservaClick }) {
  const HORA_INICIO = 7;
  const HORA_FIN    = 21;
  const TOTAL_MIN   = (HORA_FIN - HORA_INICIO) * 60;

  const hoy = reservas.filter(r => {
    if (r.estado === 'cancelada') return false;
    const ini = new Date(r.fecha_inicio);
    const fin = new Date(r.fecha_fin);
    const hoyDate = new Date();
    return ini.toDateString() === hoyDate.toDateString() || fin.toDateString() === hoyDate.toDateString();
  });

  const toPercent = (date) => {
    const d  = new Date(date);
    const min = (d.getHours() - HORA_INICIO) * 60 + d.getMinutes();
    return Math.max(0, Math.min(100, (min / TOTAL_MIN) * 100));
  };

  const ahoraPercent = (() => {
    const now = new Date();
    const min = (now.getHours() - HORA_INICIO) * 60 + now.getMinutes();
    return Math.max(0, Math.min(100, (min / TOTAL_MIN) * 100));
  })();

  const hours = Array.from({ length: HORA_FIN - HORA_INICIO + 1 }, (_, i) => HORA_INICIO + i);

  const COLORS = ['bg-blue-400', 'bg-emerald-400', 'bg-violet-400', 'bg-amber-400', 'bg-rose-400', 'bg-teal-400'];

  return (
    <div>
      {hoy.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No hay reservas programadas para hoy</p>
      ) : (
        <div className="relative">
          {/* Línea base */}
          <div className="relative h-10 bg-gray-100 rounded-xl overflow-hidden">
            {/* Línea de ahora */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
              style={{ left: `${ahoraPercent}%` }}
            />
            {/* Bloques de reservas */}
            {hoy.map((r, idx) => {
              const left  = toPercent(r.fecha_inicio);
              const right = toPercent(r.fecha_fin);
              const width = Math.max(right - left, 1);
              return (
                <button
                  key={r.id}
                  onClick={() => onReservaClick?.(r)}
                  title={`${r.maestro_nombre} — ${r.recurso_nombre}\nClick para ver detalles`}
                  className={`absolute top-1 bottom-1 rounded-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer ${COLORS[idx % COLORS.length]}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              );
            })}
          </div>

          {/* Eje de horas */}
          <div className="flex justify-between mt-1 px-0.5">
            {hours.filter((_, i) => i % 2 === 0).map(h => (
              <span key={h} className="text-[9px] text-gray-400">{h}h</span>
            ))}
          </div>

          {/* Leyenda */}
          <div className="mt-3 space-y-1">
            {hoy.map((r, idx) => (
              <div key={r.id} className="flex items-center gap-2 text-xs text-gray-600">
                <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${COLORS[idx % COLORS.length]}`} />
                <span className="font-medium truncate">{r.recurso_nombre}</span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500 truncate">{r.maestro_nombre}</span>
                <span className="ml-auto text-gray-400 whitespace-nowrap shrink-0">
                  {format(new Date(r.fecha_inicio), 'HH:mm')}–{format(new Date(r.fecha_fin), 'HH:mm')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── skeleton ── */
function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}

/* ── config cards ── */
const CARDS = [
  {
    key: 'recursos',
    label: 'Recursos activos',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    key: 'reservasHoy',
    label: 'Reservas hoy',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'maestros',
    label: 'Maestros',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'activas',
    label: 'Reservas activas',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const estadoBadge = (estado, fechaFin) => {
  if (estado === 'cancelada') return { bg: 'bg-red-50 text-red-700', dot: 'bg-red-400', label: 'Cancelada' };
  if (new Date(fechaFin) <= new Date()) return { bg: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400', label: 'Expirada' };
  return { bg: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', label: 'Confirmada' };
};

/* ── componente principal ── */
export default function AdminDashboard() {
  const [stats,         setStats]         = useState({ recursos: 0, reservasHoy: 0, maestros: 0, activas: 0 });
  const [recientes,     setRecientes]     = useState([]);
  const [todasReservas, setTodasReservas] = useState([]);
  const [semanaData,    setSemanaData]    = useState([]);
  const [vista,         setVista]         = useState('tabla');
  const [cargando,      setCargando]      = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [modalDia,      setModalDia]      = useState(null);
  const [modalReserva,  setModalReserva]  = useState(null);
  const [paginaActual,  setPaginaActual]  = useState(0);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setCargando(true);

    Promise.all([api.get('/recursos'), api.get('/reservas'), api.get('/usuarios')])
      .then(([rRes, reRes, uRes]) => {
        const hoy     = new Date().toDateString();
        const reservas = reRes.data;
        const ahora   = new Date();

        setTodasReservas(reservas);
        setStats({
          recursos:    rRes.data.length,
          reservasHoy: reservas.filter(r => r.estado === 'confirmada' && new Date(r.fecha_inicio).toDateString() === hoy).length,
          maestros:    uRes.data.length,
          activas:     reservas.filter(r => r.estado === 'confirmada' && new Date(r.fecha_fin) > ahora).length,
        });
        setRecientes(reservas.slice(0, 30));
        setPaginaActual(0);

        const lunes = startOfWeek(new Date(), { weekStartsOn: 1 });
        setSemanaData(
          Array.from({ length: 7 }, (_, i) => addDays(lunes, i)).map(dia => ({
            label: format(dia, 'EEE', { locale: es }),
            value: reservas.filter(r => new Date(r.fecha_inicio).toDateString() === dia.toDateString()).length,
          }))
        );
      })
      .catch(() => {})
      .finally(() => { setCargando(false); setRefreshing(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const hoyStr = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

  // Handlers para modales
  const handleClickDia = (dayIndex) => {
    const lunes = startOfWeek(new Date(), { weekStartsOn: 1 });
    const diaSeleccionado = addDays(lunes, dayIndex);
    const reservasDia = todasReservas.filter(r =>
      new Date(r.fecha_inicio).toDateString() === diaSeleccionado.toDateString()
    );
    setModalDia({ dia: diaSeleccionado, reservas: reservasDia });
  };

  const handleClickReserva = (reserva) => {
    setModalReserva(reserva);
  };

  return (
    <div className="space-y-6">

      {/* ── Cabecera ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs sm:text-sm text-gray-400 font-medium capitalize">{greeting()} · {hoyStr}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">Panel de administración</h1>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 bg-white hover:bg-blue-50 border border-gray-200 px-3 py-1.5 rounded-xl transition-all disabled:opacity-60 shadow-sm self-start sm:self-auto"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {CARDS.map(c => (
          <div key={c.key}
            className={`bg-white rounded-2xl border border-gray-200 border-t-4 ${c.bg.replace('bg-', 'border-t-').replace('-50', '-500')} p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${c.bg} ${c.color} rounded-xl flex items-center justify-center mb-2 sm:mb-3`}>
              {c.icon}
            </div>
            {cargando
              ? <Skeleton className="h-6 sm:h-8 w-10 sm:w-16 mb-1" />
              : <p className="text-xl sm:text-3xl font-extrabold text-gray-900 leading-none">{stats[c.key]}</p>
            }
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 font-semibold leading-tight">{c.label}</p>
          </div>
        ))}
      </div>

      {/* ── Fila: gráfico semanal + timeline hoy ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">

        {/* Gráfico semanal */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-bold text-gray-800">Reservas esta semana</h2>
            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Lun – Dom</span>
          </div>
          {cargando
            ? <Skeleton className="h-28" />
            : <BarChart data={semanaData} onDayClick={handleClickDia} />
          }
        </div>

        {/* Timeline del día */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-bold text-gray-800">Actividad de hoy</h2>
            <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              Ahora
            </span>
          </div>
          {cargando
            ? <Skeleton className="h-28" />
            : <TimelineHoy reservas={todasReservas} onReservaClick={handleClickReserva} />
          }
        </div>
      </div>

      {/* ── Reservas recientes / Calendario ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-200">
          <h2 className="text-sm sm:text-base font-bold text-gray-800">Reservas recientes</h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {['tabla', 'calendario'].map(v => (
              <button key={v} onClick={() => setVista(v)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors capitalize ${
                  vista === v ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {vista === 'tabla' ? (
            cargando ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : recientes.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 font-semibold">Sin reservas</p>
                <p className="text-gray-400 text-sm mt-1">Las reservas aparecerán aquí cuando los maestros las creen</p>
              </div>
            ) : (() => {
                const ITEMS_POR_PAGINA = 3;
                const totalPaginas = Math.ceil(recientes.length / ITEMS_POR_PAGINA);
                const paginados = recientes.slice(paginaActual * ITEMS_POR_PAGINA, (paginaActual + 1) * ITEMS_POR_PAGINA);

                return (
                  <div>
                    {/* Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-5">
                      {paginados.map(r => {
                        const b = estadoBadge(r.estado, r.fecha_fin);
                        const duracion = differenceInMinutes(new Date(r.fecha_fin), new Date(r.fecha_inicio));
                        const fechaInicio = new Date(r.fecha_inicio);
                        const fechaFin = new Date(r.fecha_fin);

                        return (
                          <button
                            key={r.id}
                            onClick={() => handleClickReserva(r)}
                            className="text-left p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 group"
                          >
                            {/* Header: Recurso + Estado */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                                  {r.recurso_nombre}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">{r.maestro_nombre}</p>
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${b.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                                {b.label}
                              </span>
                            </div>

                            {/* Tipo badge */}
                            <div className="mb-3 flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                {r.recurso_tipo}
                              </span>
                            </div>

                            {/* Info: Fecha, Hora, Duración */}
                            <div className="space-y-2 mb-3 p-2.5 bg-white rounded-lg border border-gray-100">
                              <div className="flex items-center gap-2 text-xs">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-gray-600 font-medium">
                                  {format(fechaInicio, 'dd MMM yyyy', { locale: es })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-gray-600 font-medium">
                                  {format(fechaInicio, 'HH:mm', { locale: es })} – {format(fechaFin, 'HH:mm', { locale: es })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="text-gray-600 font-medium">
                                  {duracion} min
                                </span>
                              </div>
                            </div>

                            {/* Usuario info */}
                            <div className="pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500">
                                <span className="font-medium text-gray-700">Usuario:</span> {r.usuario_nombre}
                              </p>
                            </div>

                            {/* Hover hint */}
                            <div className="mt-3 text-center">
                              <p className="text-xs text-gray-400 group-hover:text-blue-600 transition-colors">
                                Click para más detalles →
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Paginador */}
                    {totalPaginas > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 hidden sm:block">
                          Mostrando <span className="font-semibold text-gray-700">{paginaActual * ITEMS_POR_PAGINA + 1}–{Math.min((paginaActual + 1) * ITEMS_POR_PAGINA, recientes.length)}</span> de <span className="font-semibold text-gray-700">{recientes.length}</span>
                        </p>
                        <p className="text-xs text-gray-500 sm:hidden">
                          {paginaActual + 1} / {totalPaginas}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPaginaActual(p => Math.max(0, p - 1))}
                            disabled={paginaActual === 0}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>

                          {/* Números — solo desktop */}
                          <div className="hidden sm:flex items-center gap-1">
                            {Array.from({ length: totalPaginas }, (_, i) => (
                              <button
                                key={i}
                                onClick={() => setPaginaActual(i)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                                  paginaActual === i
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'border border-gray-200 text-gray-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => setPaginaActual(p => Math.min(totalPaginas - 1, p + 1))}
                            disabled={paginaActual === totalPaginas - 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
          ) : (
            <CalendarioReservas reservas={todasReservas} />
          )}
        </div>
      </div>

      {/* ── Modal: Reservas del día ── */}
      {modalDia && (
        <Modal
          title={`Reservas del ${format(modalDia.dia, 'EEEE d \'de\' MMMM', { locale: es })}`}
          onClose={() => setModalDia(null)}
        >
          {modalDia.reservas.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 font-medium">No hay reservas para este día</p>
            </div>
          ) : (
            <div className="space-y-3">
              {modalDia.reservas.map(r => (
                <div key={r.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-blue-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{r.recurso_nombre}</p>
                      <p className="text-sm text-gray-600">{r.maestro_nombre}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {r.recurso_tipo}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>
                      <strong>Inicio:</strong> {format(new Date(r.fecha_inicio), 'HH:mm')}
                    </p>
                    <p>
                      <strong>Fin:</strong> {format(new Date(r.fecha_fin), 'HH:mm')}
                    </p>
                    <p>
                      <strong>Duración:</strong> {differenceInMinutes(new Date(r.fecha_fin), new Date(r.fecha_inicio))} min
                    </p>
                    {r.notas && (
                      <p>
                        <strong>Notas:</strong> {r.notas}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* ── Modal: Detalle de reserva ── */}
      {modalReserva && (
        <Modal
          title={`Detalle de reserva`}
          onClose={() => setModalReserva(null)}
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Recurso</p>
                <p className="font-semibold text-gray-800 break-words">{modalReserva.recurso_nombre}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Tipo</p>
                <p className="font-semibold text-gray-800">{modalReserva.recurso_tipo}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Maestro</p>
                <p className="font-semibold text-gray-800 break-words">{modalReserva.maestro_nombre}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Usuario</p>
                <p className="font-semibold text-gray-800 break-words">{modalReserva.usuario_nombre}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Inicio</p>
                <p className="font-semibold text-gray-800">{format(new Date(modalReserva.fecha_inicio), 'dd MMM yyyy HH:mm', { locale: es })}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Fin</p>
                <p className="font-semibold text-gray-800">{format(new Date(modalReserva.fecha_fin), 'dd MMM yyyy HH:mm', { locale: es })}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Duración: <strong>{differenceInMinutes(new Date(modalReserva.fecha_fin), new Date(modalReserva.fecha_inicio))} minutos</strong>
              </span>
            </div>

            <div>
              <p className="text-gray-400 text-xs mb-1">Estado</p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                modalReserva.estado === 'cancelada'
                  ? 'bg-red-100 text-red-700'
                  : modalReserva.estado === 'completada'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  modalReserva.estado === 'cancelada'
                    ? 'bg-red-400'
                    : modalReserva.estado === 'completada'
                    ? 'bg-blue-400'
                    : 'bg-emerald-500'
                }`} />
                {modalReserva.estado}
              </span>
            </div>

            {modalReserva.notas && (
              <div className="pt-2 border-t">
                <p className="text-gray-400 text-xs mb-1">Notas</p>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-3 text-xs">{modalReserva.notas}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
