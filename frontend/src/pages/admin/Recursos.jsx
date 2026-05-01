import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const TIPOS = ['Proyector', 'Laptop', 'Tablet', 'Bocina', 'Cable HDMI', 'Extensión eléctrica', 'Otro'];
const emptyForm = { nombre: '', tipo: '', descripcion: '' };

/* ── Icono por tipo ── */
function TipoIcon({ tipo, className = 'w-6 h-6' }) {
  switch (tipo) {
    case 'Proyector':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>;
    case 'Laptop':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    case 'Tablet':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
    case 'Bocina':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M8.464 8.464A5 5 0 018.464 15.536M6 12H4m16 0h-2" /></svg>;
    case 'Cable HDMI':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
    case 'Extensión eléctrica':
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    default:
      return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
  }
}

const TIPO_COLORS = {
  'Proyector':           { bg: 'bg-blue-100',    text: 'text-blue-800',   icon: 'text-blue-600',   border: 'border-l-blue-500'   },
  'Laptop':              { bg: 'bg-violet-100',   text: 'text-violet-800', icon: 'text-violet-600', border: 'border-l-violet-500' },
  'Tablet':              { bg: 'bg-cyan-100',     text: 'text-cyan-800',   icon: 'text-cyan-600',   border: 'border-l-cyan-500'   },
  'Bocina':              { bg: 'bg-pink-100',     text: 'text-pink-800',   icon: 'text-pink-600',   border: 'border-l-pink-500'   },
  'Cable HDMI':          { bg: 'bg-slate-100',    text: 'text-slate-700',  icon: 'text-slate-500',  border: 'border-l-slate-400'  },
  'Extensión eléctrica': { bg: 'bg-amber-100',    text: 'text-amber-800',  icon: 'text-amber-600',  border: 'border-l-amber-500'  },
  'Otro':                { bg: 'bg-teal-100',     text: 'text-teal-800',   icon: 'text-teal-600',   border: 'border-l-teal-500'   },
};
function tipoStyle(tipo) { return TIPO_COLORS[tipo] || TIPO_COLORS['Otro']; }

/* ── Modal ── */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-base text-gray-800">{title}</h3>
          <button onClick={onClose} aria-label="Cerrar"
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
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

/* ── Skeleton ── */
function CardSkeleton() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse border-l-4 border-l-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 bg-gray-100 rounded-xl" />
            <div className="w-16 h-5 bg-gray-100 rounded-full" />
          </div>
          <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-full mb-4" />
          <div className="h-5 bg-gray-100 rounded-full w-28" />
        </div>
      ))}
    </>
  );
}

