import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignUpForm, authApi } from '@features/auth';
import { useToast } from '@/contexts/ToastContext';
import { getAuthErrorMessage } from '@utils/errors';
import { ROUTES } from '@config/routes';

export default function SignUpPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [serverError, setServerError] = useState(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const onSubmit = async ({ email, password }) => {
    setServerError(null);
    const { data, error } = await authApi.signUp({ email, password });
    if (error) {
      setServerError(getAuthErrorMessage(error));
      return;
    }
    if (data?.session) {
      toast.success('החשבון נוצר בהצלחה', { description: 'ברוכים הבאים ל-CraftAd' });
      nav(ROUTES.onboarding.root, { replace: true });
    } else {
      toast.info('בדקו את תיבת האימייל שלכם', { description: 'שלחנו אליכם קישור לאימות החשבון' });
      setConfirmationSent(true);
    }
  };

  const onGoogleSignIn = async () => {
    setServerError(null);
    const { error } = await authApi.signInWithGoogle();
    if (error) setServerError(getAuthErrorMessage(error));
  };

  return (
    <SignUpForm
      onSubmit={onSubmit}
      onGoogleSignIn={onGoogleSignIn}
      serverError={serverError}
      confirmationSent={confirmationSent}
    />
  );
}
