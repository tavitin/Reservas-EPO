import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarioReservas from '../../components/CalendarioReservas';

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-32 pt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 font-medium">{d.value || ''}</span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${(d.value / max) * 90}%`,
              minHeight: d.value ? '4px' : '2px',
              opacity: d.value ? 1 : 0.2,
              background: d.value
                ? 'linear-gradient(to top, #2563eb, #60a5fa)'
                : '#e5e7eb',
            }}
          />
          <span className="text-[10px] text-gray-400 capitalize">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* Skeleton loader para tabla */
function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

const CARD_CONFIG = [
  {
    label: 'Recursos activos',
    key: 'recursos',
    gradient: 'from-blue-500 to-blue-700',
    icon: (
      <svg className="w-7 h-7 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    label: 'Reservas hoy',
    key: 'reservasHoy',
    gradient: 'from-emerald-500 to-green-600',
    icon: (
      <svg className="w-7 h-7 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Maestros',
    key: 'maestros',
    gradient: 'from-violet-500 to-purple-700',
    icon: (
      <svg className="w-7 h-7 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Reservas activas',
    key: 'activas',
    gradient: 'from-orange-400 to-orange-600',
    icon: (
      <svg className="w-7 h-7 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const estadoBadge = (estado, fechaFin) => {
  if (estado === 'cancelada') return { bg: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: 'cancelada' };
  if (new Date(fechaFin) <= new Date()) return { bg: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400', label: 'expirada' };
  return { bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'confirmada' };
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ recursos: 0, reservasHoy: 0, maestros: 0, activas: 0 });
  const [recientes, setRecientes] = useState([]);
  const [todasReservas, setTodasReservas] = useState([]);
  const [semanaData, setSemanaData] = useState([]);
  const [vista, setVista] = useState('tabla');
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setCargando(true);

    Promise.all([api.get('/recursos'), api.get('/reservas'), api.get('/usuarios')])
      .then(([rRes, reRes, uRes]) => {
        const hoy = new Date().toDateString();
        const reservas = reRes.data;
        setTodasReservas(reservas);
        const ahora = new Date();
        setStats({
          recursos:    rRes.data.length,
          reservasHoy: reservas.filter(r => r.estado === 'confirmada' && new Date(r.fecha_inicio).toDateString() === hoy).length,
          maestros:    uRes.data.length,
          activas:     reservas.filter(r => r.estado === 'confirmada' && new Date(r.fecha_fin) > ahora).length,
        });
        setRecientes(reservas.slice(0, 8));

        const lunes = startOfWeek(new Date(), { weekStartsOn: 1 });
        const dias = Array.from({ length: 7 }, (_, i) => addDays(lunes, i));
        setSemanaData(dias.map(dia => ({
          label: format(dia, 'EEE', { locale: es }),
          value: reservas.filter(r => new Date(r.fecha_inicio).toDateString() === dia.toDateString()).length,
        })));
      })
      .catch(() => {})
      .finally(() => { setCargando(false); setRefreshing(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-0.5">Resumen general del sistema</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          title="Actualizar datos"
          aria-label="Actualizar datos"
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Cards de stats con gradiente */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {CARD_CONFIG.map(c => (
          <div key={c.label}
            className={`bg-gradient-to-br ${c.gradient} text-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-bold">{stats[c.key]}</p>
                <p className="text-sm opacity-90 mt-1 leading-tight">{c.label}</p>
              </div>
              <div className="opacity-70 mt-0.5">{c.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico semanal */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">Reservas esta semana</h2>
          <span className="text-xs text-gray-400">Lun — Dom</span>
        </div>
        {cargando
          ? <div className="h-32 animate-pulse bg-gray-100 rounded-xl" />
          : <BarChart data={semanaData} />
        }
      </div>

      {/* Reservas: tabla o calendario */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Reservas recientes</h2>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setVista('tabla')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${vista === 'tabla' ? 'bg-white shadow font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              Tabla
            </button>
            <button onClick={() => setVista('calendario')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${vista === 'calendario' ? 'bg-white shadow font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
              Calendario
            </button>
          </div>
        </div>

        {vista === 'tabla' ? (
          cargando ? (
            <TableSkeleton />
          ) : recientes.length === 0 ? (
            /* Empty state */
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 font-medium">Sin reservas registradas</p>
              <p className="text-gray-400 text-sm mt-1">Las reservas aparecerán aquí cuando los maestros las creen</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 pr-4 font-semibold text-xs uppercase tracking-wide">Maestro</th>
                    <th className="pb-3 pr-4 font-semibold text-xs uppercase tracking-wide">Recurso</th>
                    <th className="pb-3 pr-4 font-semibold text-xs uppercase tracking-wide">Fecha inicio</th>
                    <th className="pb-3 font-semibold text-xs uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recientes.map((r, idx) => (
                    <tr key={r.id}
                      className={`border-b last:border-0 hover:bg-blue-50 cursor-pointer transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'
                      }`}>
                      <td className="py-3 pr-4 font-medium text-gray-800">{r.maestro_nombre}</td>
                      <td className="py-3 pr-4 text-gray-600">{r.recurso_nombre}</td>
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                        {format(new Date(r.fecha_inicio), 'dd MMM yyyy HH:mm', { locale: es })}
                      </td>
                      <td className="py-3">
                        {(() => { const b = estadoBadge(r.estado, r.fecha_fin); return (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${b.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                            {b.label}
                          </span>
                        ); })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <CalendarioReservas reservas={todasReservas} />
        )}
      </div>
    </div>
  );
}
