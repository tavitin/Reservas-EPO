import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarioReservas from '../../components/CalendarioReservas';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function getGreetingIcon() {
  const h = new Date().getHours();
  if (h < 12) return '☀️';
  if (h < 19) return '🌤️';
  return '🌙';
}

/* ── Skeleton ── */
function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}

/* ── Config de stat cards (estilo admin: white + border-t accent) ── */
const STATS_CONFIG = [
  {
    key: 'activas',
    label: 'Reservas activas',
    border: 'border-t-blue-500',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'semana',
    label: 'Esta semana',
    border: 'border-t-emerald-500',
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
    key: 'mes',
    label: 'Este mes',
    border: 'border-t-violet-500',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function MaestroDashboard() {
  const { user } = useAuth();
  const isAdmin   = user?.rol === 'admin';
  const nuevaRuta = isAdmin ? '/admin/nueva-reserva' : '/maestro/nueva-reserva';
  const misRuta   = isAdmin ? '/admin/mis-reservas'  : '/maestro/mis-reservas';

  const [reservas, setReservas] = useState([]);
  const [vista, setVista]       = useState('proximas');
  const [cargando, setCargando] = useState(true);
  const [now, setNow]           = useState(new Date());

  useEffect(() => {
    setCargando(true);
    const params = isAdmin ? { own: 'true' } : {};
    api.get('/reservas', { params }).then(r => setReservas(r.data)).catch(() => {}).finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const semanaInicio = startOfWeek(now, { weekStartsOn: 1 });
  const semanaFin    = endOfWeek(now, { weekStartsOn: 1 });
  const mesInicio    = startOfMonth(now);
  const mesFin       = endOfMonth(now);

  const activas    = reservas.filter(r => r.estado === 'confirmada' && new Date(r.fecha_fin) > now);
  const estaSemana = reservas.filter(r => {
    const f = new Date(r.fecha_inicio);
    return r.estado === 'confirmada' && f >= semanaInicio && f <= semanaFin;
  });
  const esteMes = reservas.filter(r => {
    const f = new Date(r.fecha_inicio);
    return r.estado === 'confirmada' && f >= mesInicio && f <= mesFin;
  });
  const proximas = activas.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio)).slice(0, 5);

  const statsValues = { activas: activas.length, semana: estaSemana.length, mes: esteMes.length };

  const hoyStr = format(now, "EEEE d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ── Cabecera ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs sm:text-sm text-gray-400 font-medium capitalize">{hoyStr}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 flex items-center gap-2">
            {getGreeting()}, {user?.nombre?.split(' ')[0]}
            <span className="text-xl sm:text-2xl select-none">{getGreetingIcon()}</span>
          </h1>
        </div>
        <Link to={nuevaRuta}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva reserva
        </Link>
      </div>

      {/* ── Stat cards (estilo admin: white + border-t-4 accent) ── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {STATS_CONFIG.map(s => (
          <div key={s.key}
            className={`bg-white rounded-2xl border border-gray-200 border-t-4 ${s.border} p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-2 sm:mb-3`}>
              {s.icon}
            </div>
            {cargando
              ? <Skeleton className="h-6 sm:h-8 w-8 sm:w-12 mb-1" />
              : <p className={`text-xl sm:text-3xl font-extrabold leading-none ${s.color}`}>{statsValues[s.key]}</p>
            }
            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 font-semibold leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Acciones rápidas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Link to={nuevaRuta}
          className="bg-white hover:bg-blue-50/50 border border-gray-200 hover:border-blue-300 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm sm:text-base text-gray-900">Nueva Reserva</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Reserva proyectores, laptops y más</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link to={misRuta}
          className="bg-white hover:bg-violet-50/50 border border-gray-200 hover:border-violet-300 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm sm:text-base text-gray-900">Mis Reservas</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">Ver y cancelar reservas activas</p>
            </div>
            <svg className="w-5 h-5 text-gray-300 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* ── Próximas reservas / Calendario ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-200">
          <h2 className="text-sm sm:text-base font-bold text-gray-800">Mis próximas reservas</h2>
          <div className="flex gap-1 bg-gray-100 p-0.5 sm:p-1 rounded-lg">
            {[['proximas', 'Próximas'], ['calendario', 'Cal.']].map(([v, lbl]) => (
              <button key={v} onClick={() => setVista(v)}
                className={`px-2.5 sm:px-3 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
                  vista === v ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {vista === 'proximas' ? (
            cargando ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : proximas.length > 0 ? (
              <div className="space-y-2.5 sm:space-y-3">
                {proximas.map(r => {
                  const mins = differenceInMinutes(new Date(r.fecha_fin), new Date(r.fecha_inicio));
                  const dur = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}`;
                  return (
                    <div key={r.id}
                      className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 hover:bg-blue-50/60 rounded-xl border border-gray-100 hover:border-blue-200 transition-all">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">
                          {r.recurso_nombre}
                          <span className="text-gray-400 font-normal text-xs ml-1">({r.recurso_tipo})</span>
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                          <span>{format(new Date(r.fecha_inicio), "dd MMM", { locale: es })}</span>
                          <span className="text-gray-300">·</span>
                          <span>{format(new Date(r.fecha_inicio), "HH:mm")} – {format(new Date(r.fecha_fin), "HH:mm")}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-blue-500 font-medium">{dur}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold shrink-0">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Activa
                      </span>
                    </div>
                  );
                })}

                {activas.length > 5 && (
                  <Link to={misRuta}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 py-2 hover:bg-blue-50 rounded-xl transition-colors">
                    Ver todas ({activas.length})
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-10 sm:py-12">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-semibold">Sin reservas próximas</p>
                <p className="text-gray-400 text-sm mt-1">¡Crea tu primera reserva para comenzar!</p>
                <Link to={nuevaRuta}
                  className="inline-flex items-center gap-1.5 mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nueva Reserva
                </Link>
              </div>
            )
          ) : (
            <CalendarioReservas reservas={reservas} />
          )}
        </div>
      </div>
    </div>
  );
}
