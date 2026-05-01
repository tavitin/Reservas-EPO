import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
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

/* ─── Spinner ──────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/* ─── Modal genérico ───────────────────────────────────────────────────────── */
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

/* ─── Menú de acciones ··· ─────────────────────────────────────────────────── */
function AccionesMenu({ usuario, isMe, onEdit, onPassword, onToggle }) {
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
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
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
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30">
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Editar datos
          </button>
          <button
            onClick={e => { e.stopPropagation(); setOpen(false); onPassword(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Cambiar contraseña
          </button>
          {!isMe && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={e => { e.stopPropagation(); setOpen(false); onToggle(); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${
                  usuario.activo ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {usuario.activo
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  }
                </svg>
                {usuario.activo ? 'Desactivar' : 'Activar'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────────────────────── */
function ListSkeleton({ rows = 4 }) {
  return (
    <div className="divide-y divide-gray-100 animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <div className="w-10 h-10 bg-gray-100 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-100 rounded w-36" />
            <div className="h-3 bg-gray-100 rounded w-52" />
          </div>
          <div className="h-5 bg-gray-100 rounded-full w-14 hidden sm:block" />
          <div className="w-8 h-8 bg-gray-100 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* ─── Fila de usuario ───────────────────────────────────────────────────────── */
function UserRow({ u, isMe, onEdit, onPassword, onToggle }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/80 transition-colors group">
      {/* Avatar con indicador activo */}
      <div className="relative shrink-0">
        <div className={`w-10 h-10 ${avatarColor(u.nombre)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
          {getInitials(u.nombre)}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${u.activo ? 'bg-emerald-400' : 'bg-gray-300'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-gray-800 text-sm truncate">{u.nombre}</p>
          {isMe && (
            <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
              tú
            </span>
          )}
          {u.rol === 'admin' && !isMe && (
            <span className="inline-flex items-center gap-0.5 bg-violet-100 text-violet-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0">
              admin
            </span>
          )}
        </div>
        <p className="text-gray-400 text-xs truncate">{u.email}</p>
      </div>

      {/* Estado pill */}
      <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
        u.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-gray-400'}`} />
        {u.activo ? 'Activo' : 'Inactivo'}
      </span>

      {/* Menú */}
      <AccionesMenu
        usuario={u}
        isMe={isMe}
        onEdit={onEdit}
        onPassword={onPassword}
        onToggle={onToggle}
      />
    </div>
  );
}

/* ─── Sección (Maestros / Admins) ──────────────────────────────────────────── */
function Seccion({ titulo, color, icono, lista, cargando, busqueda, onAdd, renderRow, emptyMsg }) {
  const filtrados = lista.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Cabecera de sección */}
      <div className={`flex items-center justify-between px-5 py-3.5 border-b ${color.bg}`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color.icon}`}>
            {icono}
          </div>
          <div>
            <h2 className={`text-sm font-bold ${color.title}`}>{titulo}</h2>
            <p className={`text-xs ${color.sub}`}>{lista.length} registrado{lista.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={onAdd}
          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${color.btn}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo
        </button>
      </div>

      {/* Contenido */}
      {cargando ? (
        <ListSkeleton rows={3} />
      ) : filtrados.length === 0 ? (
        <div className="text-center py-10 px-4">
          {busqueda ? (
            <>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2 ${color.icon}`}>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-semibold">Sin coincidencias</p>
            </>
          ) : (
            <>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-2 ${color.icon}`}>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-semibold">{emptyMsg}</p>
              <button onClick={onAdd}
                className={`mt-3 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors ${color.btn}`}>
                Agregar primero
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filtrados.map(u => renderRow(u))}
        </div>
      )}
    </div>
  );
}

/* ─── Componente principal ─────────────────────────────────────────────────── */
export default function Usuarios() {
  const { user: me } = useAuth();
  const [usuarios, setUsuarios]           = useState([]);
  const [busqueda, setBusqueda]           = useState('');
  const [filtroRol, setFiltroRol]         = useState('todos'); // 'todos' | 'maestro' | 'admin'
  const [form, setForm]                   = useState({ nombre: '', email: '', password: '', rol: 'maestro' });
  const [editForm, setEditForm]           = useState({ nombre: '', email: '' });
  const [editando, setEditando]           = useState(null);
  const [showForm, setShowForm]           = useState(false);
  const [showFormRol, setShowFormRol]     = useState('maestro'); // rol pre-seleccionado al abrir
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [resetPass, setResetPass]         = useState(null);
  const [newPass, setNewPass]             = useState('');
  const [cargando, setCargando]           = useState(true);
  const [saving, setSaving]               = useState(false);
  const [resetting, setResetting]         = useState(false);

  const load = () => {
    setCargando(true);
    api.get('/usuarios').then(r => setUsuarios(r.data)).catch(() => {}).finally(() => setCargando(false));
  };
  useEffect(() => { load(); }, []);

  /* Derivados */
  const maestros      = usuarios.filter(u => u.rol === 'maestro');
  const admins        = usuarios.filter(u => u.rol === 'admin');
  const totalActivos  = usuarios.filter(u => u.activo).length;
  const totalInact    = usuarios.filter(u => !u.activo).length;

  const abrirForm = (rol) => {
    setShowFormRol(rol);
    setForm({ nombre: '', email: '', password: '', rol });
    setShowForm(true);
  };

  /* Handlers */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/usuarios', form);
      toast.success(
        `${form.rol === 'admin' ? 'Administrador' : 'Maestro'} creado. Comparte la contraseña de forma segura.`,
        { duration: 5000 }
      );
      setForm({ nombre: '', email: '', password: '', rol: 'maestro' });
      setShowForm(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al crear usuario'); }
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
    } catch (err) { toast.error(err.response?.data?.error || 'Error al actualizar'); }
    finally { setSaving(false); }
  };

  const handleToggleConfirm = async () => {
    if (!confirmToggle) return;
    try {
      await api.put(`/usuarios/${confirmToggle.id}/toggle`);
      toast.success(confirmToggle.activo ? 'Usuario desactivado' : 'Usuario activado');
      load();
    } catch { toast.error('Error'); }
    finally { setConfirmToggle(null); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetting(true);
    try {
      await api.put(`/usuarios/${resetPass.id}/reset-password`, { password_nuevo: newPass });
      toast.success('Contraseña actualizada. Compártela de forma segura.', { duration: 5000 });
      setResetPass(null); setNewPass('');
    } catch (err) { toast.error(err.response?.data?.error || 'Error al cambiar contraseña'); }
    finally { setResetting(false); }
  };

  const inputClass = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 bg-white transition-colors";

  /* Stats */
  const STATS = [
    {
      label: 'Maestros',
      value: maestros.length,
      sub: `${maestros.filter(m => m.activo).length} de ${maestros.length} activos`,
      iconBg: 'bg-blue-100',
      accent: 'border-t-blue-500',
      num: 'text-blue-700',
      lbl: 'text-gray-600',
      sub_text: 'text-blue-400',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4-3.268A7 7 0 0112 20a7 7 0 014-3.268" />
        </svg>
      ),
    },
    {
      label: 'Administradores',
      value: admins.length,
      sub: `${admins.filter(a => a.activo).length} de ${admins.length} activos`,
      iconBg: 'bg-violet-100',
      accent: 'border-t-violet-500',
      num: 'text-violet-700',
      lbl: 'text-gray-600',
      sub_text: 'text-violet-400',
      icon: (
        <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      label: 'Activos',
      value: totalActivos,
      sub: 'con acceso al sistema',
      iconBg: 'bg-emerald-100',
      accent: 'border-t-emerald-500',
      num: 'text-emerald-700',
      lbl: 'text-gray-600',
      sub_text: 'text-emerald-400',
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Inactivos',
      value: totalInact,
      sub: 'sin acceso al sistema',
      iconBg: totalInact > 0 ? 'bg-red-100' : 'bg-gray-100',
      accent: totalInact > 0 ? 'border-t-red-400' : 'border-t-gray-300',
      num: totalInact > 0 ? 'text-red-600' : 'text-gray-400',
      lbl: 'text-gray-600',
      sub_text: totalInact > 0 ? 'text-red-400' : 'text-gray-400',
      icon: (
        <svg className={`w-6 h-6 ${totalInact > 0 ? 'text-red-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
  ];

  /* Pestañas */
  const TABS = [
    { id: 'todos',   label: 'Todos',            cnt: usuarios.length },
    { id: 'maestro', label: 'Maestros',          cnt: maestros.length },
    { id: 'admin',   label: 'Administradores',   cnt: admins.length },
  ];

  /* Colores por sección */
  const colorMaestro = {
    bg: 'bg-gradient-to-r from-blue-50 to-blue-50/30',
    icon: 'bg-blue-100',
    title: 'text-blue-900',
    sub: 'text-blue-500',
    btn: 'bg-blue-600 hover:bg-blue-700 text-white',
  };
  const colorAdmin = {
    bg: 'bg-gradient-to-r from-violet-50 to-violet-50/30',
    icon: 'bg-violet-100',
    title: 'text-violet-900',
    sub: 'text-violet-500',
    btn: 'bg-violet-600 hover:bg-violet-700 text-white',
  };

  const iconMaestro = (
    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m-4-3.268A7 7 0 0112 20a7 7 0 014-3.268" />
    </svg>
  );
  const iconAdmin = (
    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const renderRow = (u) => (
    <UserRow
      key={u.id}
      u={u}
      isMe={u.id === me?.id}
      onEdit={() => { setEditando(u.id); setEditForm({ nombre: u.nombre, email: u.email }); }}
      onPassword={() => { setResetPass({ id: u.id, nombre: u.nombre }); setNewPass(''); }}
      onToggle={() => setConfirmToggle({ id: u.id, activo: u.activo, nombre: u.nombre })}
    />
  );

  return (
    <div className="space-y-5">

      {/* ── Cabecera ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {maestros.length} maestro{maestros.length !== 1 ? 's' : ''} · {admins.length} admin{admins.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => abrirForm('maestro')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo usuario
        </button>
      </div>

      {/* ── Stats ── */}
      {!cargando && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map(s => (
            <div key={s.label}
              className={`bg-white rounded-2xl border border-gray-200 shadow-sm border-t-4 ${s.accent} p-4 flex flex-col gap-3 hover:shadow-md transition-shadow`}>
              {/* Icono + número en fila */}
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                  {s.icon}
                </div>
                <span className={`text-3xl font-extrabold leading-none ${s.num}`}>{s.value}</span>
              </div>
              {/* Etiqueta + sub */}
              <div>
                <p className={`text-sm font-semibold ${s.lbl}`}>{s.label}</p>
                <p className={`text-xs mt-0.5 ${s.sub_text}`}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Panel de búsqueda + pestañas ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        {/* Buscador */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            className="w-full border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Pestañas */}
        <div className="flex gap-1.5 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setFiltroRol(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filtroRol === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1 ${
                filtroRol === t.id ? 'bg-white/25 text-white' : 'bg-white text-gray-500'
              }`}>
                {t.cnt}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Secciones ── */}
      {(filtroRol === 'todos' || filtroRol === 'maestro') && (
        <Seccion
          titulo="Maestros"
          color={colorMaestro}
          icono={iconMaestro}
          lista={maestros}
          cargando={cargando}
          busqueda={busqueda}
          onAdd={() => abrirForm('maestro')}
          renderRow={renderRow}
          emptyMsg="Sin maestros registrados"
        />
      )}

      {(filtroRol === 'todos' || filtroRol === 'admin') && (
        <Seccion
          titulo="Administradores"
          color={colorAdmin}
          icono={iconAdmin}
          lista={admins}
          cargando={cargando}
          busqueda={busqueda}
          onAdd={() => abrirForm('admin')}
          renderRow={renderRow}
          emptyMsg="Sin administradores adicionales"
        />
      )}

      {/* ── Aviso admins ── */}
      {(filtroRol === 'todos' || filtroRol === 'admin') && !cargando && (
        <div className="flex items-start gap-2 p-3.5 bg-violet-50 border border-violet-100 rounded-xl text-sm text-violet-700">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Los administradores tienen acceso completo al sistema. Crea cuentas de administrador solo para personal de confianza.</span>
        </div>
      )}

      {/* ─── MODALES ─── */}

      {/* Nuevo usuario */}
      {showForm && (
        <Modal
          title={`Nuevo ${showFormRol === 'admin' ? 'administrador' : 'maestro'}`}
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de usuario</label>
              <div className="grid grid-cols-2 gap-2">
                {[['maestro', 'Maestro', 'blue'], ['admin', 'Administrador', 'violet']].map(([v, l, c]) => (
                  <button key={v} type="button"
                    onClick={() => setForm(p => ({ ...p, rol: v }))}
                    className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.rol === v
                        ? c === 'violet'
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
                          : 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
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
              <input required type="password" minLength={8} className={inputClass}
                placeholder="Mín. 8 caracteres, una mayúscula y un número"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              <p className="text-xs text-gray-400 mt-1">Al menos 8 caracteres, una letra mayúscula y un número.</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className={`flex items-center gap-1.5 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                  form.rol === 'admin'
                    ? 'bg-violet-600 hover:bg-violet-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                {saving && <Spinner />}
                {saving ? 'Creando...' : 'Crear usuario'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Editar usuario */}
      {editando && (
        <Modal title="Editar usuario" onClose={() => setEditando(null)}>
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
          title={confirmToggle.activo ? 'Desactivar usuario' : 'Activar usuario'}
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
              ? '¿Desactivar este usuario? No podrá iniciar sesión hasta que sea reactivado.'
              : '¿Activar este usuario? Podrá iniciar sesión nuevamente.'}
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
        <Modal title="Cambiar contraseña" onClose={() => { setResetPass(null); setNewPass(''); }}>
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
              <input required type="password" minLength={8} autoFocus className={inputClass}
                placeholder="Mín. 8 caracteres, una mayúscula y un número"
                value={newPass} onChange={e => setNewPass(e.target.value)} />
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
    </div>
  );
}
