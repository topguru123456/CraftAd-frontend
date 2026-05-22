import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Button, Input, Field } from '@components/ui';
import { LockIcon } from './icons';
import { resetPasswordSchema } from '../schemas/auth.schema';
import { ROUTES } from '@config/routes';

export function ResetPasswordForm({ onSubmit, serverError, success }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(resetPasswordSchema), mode: 'onTouched' });

  const { password, confirm } = watch();
  const isComplete = Boolean(password && confirm);

  if (success) {
    return (
      <div className="space-y-5 text-right" dir="rtl">
        <h1 className="text-[28px] sm:text-3xl font-extrabold leading-[1.2] text-ink">
          הסיסמה עודכנה בהצלחה
        </h1>
        <p className="text-ink-muted leading-relaxed">
          תוכלו להתחבר עם הסיסמה החדשה שלכם.
        </p>
        <p className="text-sm">
          <Link to={ROUTES.auth.signIn} className="link font-semibold">להתחברות</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
      <header className="text-right">
        <h1 className="text-[28px] sm:text-3xl font-extrabold leading-[1.2] text-ink">
          בחרו סיסמה חדשה
        </h1>
      </header>

      <div className="bg-white rounded-card shadow-card p-6 space-y-4">
        <Field label="סיסמה חדשה" error={errors.password?.message}>
          <Input
            type="password"
            placeholder="סיסמה בת 8 תווים לפחות"
            autoComplete="new-password"
            invalid={!!errors.password}
            leftIcon={<LockIcon />}
            {...register('password')}
          />
        </Field>
        <Field label="אישור סיסמה" error={errors.confirm?.message || serverError}>
          <Input
            type="password"
            placeholder="********"
            autoComplete="new-password"
            invalid={!!errors.confirm || !!serverError}
            leftIcon={<LockIcon />}
            {...register('confirm')}
          />
        </Field>

        <Button type="submit" className="w-full" loading={isSubmitting} disabled={!isComplete}>
          שמרו סיסמה חדשה
        </Button>
      </div>
    </form>
  );
}
