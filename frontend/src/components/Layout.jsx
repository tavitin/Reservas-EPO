import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SessionTimer from './SessionTimer';

/* ── helpers ── */
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
const AVATAR_COLORS = [
  'bg-violet-500', 'bg-pink-500', 'bg-amber-500',
  'bg-teal-500',   'bg-cyan-500', 'bg-rose-500',
];
function avatarColor(name = '') {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

/* ── icons ── */
const ICONS = {
  Dashboard: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Inicio: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Recursos: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  ),
  Usuarios: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Reservas: (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'Nueva Reserva': (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  'Mis Reservas': (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
};

/* ── breadcrumb map ── */
const BREADCRUMBS = {
  '/admin':              ['Dashboard'],
  '/admin/recursos':     ['Dashboard', 'Recursos'],
  '/admin/usuarios':     ['Dashboard', 'Usuarios'],
  '/admin/reservas':     ['Dashboard', 'Reservas'],
  '/admin/mis-reservas': ['Dashboard', 'Mis Reservas'],
  '/maestro':            ['Inicio'],
  '/maestro/nueva-reserva': ['Inicio', 'Nueva Reserva'],
  '/maestro/mis-reservas':  ['Inicio', 'Mis Reservas'],
};

/* ── avatar dropdown ── */
function AvatarMenu({ user, isAdmin, bgColor, initials, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const misReservasPath = isAdmin ? '/admin/mis-reservas' : '/maestro/mis-reservas';

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-label="Menú de usuario"
      >
        <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/30`}>
          {initials}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium leading-none max-w-[100px] truncate">{user?.nombre}</span>
          <span className={`text-[9px] font-semibold mt-0.5 capitalize ${isAdmin ? 'text-amber-300' : 'text-blue-200'}`}>
            {user?.rol}
          </span>
        </div>
        <svg className={`w-3.5 h-3.5 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
          {/* user info */}
          <div className="px-4 py-2 border-b border-gray-100 mb-1">
            <p className="text-xs font-semibold text-gray-800 truncate">{user?.nombre}</p>
            <p className="text-[11px] text-gray-400 truncate">{user?.email || user?.usuario}</p>
          </div>

          <button
            onClick={() => { setOpen(false); navigate(misReservasPath); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {ICONS['Mis Reservas']}
            Mis Reservas
          </button>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── main layout ── */
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const isAdmin   = user?.rol === 'admin';
  const [drawerOpen, setDrawerOpen] = useState(false);

  const links = isAdmin
    ? [
        { to: '/admin',              label: 'Dashboard',    end: true },
        { to: '/admin/recursos',     label: 'Recursos' },
        { to: '/admin/usuarios',     label: 'Usuarios' },
        { to: '/admin/reservas',     label: 'Reservas' },
        { to: '/admin/mis-reservas', label: 'Mis Reservas' },
      ]
    : [
        { to: '/maestro',                label: 'Inicio',        end: true },
        { to: '/maestro/nueva-reserva',  label: 'Nueva Reserva' },
        { to: '/maestro/mis-reservas',   label: 'Mis Reservas' },
      ];

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = getInitials(user?.nombre);
  const bgColor  = avatarColor(user?.nombre || '');

  /* breadcrumbs */
  const crumbs = BREADCRUMBS[location.pathname] || [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── NAVBAR ── */}
      <nav className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-wide hidden sm:block">Reservas EPO</span>
          </div>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-0.5 mx-4">
            {links.map(l => (
              <NavLink
                key={l.to} to={l.to} end={l.end}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {ICONS[l.label]}
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Derecha: avatar dropdown (desktop) + hamburguesa (mobile) */}
          <div className="flex items-center gap-2">
            <AvatarMenu
              user={user}
              isAdmin={isAdmin}
              bgColor={bgColor}
              initials={initials}
              onLogout={handleLogout}
            />

            {/* Hamburguesa (mobile) */}
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menú"
              className="md:hidden flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Breadcrumbs (desktop, only when >1 crumb) */}
        {crumbs.length > 1 && (
          <div className="hidden md:flex items-center gap-1.5 max-w-7xl mx-auto px-4 pb-2 text-[11px] text-blue-200">
            {crumbs.map((c, i) => (
              <span key={c} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-blue-400">/</span>}
                <span className={i === crumbs.length - 1 ? 'text-white font-semibold' : 'hover:text-white cursor-default'}>
                  {c}
                </span>
              </span>
            ))}
          </div>
        )}
      </nav>

      {/* ── DRAWER MÓVIL (desde la izquierda) ── */}
      {/* Overlay */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 bg-black/50 z-50 md:hidden transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      {/* Panel */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-50 flex flex-col shadow-2xl md:hidden
        transform transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Header del drawer */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-700 to-blue-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/30`}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.nombre}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${
                isAdmin ? 'bg-amber-400 text-amber-900' : 'bg-blue-300 text-blue-900'
              }`}>{user?.rol}</span>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Cerrar menú"
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {links.map(l => (
            <NavLink
              key={l.to} to={l.to} end={l.end}
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={isActive ? 'text-blue-600' : 'text-gray-400'}>
                    {ICONS[l.label]}
                  </span>
                  {l.label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer: cerrar sesión */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-gray-400 py-3 border-t border-gray-200 bg-white">
        © EPO 2026 — Sistema de Reservas
      </footer>

      {/* Session Timer Widget */}
      <SessionTimer />
    </div>
  );
}
