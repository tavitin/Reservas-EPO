import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getInitials(name = '') {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-pink-500', 'bg-amber-500',
  'bg-teal-500', 'bg-cyan-500', 'bg-rose-500',
];

function avatarColor(name = '') {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

const ICONS = {
  Dashboard: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Inicio: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Recursos: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  ),
  Maestros: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Usuarios: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Admins: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Reservas: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'Nueva Reserva': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 4v16m8-8H4" />
    </svg>
  ),
  'Mis Reservas': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.rol === 'admin';
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = isAdmin
    ? [
        { to: '/admin',           label: 'Dashboard', end: true },
        { to: '/admin/recursos',  label: 'Recursos' },
        { to: '/admin/usuarios',  label: 'Usuarios' },
        { to: '/admin/reservas',  label: 'Reservas' },
      ]
    : [
        { to: '/maestro',                  label: 'Inicio', end: true },
        { to: '/maestro/nueva-reserva',    label: 'Nueva Reserva' },
        { to: '/maestro/mis-reservas',     label: 'Mis Reservas' },
      ];

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeMobile = () => setMobileOpen(false);

  const initials = getInitials(user?.nombre);
  const bgColor  = avatarColor(user?.nombre || '');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo + links */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-wide">Reservas EPO</span>
            </div>

            {/* Separador vertical */}
            <div className="hidden md:block w-px h-6 bg-white/20" />

            <div className="hidden md:flex gap-0.5">
              {links.map(l => (
                <NavLink
                  key={l.to} to={l.to} end={l.end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`
                  }
                  title={l.label}
                >
                  {ICONS[l.label]}
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Usuario + acciones */}
          <div className="flex items-center gap-3">
            {/* Info usuario */}
            <div className="hidden md:flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-sm font-medium leading-tight">{user?.nombre}</p>
                <p className="text-xs text-blue-200 leading-tight">{user?.email}</p>
              </div>
              {/* Avatar con iniciales */}
              <div className={`w-9 h-9 ${bgColor} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white/30`}>
                {initials}
              </div>
              {/* Badge de rol */}
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize tracking-wide ${
                isAdmin
                  ? 'bg-amber-400 text-amber-900'
                  : 'bg-blue-300 text-blue-900'
              }`}>
                {user?.rol}
              </span>
            </div>

            {/* Separador */}
            <div className="hidden md:block w-px h-6 bg-white/20" />

            {/* Botón salir */}
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="hidden md:flex items-center gap-1.5 text-sm bg-white/10 hover:bg-red-500 border border-white/20 hover:border-red-400 px-3 py-1.5 rounded-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Salir
            </button>

            {/* Botón hamburguesa — solo móvil */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Menú"
              className="md:hidden flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-blue-800/95 backdrop-blur-sm">
            {/* Info usuario */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
              <div className={`w-9 h-9 ${bgColor} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.nombre}</p>
                <p className="text-xs text-blue-200 truncate">{user?.email}</p>
              </div>
              <span className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                isAdmin ? 'bg-amber-400 text-amber-900' : 'bg-blue-300 text-blue-900'
              }`}>
                {user?.rol}
              </span>
            </div>

            {/* Links de navegación */}
            <div className="px-3 py-2 space-y-0.5">
              {links.map(l => (
                <NavLink
                  key={l.to} to={l.to} end={l.end}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {ICONS[l.label]}
                  {l.label}
                </NavLink>
              ))}
            </div>

            {/* Botón salir */}
            <div className="px-3 pb-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-200 hover:bg-red-500/30 hover:text-white transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 bg-white">
        © EPO 2026 — Sistema de Reservas
      </footer>
    </div>
  );
}
