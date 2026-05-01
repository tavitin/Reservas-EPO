import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-purple-500', 'bg-indigo-500',
  'bg-fuchsia-500', 'bg-blue-600', 'bg-pink-600', 'bg-slate-500',
];

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function avatarColor(name = '') {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
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

function TableSkeleton() {
  return (
    <tbody className="animate-pulse">
      {[...Array(3)].map((_, i) => (
        <tr key={i} className="border-t">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
              <div className="h-4 bg-gray-200 rounded w-36" />
            </div>
          </td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48" /></td>
          <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded-full w-16" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
        </tr>
      ))}
    </tbody>
  );
}

export default function Admins() {
  const { user: me } = useAuth();
  const [admins, setAdmins]           = useState([]);
  const [busqueda, setBusqueda]       = useState('');
  const [form, setForm]               = useState({ nombre: '', email: '', password: '' });
  const [editForm, setEditForm]       = useState({ nombre: '', email: '' });
  const [editando, setEditando]       = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [resetPass, setResetPass]     = useState(null);
  const [newPass, setNewPass]         = useState('');
  const [cargando, setCargando]       = useState(true);
  const [saving, setSaving]           = useState(false);
  const [resetting, setResetting]     = useState(false);

  const load = () => {
    setCargando(true);
    api.get('/usuarios/admins').then(r => setAdmins(r.data)).catch(() => {}).finally(() => setCargando(false));
  };
  useEffect(() => { load(); }, []);

  const filtrados = admins.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    a.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/usuarios', { ...form, rol: 'admin' });
      toast.success(`Administrador creado — contraseña temporal: ${form.password}`, { duration: 6000 });
      setForm({ nombre: '', email: '', password: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setSaving(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/usuarios/${editando}`, editForm);
      toast.success('Administrador actualizado');
      setEditando(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar');
    } finally { setSaving(false); }
  };

  const handleToggleConfirm = async () => {
    if (!confirmToggle) return;
    try {
      await api.put(`/usuarios/${confirmToggle.id}/toggle`);
      toast.success(confirmToggle.activo ? 'Admin desactivado' : 'Admin activado');
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
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar contraseña');
    } finally { setResetting(false); }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      {/* Header con gradiente */}
      <div className="mb-6 bg-gradient-to-r from-violet-50 to-violet-100/50 border-b border-violet-200 rounded-2xl px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-violet-900">Administradores</h1>
          <p className="text-sm text-violet-700 mt-0.5">{admins.length} administradores registrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo administrador
        </button>
      </div>

      {/* Aviso */}
      <div className="mb-5 flex items-start gap-2 p-3 bg-violet-50 border border-violet-100 rounded-xl text-sm text-violet-700">
        <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Los administradores tienen acceso completo al sistema.
      </div>

      {/* Búsqueda */}
      <div className="mb-5 relative max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Modal nuevo admin */}
      {showForm && (
        <Modal title="Nuevo administrador" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input required className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Carlos Ramírez" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input required type="email" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={form.email} onChange={e => set('email', e.target.value)} placeholder="correo@epo.edu.mx" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal</label>
              <input required type="password" minLength={6} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mín. 6 caracteres" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                {saving && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {saving ? 'Creando...' : 'Crear'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition-colors">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal editar */}
      {editando && (
        <Modal title="Editar administrador" onClose={() => setEditando(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input required className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={editForm.nombre} onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input required type="email" className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                {saving && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => setEditando(null)}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition-colors">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal toggle */}
      {confirmToggle && (
        <Modal title={confirmToggle.activo ? 'Desactivar administrador' : 'Activar administrador'} onClose={() => setConfirmToggle(null)}>
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-50">
            <div className={`w-10 h-10 ${avatarColor(confirmToggle.nombre)} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {getInitials(confirmToggle.nombre)}
            </div>
            <p className="font-medium text-gray-800">{confirmToggle.nombre}</p>
          </div>
          {confirmToggle.id === me?.id && (
            <p className="text-xs text-red-600 mb-3 bg-red-50 p-2 rounded-lg">No puedes desactivar tu propia cuenta.</p>
          )}
          <p className="text-sm text-gray-600 mb-4">
            {confirmToggle.activo ? '¿Desactivar este administrador? No podrá iniciar sesión.' : '¿Activar este administrador?'}
          </p>
          <div className="flex gap-2">
            <button onClick={handleToggleConfirm} disabled={confirmToggle.id === me?.id}
              className={`px-4 py-2 rounded-lg text-sm text-white transition-colors disabled:opacity-40 ${confirmToggle.activo ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
              {confirmToggle.activo ? 'Sí, desactivar' : 'Sí, activar'}
            </button>
            <button onClick={() => setConfirmToggle(null)}
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition-colors">Cancelar</button>
          </div>
        </Modal>
      )}

      {/* Modal resetear contraseña */}
      {resetPass && (
        <Modal title={`Cambiar contraseña — ${resetPass.nombre}`} onClose={() => { setResetPass(null); setNewPass(''); }}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm text-amber-700">Establece una nueva contraseña temporal para este administrador.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input required type="password" minLength={6} autoFocus
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Mín. 6 caracteres" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={resetting}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                {resetting && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {resetting ? 'Guardando...' : 'Guardar contraseña'}
              </button>
              <button type="button" onClick={() => { setResetPass(null); setNewPass(''); }}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm transition-colors">Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          {cargando ? (
            <TableSkeleton />
          ) : (
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    {busqueda ? (
                      <div>
                        <p className="text-gray-500 font-medium">Sin resultados para "{busqueda}"</p>
                        <button onClick={() => setBusqueda('')} className="mt-2 text-violet-600 hover:underline text-sm">
                          Limpiar búsqueda
                        </button>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-14 h-14 mx-auto text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                            d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500 font-medium">Sin administradores adicionales</p>
                        <button onClick={() => setShowForm(true)}
                          className="mt-3 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                          + Nuevo administrador
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtrados.map((a, idx) => (
                  <tr key={a.id}
                    className={`border-t hover:bg-violet-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${avatarColor(a.nombre)} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                          {getInitials(a.nombre)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{a.nombre}</span>
                          {a.id === me?.id && (
                            <span className="inline-flex items-center gap-0.5 bg-violet-100 text-violet-700 text-xs font-semibold px-2 py-1 rounded-full">
                              <span>★</span>
                              <span>Tu cuenta</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        a.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${a.activo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {a.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditando(a.id); setEditForm({ nombre: a.nombre, email: a.email }); }}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors font-medium">
                          Editar
                        </button>
                        <button
                          onClick={() => { setResetPass({ id: a.id, nombre: a.nombre }); setNewPass(''); }}
                          className="text-xs text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-colors font-medium">
                          Contraseña
                        </button>
                        {a.id === me?.id ? (
                          <button
                            disabled
                            title="No puedes desactivar tu propia cuenta"
                            className="text-xs px-2.5 py-1 rounded-lg transition-colors font-medium text-gray-400 cursor-not-allowed">
                            {a.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmToggle({ id: a.id, activo: a.activo, nombre: a.nombre })}
                            className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
                              a.activo
                                ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                                : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                            }`}>
                            {a.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}
