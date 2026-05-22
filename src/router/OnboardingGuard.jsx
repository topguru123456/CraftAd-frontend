import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@config/routes';

export default function OnboardingGuard() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  const completed = user?.user_metadata?.onboarding?.completed;
  return completed ? <Outlet /> : <Navigate to={ROUTES.onboarding.root} replace />;
}
