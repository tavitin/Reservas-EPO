import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

// Tiempo de inactividad: 30 minutos
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  // Solo guardamos los datos del usuario en localStorage (NO el token — va en cookie httpOnly)
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });

  const inactivityTimer = useRef(null);
  const warningTimeout  = useRef(null);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignorar errores de red */ }
    localStorage.removeItem('user');
    setUser(null);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimeout.current)  clearTimeout(warningTimeout.current);
  };

  const login = async (email, password) => {
    // El backend pone el token en cookie httpOnly — nosotros solo recibimos el user
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  // Resetea el timer de inactividad
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimeout.current)  clearTimeout(warningTimeout.current);

    // Advertencia 2 minutos antes del logout
    warningTimeout.current = setTimeout(() => {
      if (user) {
        toast('⏰ Sesión expirará en 2 minutos por inactividad', {
          icon: '⏱️',
          duration: 8000,
          position: 'top-center',
          style: { background: '#ff9800', color: '#fff', fontWeight: 'bold' },
        });
      }
    }, INACTIVITY_TIMEOUT - 2 * 60 * 1000);

    // Logout automático
    inactivityTimer.current = setTimeout(() => {
      if (user) {
        logout();
        toast.error('Sesión cerrada por inactividad (30 minutos)', {
          duration: 5000,
          position: 'top-center',
        });
      }
    }, INACTIVITY_TIMEOUT);
  };

  // Detectores de actividad
  useEffect(() => {
    if (!user) return;
    resetInactivityTimer();
    const events  = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const handler = () => resetInactivityTimer();
    events.forEach(e => document.addEventListener(e, handler, true));
    return () => {
      events.forEach(e => document.removeEventListener(e, handler, true));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      if (warningTimeout.current)  clearTimeout(warningTimeout.current);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
