import { useState } from 'react';
import { ResetPasswordForm, authApi } from '@features/auth';
import { getAuthErrorMessage } from '@utils/errors';

export default function ResetPasswordPage() {
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async ({ password }) => {
    setServerError(null);
    const { error } = await authApi.updatePassword(password);
    if (error) {
      setServerError(getAuthErrorMessage(error));
      return;
    }
    setSuccess(true);
  };

  return <ResetPasswordForm onSubmit={onSubmit} serverError={serverError} success={success} />;
}
