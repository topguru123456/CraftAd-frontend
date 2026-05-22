import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@config/routes';

export default function ProtectedRoute() {
  const { isAuthenticated, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  return isAuthenticated
    ? <Outlet />
    : <Navigate to={ROUTES.auth.signIn} state={{ from: location }} replace />;
}
