import { useState } from 'react';
import { ForgotPasswordForm, authApi } from '@features/auth';
import { getAuthErrorMessage } from '@utils/errors';

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState(null);
  const [sent, setSent] = useState(false);

  const onSubmit = async ({ email }) => {
    setServerError(null);
    const { error } = await authApi.forgotPassword(email);
    if (error) {
      setServerError(getAuthErrorMessage(error));
      return;
    }
    setSent(true);
  };

  return <ForgotPasswordForm onSubmit={onSubmit} serverError={serverError} sent={sent} />;
}
