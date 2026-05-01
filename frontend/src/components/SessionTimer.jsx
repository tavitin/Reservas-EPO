import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

export default function SessionTimer() {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(INACTIVITY_TIMEOUT);
  const [isWarning, setIsWarning] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setShowTimer(false);
      return;
    }

    // Escuchar eventos de actividad
    const handleActivity = () => {
      setTimeLeft(INACTIVITY_TIMEOUT);
      setIsWarning(false);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Timer que decrementa cada segundo
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1000;

        // Si quedan 2 minutos, mostrar warning
        if (newTime <= 2 * 60 * 1000 && newTime > 0) {
          setIsWarning(true);
        }

        return newTime > 0 ? newTime : 0;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user]);

  if (!user || !showTimer) {
    return (
      <button
        onClick={() => setShowTimer(!showTimer)}
        title="Ver contador de sesión"
        className="fixed bottom-4 right-4 z-40 w-12 h-12 bg-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-400"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  const totalSeconds = Math.ceil(timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const percentLeft = (timeLeft / INACTIVITY_TIMEOUT) * 100;

  return (
    <div className={`fixed bottom-4 right-2 sm:right-4 z-50 transition-all w-[calc(100vw-1rem)] sm:w-80 max-w-sm ${
      isWarning ? 'animate-pulse' : ''
    }`}>
      <div className={`rounded-2xl shadow-2xl p-4 ${
        isWarning
          ? 'bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300'
          : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className={`w-5 h-5 ${isWarning ? 'text-orange-500 animate-spin' : 'text-blue-500'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`font-semibold ${
              isWarning ? 'text-orange-700' : 'text-gray-700'
            }`}>
              {isWarning ? '⚠️ Sesión a punto de expirar' : '✓ Sesión activa'}
            </span>
          </div>
          <button
            onClick={() => setShowTimer(false)}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-3">
          <div className={`text-4xl font-bold ${
            isWarning ? 'text-orange-600' : 'text-blue-600'
          }`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <p className="text-xs text-gray-500 mt-1">Tiempo restante</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isWarning
                  ? 'bg-gradient-to-r from-orange-400 to-red-500'
                  : 'bg-gradient-to-r from-blue-400 to-blue-500'
              }`}
              style={{ width: `${percentLeft}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {percentLeft.toFixed(0)}% tiempo disponible
          </p>
        </div>

        {/* Status Message */}
        <div className={`p-2.5 rounded-lg mb-3 text-sm ${
          isWarning
            ? 'bg-orange-100 text-orange-800 border border-orange-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {isWarning ? (
            <p>
              <strong>⏰ Atención:</strong> Tu sesión expirará en {minutes} minuto{minutes !== 1 ? 's' : ''} {seconds} segundo{seconds !== 1 ? 's' : ''} por inactividad.
            </p>
          ) : (
            <p>
              <strong>✓ Activo:</strong> Tu sesión seguirá activa mientras uses la aplicación (cada 30 min de inactividad se cierra).
            </p>
          )}
        </div>

        {/* User Info */}
        <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 mb-3 text-sm">
          <p className="text-gray-600">
            <strong>Usuario:</strong> {user?.nombre || 'Usuario'}
            <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
              {user?.rol === 'admin' ? '👨‍💼 Admin' : '👨‍🏫 Maestro'}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTimeLeft(INACTIVITY_TIMEOUT);
              setIsWarning(false);
              toast.success('Sesión extendida por 30 minutos más', {
                duration: 3000,
              });
            }}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${
              isWarning
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            ⟳ Extender sesión
          </button>
          <button
            onClick={() => setShowTimer(false)}
            className="flex-1 py-2 rounded-lg font-medium text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Footer Info */}
        <p className="text-xs text-gray-400 text-center mt-3">
          🔒 Sesión segura • Auto-logout en inactividad
        </p>
      </div>
    </div>
  );
}
