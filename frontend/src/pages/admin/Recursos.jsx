import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const TIPOS = ['Proyector', 'Laptop', 'Tablet', 'Bocina', 'Cable HDMI', 'Extensión eléctrica', 'Otro'];

const emptyForm = { nombre: '', tipo: '', descripcion: '' };

/* Icono SVG por tipo de recurso */
function TipoIcon({ tipo, className = 'w-7 h-7' }) {
  switch (tipo) {
    case 'Proyector':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.362a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
      );
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
            d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M8.464 8.464A5 5 0 018.464 15.536M6 12H4m16 0h-2" />
        </svg>
      );
    case 'Cable HDMI':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'Extensión eléctrica':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
  }
}

const TIPO_COLORS = {
  'Proyector':           { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: 'text-blue-500'   },
  'Laptop':              { bg: 'bg-violet-100',  text: 'text-violet-700', icon: 'text-violet-500' },
  'Tablet':              { bg: 'bg-cyan-100',    text: 'text-cyan-700',   icon: 'text-cyan-500'   },
  'Bocina':              { bg: 'bg-pink-100',    text: 'text-pink-700',   icon: 'text-pink-500'   },
  'Cable HDMI':          { bg: 'bg-gray-100',    text: 'text-gray-700',   icon: 'text-gray-500'   },
  'Extensión eléctrica': { bg: 'bg-amber-100',   text: 'text-amber-700',  icon: 'text-amber-500'  },
  'Otro':                { bg: 'bg-teal-100',    text: 'text-teal-700',   icon: 'text-teal-500'   },
};

function tipoStyle(tipo) {
  return TIPO_COLORS[tipo] || TIPO_COLORS['Otro'];
}

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

/* Skeleton para cards */
function CardSkeleton() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow p-5 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            <div className="w-16 h-5 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-full mb-4" />
          <div className="flex gap-2 mt-3">
            <div className="h-8 bg-gray-200 rounded-lg flex-1" />
            <div className="h-8 bg-gray-200 rounded-lg flex-1" />
          </div>
        </div>
      ))}
    </>
  );
}

export default function Recursos() {
  const [recursos, setRecursos]     = useState([]);
  const [reservas, setReservas]     = useState([]);
  const [form, setForm]             = useState(emptyForm);
  const [editing, setEditing]       = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [busqueda, setBusqueda]     = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);
  const [cargando, setCargando]     = useState(true);
  const [saving, setSaving]         = useState(false);

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

  const reservasActivas = (recursoId) =>
    reservas.filter(r => r.recurso_id === recursoId || r.recurso_id === String(recursoId)).length;

  const filtrados = recursos.filter(r => {
    const matchNombre = r.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = tipoFiltro ? r.tipo === tipoFiltro : true;
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
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setSaving(false); }
  };

  const handleEdit = (r) => {
    setForm({ nombre: r.nombre, tipo: r.tipo, descripcion: r.descripcion || '' });
    setEditing(r.id); setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDel) return;
    try { await api.delete(`/recursos/${confirmDel}`); toast.success('Eliminado'); load(); }
    catch (err) {
      const msg = err?.response?.data?.error || 'Error al eliminar';
      toast.error(msg, { duration: 5000 });
    }
    finally { setConfirmDel(null); }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recursos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{recursos.length} recursos disponibles</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo recurso
        </button>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 hover:border-gray-400 transition-colors"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setTipoFiltro('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!tipoFiltro ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            Todos
          </button>
          {TIPOS.map(t => (
            <button key={t} onClick={() => setTipoFiltro(tipoFiltro === t ? '' : t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${tipoFiltro === t ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Modal form */}
      {showForm && (
        <Modal title={editing ? 'Editar recurso' : 'Nuevo recurso'} onClose={() => { setShowForm(false); setEditing(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input required className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Proyector Sala A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select required className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                <option value="">Seleccionar tipo</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Detalles adicionales" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                {saving && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition-colors">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal confirmación eliminar */}
      {confirmDel && (
        <Modal title="Eliminar recurso" onClose={() => setConfirmDel(null)}>
          <div className="flex items-center gap-3 mb-4 p-3 bg-red-50 rounded-xl">
            <svg className="w-8 h-8 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-700">¿Eliminar este recurso? Esta acción no se puede deshacer.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">Sí, eliminar</button>
            <button onClick={() => setConfirmDel(null)}
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition-colors">Cancelar</button>
          </div>
        </Modal>
      )}

      {/* Grid de cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cargando ? (
          <CardSkeleton />
        ) : filtrados.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl shadow p-12 text-center">
            {busqueda || tipoFiltro ? (
              <>
                <svg className="w-14 h-14 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                </svg>
                <p className="text-gray-500 font-medium">Sin resultados</p>
                <button onClick={() => { setBusqueda(''); setTipoFiltro(''); }}
                  className="mt-2 text-blue-600 hover:underline text-sm">Limpiar filtros</button>
              </>
            ) : (
              <>
                <svg className="w-14 h-14 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500 font-medium">Sin recursos registrados</p>
                <p className="text-gray-400 text-sm mt-1">Agrega el primer recurso para comenzar</p>
                <button onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
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
                className="bg-white rounded-2xl shadow hover:shadow-md transition-shadow p-5 flex flex-col">
                {/* Icono + badge tipo */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${style.bg} rounded-xl flex items-center justify-center`}>
                    <TipoIcon tipo={r.tipo} className={`w-6 h-6 ${style.icon}`} />
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                    {r.tipo}
                  </span>
                </div>

                {/* Nombre */}
                <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-1">{r.nombre}</h3>
                {r.descripcion && (
                  <p className="text-xs text-gray-400 mb-2 truncate" title={r.descripcion}>{r.descripcion}</p>
                )}

                {/* Reservas activas */}
                <div className="mt-auto pt-3">
                  {activas > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                      {activas} reserva{activas > 1 ? 's' : ''} activa{activas > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Sin reservas activas</span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEdit(r)}
                    title="Editar recurso"
                    aria-label={`Editar ${r.nombre}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 px-3 py-2 rounded-lg transition-colors font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar
                  </button>
                  <button
                    onClick={() => setConfirmDel(r.id)}
                    title="Eliminar recurso"
                    aria-label={`Eliminar ${r.nombre}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 px-3 py-2 rounded-lg transition-colors font-medium">
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
