import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

/* ── helpers ── */
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-pink-500',
  'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
];
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function avatarColor(name = '') {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

/* ── Spinner ── */
function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ── Modal genérico ── */
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

/* ── Menú de acciones (···) ── */
function AccionesMenu({ maestro, onEdit, onPassword, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Acciones"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="5"  cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar datos
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onPassword(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Cambiar contraseña
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onToggle(); }}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
              maestro.activo
                ? 'text-red-600 hover:bg-red-50'
                : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {maestro.activo
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              }
            </svg>
            {maestro.activo ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Side Drawer de historial ── */
function HistorialDrawer({ maestro, reservas, onClose }) {
  const propias = reservas
    .filter(r => r.maestro_id === maestro.id || r.usuario_id === maestro.id)
    .slice(0, 10);

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${avatarColor(maestro.nombre)} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {getInitials(maestro.nombre)}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{maestro.nombre}</p>
              <p className="text-xs text-gray-400">{maestro.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Historial de reservas ({propias.length})
          </p>
          {propias.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin reservas registradas</p>
          ) : (
            propias.map(r => (
              <div key={r.id} className="bg-gray-50 rounded-xl p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800">{r.recurso_nombre}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    r.estado === 'confirmada' ? 'bg-emerald-100 text-emerald-700' :
                    r.estado === 'completada' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>{r.estado}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {format(new Date(r.fecha_inicio), 'dd MMM yyyy · HH:mm', { locale: es })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

/* ── Skeleton ── */
function ListSkeleton() {
  return (
    <div className="space-y-2 animate-pulse p-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
          <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-gray-100 rounded w-40" />
            <div className="h-3 bg-gray-100 rounded w-56" />
          </div>
          <div className="h-5 bg-gray-100 rounded-full w-16 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

/* ── Componente principal ── */
export default function Maestros() {
  const [maestros, setMaestros]         = useState([]);
  const [reservas, setReservas]         = useState([]);
  const [busqueda, setBusqueda]         = useState('');
  const [form, setForm]                 = useState({ nombre: '', email: '', password: '' });
  const [editForm, setEditForm]         = useState({ nombre: '', email: '' });
  const [editando, setEditando]         = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [resetPass, setResetPass]       = useState(null);
  const [newPass, setNewPass]           = useState('');
  const [drawerMaestro, setDrawerMaestro] = useState(null);
  const [cargando, setCargando]         = useState(true);
  const [saving, setSaving]             = useState(false);
  const [resetting, setResetting]       = useState(false);

  const load = () => {
    setCargando(true);
    Promise.all([api.get('/usuarios'), api.get('/reservas')])
      .then(([u, r]) => { setMaestros(u.data); setReservas(r.data); })
      .catch(() => {})
      .finally(() => setCargando(false));
  };
  useEffect(() => { load(); }, []);

  /* Reservas del mes actual por maestro */
  const mesInicio = startOfMonth(new Date());
  const mesFin    = endOfMonth(new Date());
  const resMes = (maestroId) =>
    reservas.filter(r =>
      (r.maestro_id === maestroId || r.usuario_id === maestroId) &&
      r.estado !== 'cancelada' &&
      new Date(r.fecha_inicio) >= mesInicio &&
      new Date(r.fecha_inicio) <= mesFin
    ).length;

  const filtrados = maestros.filter(m =>
    m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/usuarios', { ...form, rol: 'maestro' });
      toast.success(`Maestro creado — contraseña temporal: ${form.password}`, { duration: 6000 });
      setForm({ nombre: '', email: '', password: '' });
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/usuarios/${editando}`, editForm);
      toast.success('Maestro actualizado');
      setEditando(null);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al actualizar'); }
    finally { setSaving(false); }
  };

  const handleToggleConfirm = async () => {
    if (!confirmToggle) return;
    try {
      await api.put(`/usuarios/${confirmToggle.id}/toggle`);
      toast.success(confirmToggle.activo ? 'Maestro desactivado' : 'Maestro activado');
      load();
    } catch { toast.error('Error'); }
    finally { setConfirmToggle(null); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetting(true);
    try {
      const { data } = await api.put(`/usuarios/${resetPass.id}/reset-password`, { password_nuevo: newPass });
      toast.success(data.message || 'Contraseña actualizada', { duration: 5000 });
      setResetPass(null);
      setNewPass('');
    } catch (err) { toast.error(err.response?.data?.error || 'Error al cambiar contraseña'); }
    finally { setResetting(false); }
  };

  const inputClass = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 bg-white transition-colors";

  return (
    <div className="space-y-5">

      {/* ── Cabecera ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maestros</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {maestros.filter(m => m.activo).length} activos · {maestros.length} en total
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo maestro
        </button>
      </div>

      {/* ── Lista de contactos ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Búsqueda dentro de la tarjeta */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
            <input
              type="text" placeholder="Buscar por nombre o email..."
              className="w-full border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 bg-white transition-colors"
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
        </div>

        {/* Lista */}
        {cargando ? (
          <ListSkeleton />
        ) : filtrados.length === 0 ? (
          <div className="text-center py-14 px-4">
            {busqueda ? (
              <>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-semibold text-sm">Sin resultados para "{busqueda}"</p>
                <button onClick={() => setBusqueda('')} className="mt-2 text-blue-600 text-sm hover:underline">
                  Limpiar búsqueda
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-semibold text-sm">Sin maestros registrados</p>
                <button onClick={() => setShowForm(true)}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  Agregar primero
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtrados.map(m => {
              const resCount = resMes(m.id);
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => setDrawerMaestro(m)}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 ${avatarColor(m.nombre)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                      {getInitials(m.nombre)}
                    </div>
                    {/* Indicador activo/inactivo */}
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${m.activo ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{m.nombre}</p>
                    <p className="text-gray-500 text-xs truncate">{m.email}</p>
                  </div>

                  {/* Stat mes */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    {resCount > 0 && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {resCount} este mes
                      </span>
                    )}
                    {!m.activo && (
                      <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        Inactivo
                      </span>
                    )}
                  </div>

                  {/* Menú acciones */}
                  <AccionesMenu
                    maestro={m}
                    onEdit={() => { setEditando(m.id); setEditForm({ nombre: m.nombre, email: m.email }); }}
                    onPassword={() => { setResetPass({ id: m.id, nombre: m.nombre }); setNewPass(''); }}
                    onToggle={() => setConfirmToggle({ id: m.id, activo: m.activo, nombre: m.nombre })}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modales ── */}

      {/* Nuevo maestro */}
      {showForm && (
        <Modal title="Nuevo maestro" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input required className={inputClass} placeholder="Ej: Ana López"
                value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input required type="email" className={inputClass} placeholder="correo@epo.edu.mx"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal</label>
              <input required type="password" minLength={6} className={inputClass} placeholder="Mín. 6 caracteres"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                {saving && <Spinner />}
                {saving ? 'Creando...' : 'Crear maestro'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Editar maestro */}
      {editando && (
        <Modal title="Editar maestro" onClose={() => setEditando(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input required className={inputClass}
                value={editForm.nombre} onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input required type="email" className={inputClass}
                value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                {saving && <Spinner />}
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={() => setEditando(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Toggle estado */}
      {confirmToggle && (
        <Modal
          title={confirmToggle.activo ? 'Desactivar maestro' : 'Activar maestro'}
          onClose={() => setConfirmToggle(null)}
        >
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
            <div className={`w-10 h-10 ${avatarColor(confirmToggle.nombre)} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {getInitials(confirmToggle.nombre)}
            </div>
            <p className="font-semibold text-gray-800 text-sm">{confirmToggle.nombre}</p>
          </div>
          <p className="text-sm text-gray-600 mb-5">
            {confirmToggle.activo
              ? '¿Desactivar este maestro? No podrá iniciar sesión hasta que sea reactivado.'
              : '¿Activar este maestro? Podrá iniciar sesión nuevamente.'}
          </p>
          <div className="flex gap-2">
            <button onClick={handleToggleConfirm}
              className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${
                confirmToggle.activo ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}>
              {confirmToggle.activo ? 'Sí, desactivar' : 'Sí, activar'}
            </button>
            <button onClick={() => setConfirmToggle(null)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm transition-colors">
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* Reset contraseña */}
      {resetPass && (
        <Modal title={`Cambiar contraseña`} onClose={() => { setResetPass(null); setNewPass(''); }}>
          <div className="flex items-center gap-2.5 mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm text-amber-700">Nueva contraseña para <strong>{resetPass.nombre}</strong></p>
          </div>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input required type="password" minLength={6} autoFocus className={inputClass}
                placeholder="Mín. 6 caracteres" value={newPass} onChange={e => setNewPass(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={resetting}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                {resetting && <Spinner />}
                {resetting ? 'Guardando...' : 'Guardar contraseña'}
              </button>
              <button type="button" onClick={() => { setResetPass(null); setNewPass(''); }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Drawer de historial */}
      {drawerMaestro && (
        <HistorialDrawer
          maestro={drawerMaestro}
          reservas={reservas}
          onClose={() => setDrawerMaestro(null)}
        />
      )}
    </div>
  );
}
