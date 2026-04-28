import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarioReservas from '../../components/CalendarioReservas';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function StatSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse">
          <div className="w-8 h-8 bg-gray-200 rounded-lg mb-2" />
          <div className="h-6 bg-gray-200 rounded w-8 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

const STATS_CONFIG = [
  {
    key: 'activas',
    label: 'Reservas activas',
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-400/30',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'semana',
    label: 'Esta semana',
    gradient: 'from-emerald-500 to-green-600',
    iconBg: 'bg-emerald-400/30',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'mes',
    label: 'Este mes',
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-400/30',
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function MaestroDashboard() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState([]);
  const [vista, setVista] = useState('proximas');
  const [cargando, setCargando] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setCargando(true);
    api.get('/reservas').then(r => setReservas(r.data)).catch(() => {}).finally(() => setCargando(false));
  }, []);

  // Actualiza "now" cada minuto para que los contadores reflejen expiración en tiempo real
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
  const proximas = activas.slice(0, 5);

  const statsValues = { activas: activas.length, semana: estaSemana.length, mes: esteMes.length };

  return (
    <div>
      {/* Saludo con hora del día */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="text-2xl font-bold text-gray-800">
            {getGreeting()}, {user?.nombre?.split(' ')[0]}
          </h1>
          <span className="text-2xl select-none">
            {new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 19 ? '🌤️' : '🌙'}
          </span>
        </div>
        <p className="text-gray-500 text-sm">
          {format(now, "EEEE d 'de' MMMM yyyy", { locale: es })} — Gestiona tus reservas de recursos escolares
        </p>
      </div>

      {/* Stats */}
      {cargando ? (
        <StatSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {STATS_CONFIG.map(s => (
            <div key={s.key}
              className={`bg-gradient-to-br ${s.gradient} text-white rounded-2xl p-4 shadow-md`}>
              <div className={`w-9 h-9 ${s.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold">{statsValues[s.key]}</p>
              <p className="text-xs opacity-85 mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Link to="/maestro/nueva-reserva"
          className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="font-semibold text-lg">Nueva Reserva</p>
              <p className="text-sm opacity-80 mt-0.5">Reserva proyectores, laptops y más</p>
            </div>
            <svg className="w-6 h-6 opacity-40 group-hover:opacity-70 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
        <Link to="/maestro/mis-reservas"
          className="bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-200 rounded-2xl p-6 shadow hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="font-semibold text-lg text-gray-800">Mis Reservas</p>
              <p className="text-sm text-gray-500 mt-0.5">Ver y cancelar reservas activas</p>
            </div>
            <svg className="w-6 h-6 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Vista próximas / calendario */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Mis próximas reservas</h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setVista('proximas')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${vista === 'proximas' ? 'bg-white shadow font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              Próximas
            </button>
            <button onClick={() => setVista('calendario')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${vista === 'calendario' ? 'bg-white shadow font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              Calendario
            </button>
          </div>
        </div>

        {vista === 'proximas' ? (
          cargando ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-100 rounded-xl">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-56" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-20" />
                </div>
              ))}
            </div>
          ) : proximas.length > 0 ? (
            <div className="space-y-3">
              {proximas.map(r => (
                <div key={r.id}
                  className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100/70 rounded-xl border border-blue-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">
                        {r.recurso_nombre}
                        <span className="text-gray-400 font-normal text-xs ml-1.5">({r.recurso_tipo})</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(new Date(r.fecha_inicio), "dd MMM yyyy HH:mm", { locale: es })}
                        <span className="mx-1 text-gray-300">→</span>
                        {format(new Date(r.fecha_fin), "HH:mm")}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-medium shrink-0">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    confirmada
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 font-medium text-base">Sin reservas próximas</p>
              <p className="text-gray-400 text-sm mt-1">¡Crea tu primera reserva para comenzar!</p>
              <Link to="/maestro/nueva-reserva"
                className="inline-flex items-center gap-1.5 mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
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
  );
}
