import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const AVATAR_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

function getInitials(name = '') { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(); }
function avatarColor(name = '') {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

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

function TableSkeleton() {
  return (
    <tbody className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <tr key={i} className="border-t">
          <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-gray-200 rounded-full" /><div className="h-4 bg-gray-200 rounded w-36" /></div></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-48" /></td>
          <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded-full w-16" /></td>
          <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-28" /></td>
        </tr>
      ))}
    </tbody>
  );
}

export default function Usuarios() {
  const { user: me } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'maestro' });
  const [editForm, setEditForm] = useState({ nombre: '', email: '' });
  const [editando, setEditando] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [resetPass, setResetPass] = useState(null);
  const [newPass, setNewPass] = useState('');
  const [cargando, setCargando] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = () => {
    setCargando(true);
    api.get('/usuarios').then(r => setUsuarios(r.data)).catch(() => {}).finally(() => setCargando(false));
  };
  useEffect(() => { load(); }, []);

  const maestros = usuarios.filter(u => u.rol === 'maestro');
  const admins = usuarios.filter(u => u.rol === 'admin');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/usuarios', form);
      toast.success(`${form.rol === 'admin' ? 'Administrador' : 'Maestro'} creado — contraseña: ${form.password}`, { duration: 6000 });
      setForm({ nombre: '', email: '', password: '', rol: 'maestro' });
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
      toast.success('Usuario actualizado');
      setEditando(null);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const handleToggleConfirm = async () => {
    if (!confirmToggle) return;
    try {
      await api.put(`/usuarios/${confirmToggle.id}/toggle`);
      toast.success(confirmToggle.activo ? 'Desactivado' : 'Activado');
      load();
    } catch { toast.error('Error'); }
    finally { setConfirmToggle(null); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetting(true);
    try {
      await api.put(`/usuarios/${resetPass.id}/reset-password`, { password_nuevo: newPass });
      toast.success('Contraseña actualizada', { duration: 5000 });
      setResetPass(null); setNewPass('');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setResetting(false); }
  };

  const inputClass = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 transition-colors";

  const renderUserRow = (u, rol) => (
    <tr key={u.id} className="border-t hover:bg-blue-50/40 transition-colors">
      <td className="px-4 py-3"><div className="flex items-center gap-3">
        <div className={`w-9 h-9 ${avatarColor(u.nombre)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>{getInitials(u.nombre)}</div>
        <div><span className="font-medium text-gray-800">{u.nombre}</span>{u.id === me?.id && <span className="ml-1.5 text-xs text-gray-400">(tú)</span>}</div>
      </div></td>
      <td className="px-4 py-3 text-gray-600 text-sm">{u.email}</td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${u.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}><span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-red-500'}`} />{u.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td className="px-4 py-3"><div className="flex gap-1.5 flex-wrap">
        <button onClick={() => { setEditando(u.id); setEditForm({ nombre: u.nombre, email: u.email }); }} className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors font-medium">Editar</button>
        <button onClick={() => { setResetPass({ id: u.id, nombre: u.nombre }); setNewPass(''); }} className="text-xs text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-colors font-medium">Contraseña</button>
        {u.id !== me?.id && <button onClick={() => setConfirmToggle({ id: u.id, activo: u.activo, nombre: u.nombre })} className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${u.activo ? 'text-red-600 hover:text-red-800 hover:bg-red-50' : 'text-green-600 hover:text-green-800 hover:bg-green-50'}`}>{u.activo ? 'Desactivar' : 'Activar'}</button>}
      </div></td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-400 mt-0.5">{maestros.length} maestro{maestros.length !== 1 ? 's' : ''} · {admins.length} admin{admins.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo usuario
        </button>
      </div>

      {/* Búsqueda global */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" /></svg>
        <input type="text" placeholder="Buscar usuario..." className={`${inputClass} pl-10 pr-10`} value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
      </div>

      {/* Modales */}
      {showForm && (
        <Modal title="Nuevo usuario" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label><div className="grid grid-cols-2 gap-2">{[['maestro', 'Maestro'], ['admin', 'Admin']].map(([v, l]) => <button key={v} type="button" onClick={() => setForm(p => ({ ...p, rol: v }))} className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${form.rol === v ? (v === 'admin' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-blue-500 bg-blue-50 text-blue-700') : 'border-gray-200 text-gray-500'}`}>{l}</button>)}</div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input required className={inputClass} placeholder="Ej: Ana López" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input required type="email" className={inputClass} placeholder="correo@epo.edu.mx" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label><input required type="password" minLength={6} className={inputClass} placeholder="Mín. 6 caracteres" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} /></div>
            <div className="flex gap-2 pt-1"><button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">{saving && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}{saving ? 'Creando...' : 'Crear usuario'}</button><button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm transition-colors">Cancelar</button></div>
          </form>
        </Modal>
      )}

      {editando && (
        <Modal title="Editar usuario" onClose={() => setEditando(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input required className={inputClass} value={editForm.nombre} onChange={e => setEditForm(p => ({ ...p, nombre: e.target.value }))} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input required type="email" className={inputClass} value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="flex gap-2 pt-1"><button type="submit" disabled={saving} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">{saving && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}{saving ? 'Guardando...' : 'Guardar'}</button><button type="button" onClick={() => setEditando(null)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm transition-colors">Cancelar</button></div>
          </form>
        </Modal>
      )}

      {confirmToggle && (
        <Modal title={confirmToggle.activo ? 'Desactivar' : 'Activar'} onClose={() => setConfirmToggle(null)}>
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl"><div className={`w-10 h-10 ${avatarColor(confirmToggle.nombre)} rounded-full flex items-center justify-center text-white text-sm font-bold`}>{getInitials(confirmToggle.nombre)}</div><p className="font-medium text-gray-800">{confirmToggle.nombre}</p></div>
          <p className="text-sm text-gray-600 mb-4">{confirmToggle.activo ? '¿Desactivar? No podrá iniciar sesión.' : '¿Activar este usuario?'}</p>
          <div className="flex gap-2"><button onClick={handleToggleConfirm} className={`px-4 py-2 rounded-xl text-sm text-white transition-colors ${confirmToggle.activo ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>{confirmToggle.activo ? 'Sí, desactivar' : 'Sí, activar'}</button><button onClick={() => setConfirmToggle(null)} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm transition-colors">Cancelar</button></div>
        </Modal>
      )}

      {resetPass && (
        <Modal title="Cambiar contraseña" onClose={() => { setResetPass(null); setNewPass(''); }}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl"><svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg><p className="text-sm text-amber-700">Nueva contraseña para <strong>{resetPass.nombre}</strong></p></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label><input required type="password" minLength={6} autoFocus className={inputClass} placeholder="Mín. 6 caracteres" value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
            <div className="flex gap-2 pt-1"><button type="submit" disabled={resetting} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">{resetting && <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}{resetting ? 'Guardando...' : 'Guardar'}</button><button type="button" onClick={() => { setResetPass(null); setNewPass(''); }} className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm transition-colors">Cancelar</button></div>
          </form>
        </Modal>
      )}

      {/* Maestros */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 px-6 py-4 border-b"><h2 className="text-lg font-bold text-blue-900">Maestros</h2></div>
        <table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-gray-500 text-xs uppercase tracking-wide"><th className="px-4 py-3 font-semibold">Nombre</th><th className="px-4 py-3 font-semibold">Email</th><th className="px-4 py-3 font-semibold">Estado</th><th className="px-4 py-3 font-semibold">Acciones</th></tr></thead>{cargando ? <TableSkeleton /> : <tbody>{maestros.filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase()) || m.email.toLowerCase().includes(busqueda.toLowerCase())).length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">Sin maestros</td></tr> : maestros.filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase()) || m.email.toLowerCase().includes(busqueda.toLowerCase())).map(m => renderUserRow(m, 'maestro'))}</tbody>}</table>
      </div>

      {/* Admins */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-violet-50 to-violet-100/50 px-6 py-4 border-b"><h2 className="text-lg font-bold text-violet-900">Administradores</h2></div>
        <table className="w-full text-sm"><thead className="bg-gray-50"><tr className="text-left text-gray-500 text-xs uppercase tracking-wide"><th className="px-4 py-3 font-semibold">Nombre</th><th className="px-4 py-3 font-semibold">Email</th><th className="px-4 py-3 font-semibold">Estado</th><th className="px-4 py-3 font-semibold">Acciones</th></tr></thead>{cargando ? <TableSkeleton /> : <tbody>{admins.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase()) || a.email.toLowerCase().includes(busqueda.toLowerCase())).length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">Sin admins</td></tr> : admins.filter(a => a.nombre.toLowerCase().includes(busqueda.toLowerCase()) || a.email.toLowerCase().includes(busqueda.toLowerCase())).map(a => renderUserRow(a, 'admin'))}</tbody>}</table>
      </div>
    </div>
  );
}
