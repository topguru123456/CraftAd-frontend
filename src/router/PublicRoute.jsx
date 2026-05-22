import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@config/routes';

export default function PublicRoute() {
  const { isAuthenticated, ready } = useAuth();
  if (!ready) return null;
  return isAuthenticated ? <Navigate to={ROUTES.app.dashboard} replace /> : <Outlet />;
}