/* ── Componente principal ── */
export default function Recursos() {
  const [recursos,   setRecursos]   = useState([]);
  const [reservas,   setReservas]   = useState([]);
  const [form,       setForm]       = useState(emptyForm);
  const [editing,    setEditing]    = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [busqueda,   setBusqueda]   = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [cargando,   setCargando]   = useState(true);
  const [saving,     setSaving]     = useState(false);
  const chipsRef = useRef(null);

  const load = () => {
    setCargando(true);
    Promise.all([api.get('/recursos'), api.get('/reservas')])
      .then(([rRes, resRes]) => {
        setRecursos(rRes.data);
        setReservas(resRes.data.filter(r => r.estado === 'confirmada'));
      })
      .catch(() => {})
      .finally(() => setCargando(false));
  };
  useEffect(() => { load(); }, []);

  const reservasActivas = (id) => reservas.filter(r => r.recurso_id === id || r.recurso_id === String(id)).length;

  const filtrados = recursos.filter(r => {
    const matchNombre = r.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo   = tipoFiltro ? r.tipo === tipoFiltro : true;
    return matchNombre && matchTipo;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      editing
        ? await api.put(`/recursos/${editing}`, form)
        : await api.post('/recursos', form);
      toast.success(editing ? 'Recurso actualizado' : 'Recurso creado');
      setForm(emptyForm); setEditing(null); setShowForm(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleEdit = (r) => {
    setForm({ nombre: r.nombre, tipo: r.tipo, descripcion: r.descripcion || '' });
    setEditing(r.id); setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDel) return;
    try { await api.delete(`/recursos/${confirmDel}`); toast.success('Eliminado'); load(); }
    catch (err) { toast.error(err?.response?.data?.error || 'Error al eliminar', { duration: 5000 }); }
    finally { setConfirmDel(null); }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors";

  return (
    <div className="space-y-5">

      {/* ── Cabecera ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recursos</h1>
          <p className="text-sm text-gray-400 mt-0.5">{recursos.length} recursos · {reservas.length} reservas activas</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo recurso
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        {/* Búsqueda */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="text" placeholder="Buscar por nombre..."
            className={`${inputClass} pl-10 pr-10`}
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Chips de tipo — scroll horizontal en mobile */}
        <div ref={chipsRef} className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            onClick={() => setTipoFiltro('')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              !tipoFiltro ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            Todos ({recursos.length})
          </button>
          {TIPOS.map(t => {
            const count = recursos.filter(r => r.tipo === t).length;
            if (count === 0) return null;
            const s = tipoStyle(t);
            return (
              <button key={t} onClick={() => setTipoFiltro(tipoFiltro === t ? '' : t)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  tipoFiltro === t ? `${s.bg} ${s.text}` : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {t} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Modal form ── */}
      {showForm && (
        <Modal
          title={editing ? 'Editar recurso' : 'Nuevo recurso'}
          onClose={() => { setShowForm(false); setEditing(null); }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input required className={inputClass} placeholder="Ej: Proyector Sala A"
                value={form.nombre} onChange={e => set('nombre', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select required className={inputClass}
                value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                <option value="">Seleccionar tipo</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {/* Preview del tipo seleccionado */}
            {form.tipo && (
              <div className={`flex items-center gap-3 p-3 rounded-xl ${tipoStyle(form.tipo).bg}`}>
                <span className={tipoStyle(form.tipo).icon}>
                  <TipoIcon tipo={form.tipo} className="w-5 h-5" />
                </span>
                <span className={`text-sm font-medium ${tipoStyle(form.tipo).text}`}>
                  Vista previa: {form.nombre || 'Sin nombre'} · {form.tipo}
                </span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input className={inputClass} placeholder="Detalles adicionales"
                value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                {saving && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear recurso'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal confirmar eliminar ── */}
      {confirmDel && (
        <Modal title="Eliminar recurso" onClose={() => setConfirmDel(null)}>
          <div className="flex items-start gap-3 mb-5 p-3 bg-red-50 rounded-xl">
            <svg className="w-6 h-6 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-700">¿Eliminar este recurso? No se puede deshacer.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              Sí, eliminar
            </button>
            <button onClick={() => setConfirmDel(null)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* ── Grid de cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cargando ? (
          <CardSkeleton />
        ) : filtrados.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center">
            {busqueda || tipoFiltro ? (
              <>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-semibold text-sm">Sin resultados</p>
                <button onClick={() => { setBusqueda(''); setTipoFiltro(''); }}
                  className="mt-2 text-blue-600 hover:underline text-sm">Limpiar filtros</button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-gray-500 font-semibold text-sm">Sin recursos registrados</p>
                <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  + Nuevo recurso
                </button>
              </>
            )}
          </div>
        ) : (
          filtrados.map(r => {
            const activas = reservasActivas(r.id);
            const style   = tipoStyle(r.tipo);
            return (
              <div key={r.id}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col border-l-4 ${
                  activas > 0
                    ? 'border-gray-200 border-l-orange-400'
                    : `border-gray-200 ${style.border}`
                }`}
              >
                {/* Icono + badge tipo */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 ${style.bg} rounded-xl flex items-center justify-center`}>
                    <TipoIcon tipo={r.tipo} className={`w-6 h-6 ${style.icon}`} />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                    {r.tipo}
                  </span>
                </div>

                {/* Nombre + descripción */}
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{r.nombre}</h3>
                {r.descripcion && (
                  <p className="text-xs text-gray-500 mb-2 line-clamp-1" title={r.descripcion}>{r.descripcion}</p>
                )}

                {/* Estado reservas */}
                <div className="mt-auto pt-3">
                  {activas > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full border border-orange-200">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                      {activas} reserva{activas > 1 ? 's' : ''} activa{activas > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Disponible
                    </span>
                  )}
                </div>

                {/* Botones siempre visibles */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(r)}
                    title="Editar"
                    aria-label={`Editar ${r.nombre}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 py-2 rounded-lg transition-colors font-semibold"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmDel(r.id)}
                    title="Eliminar"
                    aria-label={`Eliminar ${r.nombre}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 py-2 rounded-lg transition-colors font-semibold"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
