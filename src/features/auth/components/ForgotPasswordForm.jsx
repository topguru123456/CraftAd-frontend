import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Button, Input, Field } from '@components/ui';
import { MailIcon } from './icons';
import { forgotPasswordSchema } from '../schemas/auth.schema';
import { ROUTES } from '@config/routes';

export function ForgotPasswordForm({ onSubmit, serverError, sent }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(forgotPasswordSchema), mode: 'onTouched' });

  const { email } = watch();
  const isComplete = Boolean(email);

  if (sent) {
    return (
      <div className="space-y-5 text-right" dir="rtl">
        <h1 className="text-[28px] sm:text-3xl font-extrabold leading-[1.2] text-ink">
          בדקו את האימייל שלכם
        </h1>
        <p className="text-ink-muted leading-relaxed">
          אם הכתובת שהזנתם רשומה במערכת, שלחנו אליכם קישור לאיפוס סיסמה.
        </p>
        <p className="text-sm">
          <Link to={ROUTES.auth.signIn} className="link font-semibold">חזרה להתחברות</Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
      <header className="text-right">
        <h1 className="text-[28px] sm:text-3xl font-extrabold leading-[1.2] text-ink">
          אפס את הסיסמה שלך
        </h1>
      </header>

      <div className="bg-white rounded-card shadow-card p-6 space-y-5">
        <Field label="כתובת אימייל" error={errors.email?.message || serverError}>
          <Input
            type="email"
            placeholder="Tali@acme.co.il"
            autoComplete="email"
            invalid={!!errors.email || !!serverError}
            leftIcon={<MailIcon />}
            {...register('email')}
          />
        </Field>

        <Button type="submit" className="w-full" loading={isSubmitting} disabled={!isComplete}>
          שלח אימייל לאיפוס סיסמה
        </Button>
      </div>

      <p className="text-center text-sm text-ink-muted">
        <Link to={ROUTES.auth.signIn} className="link font-semibold">חזרה להתחברות</Link>
      </p>
    </form>
  );
}
