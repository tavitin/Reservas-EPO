import axios from 'axios';

const api = axios.create({
  baseURL         : import.meta.env.VITE_API_URL || '/api',
  withCredentials : true,   // envía la cookie httpOnly automáticamente
  ...(import.meta.env.VITE_NGROK_SKIP && {
    headers: { 'ngrok-skip-browser-warning': 'true' },
  }),
});

// Sin interceptor de token — el navegador gestiona la cookie httpOnly

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Limpiar solo el usuario del estado local (el token ya no está en localStorage)
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
