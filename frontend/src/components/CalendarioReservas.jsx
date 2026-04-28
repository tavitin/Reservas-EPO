import { useState, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarioReservas({ reservas = [], onDiaClick }) {
  const [mes, setMes] = useState(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [animDir, setAnimDir] = useState(null); // 'left' | 'right'

  const celdas = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mes));
    const fin    = endOfWeek(endOfMonth(mes));
    const dias   = [];
    let cur = inicio;
    while (cur <= fin) { dias.push(cur); cur = addDays(cur, 1); }
    return dias;
  }, [mes]);

  const reservasPorDia = useMemo(() => {
    const mapa = {};
    reservas.forEach(r => {
      const key = format(new Date(r.fecha_inicio), 'yyyy-MM-dd');
      if (!mapa[key]) mapa[key] = [];
      mapa[key].push(r);
    });
    return mapa;
  }, [reservas]);

  const reservasDia = diaSeleccionado
    ? reservasPorDia[format(diaSeleccionado, 'yyyy-MM-dd')] || []
    : [];

  const handleDia = (dia) => {
    const key = format(dia, 'yyyy-MM-dd');
    const tieneReservas = reservasPorDia[key]?.length > 0;
    setDiaSeleccionado(tieneReservas ? (isSameDay(diaSeleccionado, dia) ? null : dia) : null);
    if (onDiaClick) onDiaClick(dia, reservasPorDia[key] || []);
  };

  const irMesAnterior = () => {
    setAnimDir('right');
    setTimeout(() => { setMes(subMonths(mes, 1)); setAnimDir(null); }, 150);
  };

  const irMesSiguiente = () => {
    setAnimDir('left');
    setTimeout(() => { setMes(addMonths(mes, 1)); setAnimDir(null); }, 150);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-5">
      {/* Encabezado del mes */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={irMesAnterior}
          aria-label="Mes anterior"
          title="Mes anterior"
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h3 className={`text-base font-bold capitalize text-gray-800 transition-opacity duration-150 ${animDir ? 'opacity-0' : 'opacity-100'}`}>
            {format(mes, 'MMMM yyyy', { locale: es })}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {reservas.length} reserva{reservas.length !== 1 ? 's' : ''} este mes
          </p>
        </div>
        <button
          onClick={irMesSiguiente}
          aria-label="Mes siguiente"
          title="Mes siguiente"
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Cabecera días semana */}
      <div className="grid grid-cols-7 mb-2">
        {DIAS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1 uppercase tracking-wide">{d}</div>
        ))}
      </div>

      {/* Grid de días */}
      <div className={`grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden transition-opacity duration-150 ${animDir ? 'opacity-0' : 'opacity-100'}`}>
        {celdas.map((dia, i) => {
          const key        = format(dia, 'yyyy-MM-dd');
          const rDia       = reservasPorDia[key] || [];
          const confirmadas = rDia.filter(r => r.estado === 'confirmada').length;
          const canceladas  = rDia.filter(r => r.estado === 'cancelada').length;
          const delMes     = isSameMonth(dia, mes);
          const hoy        = isToday(dia);
          const seleccionado = diaSeleccionado && isSameDay(dia, diaSeleccionado);

          return (
            <div
              key={i}
              onClick={() => delMes && handleDia(dia)}
              className={`bg-white min-h-[64px] p-2 transition-colors ${
                delMes ? 'cursor-pointer hover:bg-blue-50' : 'cursor-default opacity-35'
              } ${seleccionado ? 'ring-2 ring-blue-500 ring-inset bg-blue-50' : ''}
              ${hoy ? 'ring-2 ring-blue-600 ring-inset' : ''}`}
            >
              {/* Número del día */}
              <div className="flex justify-center mb-1.5">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors ${
                  hoy
                    ? 'bg-blue-600 text-white shadow-md'
                    : seleccionado
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700'
                }`}>
                  {format(dia, 'd')}
                </span>
              </div>

              {/* Puntos indicadores de reservas */}
              {delMes && rDia.length > 0 && (
                <div className="flex flex-wrap justify-center gap-0.5">
                  {/* Puntos confirmadas */}
                  {Array.from({ length: Math.min(confirmadas, 3) }).map((_, idx) => (
                    <span key={`c${idx}`} className="w-1.5 h-1.5 rounded-full bg-emerald-500" title={`${confirmadas} confirmada${confirmadas > 1 ? 's' : ''}`} />
                  ))}
                  {confirmadas > 3 && (
                    <span className="text-[9px] text-emerald-600 font-bold">+{confirmadas - 3}</span>
                  )}
                  {/* Puntos canceladas */}
                  {Array.from({ length: Math.min(canceladas, 2) }).map((_, idx) => (
                    <span key={`x${idx}`} className="w-1.5 h-1.5 rounded-full bg-red-400" title={`${canceladas} cancelada${canceladas > 1 ? 's' : ''}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 mt-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500">Confirmada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-xs text-gray-500">Cancelada</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-blue-600" />
          <span className="text-xs text-gray-500">Hoy</span>
        </div>
      </div>

      {/* Panel de reservas del día seleccionado */}
      {diaSeleccionado && reservasDia.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-700 capitalize">
              {format(diaSeleccionado, "EEEE d 'de' MMMM", { locale: es })}
            </h4>
            <button
              onClick={() => setDiaSeleccionado(null)}
              aria-label="Cerrar panel del día"
              title="Cerrar"
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {reservasDia.map(r => (
              <div key={r.id}
                className={`flex items-start gap-3 p-3 rounded-xl text-sm border ${
                  r.estado === 'confirmada'
                    ? 'bg-emerald-50 border-emerald-100'
                    : 'bg-red-50 border-red-100'
                }`}>
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  r.estado === 'confirmada' ? 'bg-emerald-500' : 'bg-red-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{r.recurso_nombre}</p>
                  {r.maestro_nombre && (
                    <p className="text-xs text-gray-500 truncate">{r.maestro_nombre}</p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {format(new Date(r.fecha_inicio), 'HH:mm')} — {format(new Date(r.fecha_fin), 'HH:mm')}
                  </p>
                  {r.notas && <p className="text-xs text-gray-400 truncate mt-0.5">{r.notas}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                  r.estado === 'confirmada'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {r.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
