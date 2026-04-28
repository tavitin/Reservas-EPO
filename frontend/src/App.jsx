import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

import Login          from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import Recursos       from './pages/admin/Recursos';
import Usuarios       from './pages/admin/Usuarios';
import ReservasAdmin  from './pages/admin/ReservasAdmin';
import MaestroDash    from './pages/maestro/Dashboard';
import NuevaReserva   from './pages/maestro/NuevaReserva';
import MisReservas    from './pages/maestro/MisReservas';

function PrivateRoute({ children, rol }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (rol && user.rol !== rol) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.rol === 'admin' ? '/admin' : '/maestro'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomeRedirect />} />

        <Route path="/admin" element={
          <PrivateRoute rol="admin"><Layout /></PrivateRoute>
        }>
          <Route index                   element={<AdminDashboard />} />
          <Route path="recursos"         element={<Recursos />} />
          <Route path="usuarios"         element={<Usuarios />} />
          <Route path="reservas"         element={<ReservasAdmin />} />
          <Route path="nueva-reserva"    element={<NuevaReserva />} />
          <Route path="mis-reservas"     element={<MisReservas />} />
        </Route>

        <Route path="/maestro" element={
          <PrivateRoute rol="maestro"><Layout /></PrivateRoute>
        }>
          <Route index                   element={<MaestroDash />} />
          <Route path="nueva-reserva"    element={<NuevaReserva />} />
          <Route path="mis-reservas"     element={<MisReservas />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
