import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Button, Input, Field, Divider } from '@components/ui';
import { GoogleButton } from './GoogleButton';
import { MailIcon, LockIcon } from './icons';
import { signInSchema } from '../schemas/auth.schema';
import { ROUTES } from '@config/routes';

export function SignInForm({ onSubmit, onGoogleSignIn, serverError }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(signInSchema), mode: 'onTouched' });

  const { email, password } = watch();
  const isComplete = Boolean(email && password);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
      <header className="text-right space-y-2">
        <h1 className="text-2xl sm:text-[28px] font-extrabold leading-[1.2] text-ink">
          ברוכים השבים,
        </h1>
        <p className="text-ink-muted">התחברו כדי להתחיל</p>
      </header>

      <GoogleButton onClick={onGoogleSignIn}>התחברות באמצעות גוגל</GoogleButton>
      <Divider>או התחברו באמצעות סיסמה</Divider>

      <div className="space-y-3">
        <Field error={errors.email?.message}>
          <Input
            type="email"
            placeholder="אימייל"
            autoComplete="email"
            invalid={!!errors.email || !!serverError}
            leftIcon={<MailIcon />}
            {...register('email')}
          />
        </Field>
        <Field error={errors.password?.message || serverError}>
          <Input
            type="password"
            placeholder="********"
            autoComplete="current-password"
            invalid={!!errors.password || !!serverError}
            leftIcon={<LockIcon />}
            {...register('password')}
          />
        </Field>
      </div>

      <Button type="submit" className="w-full" loading={isSubmitting} disabled={!isComplete}>
        התחברות
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link to={ROUTES.auth.forgotPassword} className="link">שכחתם את הסיסמה?</Link>
        <span className="text-ink-muted">
          אין לך חשבון? <Link to={ROUTES.auth.signUp} className="link font-semibold">צרו חשבון חדש</Link>
        </span>
      </div>
    </form>
  );
}
