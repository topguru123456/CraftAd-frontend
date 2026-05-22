import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInForm, authApi } from '@features/auth';
import { useToast } from '@/contexts/ToastContext';
import { getAuthErrorMessage } from '@utils/errors';
import { ROUTES } from '@config/routes';

export default function SignInPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [serverError, setServerError] = useState(null);

  const onSubmit = async ({ email, password }) => {
    setServerError(null);
    const { error } = await authApi.signIn({ email, password });
    if (error) {
      setServerError(getAuthErrorMessage(error));
      return;
    }
    toast.success('התחברת בהצלחה', { description: 'ברוכים השבים!' });
    nav(ROUTES.app.dashboard, { replace: true });
  };

  const onGoogleSignIn = async () => {
    setServerError(null);
    const { error } = await authApi.signInWithGoogle();
    if (error) setServerError(getAuthErrorMessage(error));
  };

  return <SignInForm onSubmit={onSubmit} onGoogleSignIn={onGoogleSignIn} serverError={serverError} />;
}
