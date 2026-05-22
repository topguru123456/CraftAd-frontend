import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@components/ui';
import { cn } from '@lib/cn';
import { useToast } from '@/contexts/ToastContext';
import { accountApi } from '../api/account.api';
import { changePasswordSchema } from '../schemas/account.schema';
import { SettingsSection } from './SettingsSection';
import { FieldLabelSpacer, SettingsSaveButton } from './SettingsSaveButton';

const INPUT_ROW = 'h-12';

function SettingsField({ label, children, error }) {
  return (
    <div className="flex flex-1 flex-col min-w-0">
      <span className="text-sm font-medium text-ink mb-1.5 text-right">{label}</span>
      {children}
      {error ? (
        <p className="text-sm text-danger text-right mt-1.5 min-h-[1.25rem]" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-1.5 min-h-[1.25rem]" aria-hidden="true" />
      )}
    </div>
  );
}

export function ChangePasswordSection() {
  const toast = useToast();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
  });

  const { password, confirm } = watch();
  const canSubmit = Boolean(password && confirm);

  const onSubmit = async ({ password: nextPassword }) => {
    setServerError(null);
    const { error } = await accountApi.updatePassword(nextPassword);
    if (error) {
      setServerError(error.message ?? 'שינוי הסיסמה נכשל');
      return;
    }
    reset();
    toast.success('הסיסמה עודכנה בהצלחה');
  };

  const confirmError = errors.confirm?.message || serverError;

  return (
    <SettingsSection title="שינוי סיסמה">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-3">
          <SettingsField label="סיסמה חדשה" error={errors.password?.message}>
            <Input
              type="password"
              placeholder="מינימום 8 תווים, אחד מיוחד לפחות"
              autoComplete="new-password"
              invalid={!!errors.password}
              className={INPUT_ROW}
              {...register('password')}
            />
          </SettingsField>

          <SettingsField label="אימות סיסמה חדשה" error={confirmError}>
            <Input
              type="password"
              placeholder="כתבו פה את הסיסמה שוב"
              autoComplete="new-password"
              invalid={!!confirmError}
              className={INPUT_ROW}
              {...register('confirm')}
            />
          </SettingsField>

          <div className="flex flex-col w-full md:w-auto md:min-w-[200px] md:max-w-[240px] shrink-0">
            <FieldLabelSpacer />
            <SettingsSaveButton
              type="submit"
              loading={isSubmitting}
              disabled={!canSubmit}
              className={cn('w-full', INPUT_ROW, '!min-h-0 !h-12 self-auto')}
            >
              אישור ושינוי סיסמה
            </SettingsSaveButton>
            <p className="mt-1.5 min-h-[1.25rem]" aria-hidden="true" />
          </div>
        </div>
      </form>
    </SettingsSection>
  );
}
