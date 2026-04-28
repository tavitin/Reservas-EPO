import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CalendarioReservas from '../../components/CalendarioReservas';

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
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

function TableSkeleton() {
  return (
    <tbody className="animate-pulse">
      {[...Array(6)].map((_, i) => (
        <tr key={i} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
          <td className="px-4 py-3.5"><div className="h-4 bg-gray-200 rounded w-32" /></td>
          <td className="px-4 py-3.5"><div className="h-4 bg-gray-200 rounded w-28" /></td>
          <td className="px-4 py-3.5"><div className="h-4 bg-gray-200 rounded w-28" /></td>
          <td className="px-4 py-3.5"><div className="h-4 bg-gray-200 rounded w-24" /></td>
          <td className="px-4 py-3.5"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
          <td className="px-4 py-3.5"><div className="h-4 bg-gray-200 rounded w-16" /></td>
        </tr>
      ))}
    </tbody>
  );
}

const estadoBadge = (estado) => {
  if (estado === 'confirmada')  return { bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
  if (estado === 'cancelada')   return { bg: 'bg-red-100 text-red-700',         dot: 'bg-red-500' };
  if (estado === 'completada')  return { bg: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-400' };
  return { bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' };
};

export default function ReservasAdmin() {
  const [reservas, setReservas]         = useState([]);
  const [filtro, setFiltro]             = useState('todas');
  const [busqueda, setBusqueda]         = useState('');
  const [fechaDesde, setFechaDesde]     = useState('');
  const [fechaHasta, setFechaHasta]     = useState('');
  const [detalle, setDetalle]           = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [vista, setVista]               = useState('tabla');
  const [cargando, setCargando]         = useState(true);

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

  const exportPDF = () => {
    const fecha = format(new Date(), "dd/MM/yyyy HH:mm");
    const filas = filtered.map(r => `
      <tr>
        <td>${r.maestro_nombre}</td>
        <td>${r.recurso_nombre} <small>(${r.recurso_tipo})</small></td>
        <td>${format(new Date(r.fecha_inicio), 'dd/MM/yyyy HH:mm')}</td>
        <td>${format(new Date(r.fecha_fin), 'dd/MM/yyyy HH:mm')}</td>
        <td class="estado-${r.estado}">${r.estado}</td>
        <td>${r.notas || '—'}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <title>Reservas EPO</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#1f2937}
        h1{font-size:18px;margin-bottom:4px}
        .sub{color:#6b7280;font-size:12px;margin-bottom:20px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th{background:#1d4ed8;color:#fff;padding:8px 10px;text-align:left}
        td{padding:7px 10px;border-bottom:1px solid #e5e7eb}
        tr:nth-child(even) td{background:#f9fafb}
        .estado-confirmada{color:#065f46;font-weight:600}
        .estado-completada{color:#1d4ed8;font-weight:600}
        .estado-cancelada{color:#991b1b;font-weight:600}
        @media print{@page{margin:1.5cm}}
      </style></head><body>
      <h1>Reservas EPO</h1>
      <p class="sub">Generado: ${fecha} &mdash; ${filtered.length} registro(s)</p>
      <table><thead><tr>
        <th>Maestro</th><th>Recurso</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Notas</th>
      </tr></thead><tbody>${filas}</tbody></table>
      </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  const limpiarFiltros = () => { setBusqueda(''); setFechaDesde(''); setFechaHasta(''); };
  const hayFiltros = busqueda || fechaDesde || fechaHasta;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Todas las Reservas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{reservas.length} reservas en total</p>
        </div>
        <button
          onClick={exportPDF}
          title="Exportar a PDF"
          aria-label="Exportar reservas a PDF"
          className="flex items-center gap-1.5 text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Exportar PDF
        </button>
      </div>

      {/* Filtros de estado + toggle vista */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="flex gap-1.5 flex-wrap">
          {[['todas', 'Todas'], ['confirmada', 'Confirmadas'], ['completada', 'Completadas'], ['cancelada', 'Canceladas']].map(([val, label]) => (
            <button key={val} onClick={() => setFiltro(val)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filtro === val ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg ml-auto">
          <button onClick={() => setVista('tabla')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${vista === 'tabla' ? 'bg-white shadow font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            Tabla
          </button>
          <button onClick={() => setVista('calendario')}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors ${vista === 'calendario' ? 'bg-white shadow font-medium text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            Calendario
          </button>
        </div>
      </div>

      {/* Búsqueda y fechas */}
      <div className="flex flex-wrap gap-2 mb-5 items-center">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
          </div>
          <input type="text" placeholder="Buscar maestro o recurso..."
            className="border border-gray-300 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 hover:border-gray-400 transition-colors"
            value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Desde</span>
          <input type="date"
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
            value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} title="Desde" />
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Hasta</span>
          <input type="date"
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
            value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} title="Hasta" />
        </div>
        {hayFiltros && (
          <button onClick={limpiarFiltros}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Modales */}
      {detalle && (
        <Modal title="Detalle de reserva" onClose={() => setDetalle(null)}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Maestro</p>
                <p className="font-semibold text-gray-800">{detalle.maestro_nombre}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Recurso</p>
                <p className="font-semibold text-gray-800">{detalle.recurso_nombre}
                  <span className="text-gray-400 font-normal text-xs ml-1">({detalle.recurso_tipo})</span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Inicio</p>
                <p className="font-semibold text-gray-800">{format(new Date(detalle.fecha_inicio), "dd MMM yyyy HH:mm", { locale: es })}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-0.5">Fin</p>
                <p className="font-semibold text-gray-800">{format(new Date(detalle.fecha_fin), "dd MMM yyyy HH:mm", { locale: es })}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-1">Estado</p>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadoBadge(detalle.estado).bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${estadoBadge(detalle.estado).dot}`} />
                  {detalle.estado}
                </span>
              </div>
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
            <button onClick={handleCancel} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">Sí, cancelar</button>
            <button onClick={() => setConfirmCancel(null)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition-colors">No</button>
          </div>
        </Modal>
      )}

      {/* Vista tabla o calendario */}
      {vista === 'calendario' ? (
        <CalendarioReservas reservas={filtered} />
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Maestro</th>
                <th className="px-4 py-3 font-semibold">Recurso</th>
                <th className="px-4 py-3 font-semibold">Inicio</th>
                <th className="px-4 py-3 font-semibold">Fin</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Acción</th>
              </tr>
            </thead>
            {cargando ? (
              <TableSkeleton />
            ) : (
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <svg className="w-14 h-14 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500 font-medium">
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
                  filtered.map((r, idx) => {
                    const badge = estadoBadge(r.estado);
                    return (
                      <tr key={r.id}
                        className={`border-t cursor-pointer transition-colors group ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        } hover:bg-blue-50`}
                        onClick={() => setDetalle(r)}>
                        <td className="px-4 py-3.5 font-medium text-gray-800">{r.maestro_nombre}</td>
                        <td className="px-4 py-3.5">
                          <span className="font-medium text-gray-800">{r.recurso_nombre}</span>
                          <span className="text-gray-400 text-xs ml-1.5">({r.recurso_tipo})</span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {format(new Date(r.fecha_inicio), 'dd MMM yy HH:mm', { locale: es })}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {format(new Date(r.fecha_fin), 'dd MMM yy HH:mm', { locale: es })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {r.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {r.estado === 'confirmada' && (
                              <button
                                onClick={() => setConfirmCancel(r.id)}
                                title="Cancelar reserva"
                                aria-label="Cancelar reserva"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 text-xs px-2.5 py-1 rounded-lg transition-colors font-medium">
                                Cancelar
                              </button>
                            )}
                            <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      )}
    </div>
  );
}
