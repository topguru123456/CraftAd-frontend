import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Button, Input, Field, Divider, TermsLink } from '@components/ui';
import { GoogleButton } from './GoogleButton';
import { MailIcon, LockIcon } from './icons';
import { signUpSchema } from '../schemas/auth.schema';
import { ROUTES } from '@config/routes';

export function SignUpForm({ onSubmit, onGoogleSignIn, serverError, confirmationSent }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(signUpSchema), mode: 'onTouched' });

  const { email, password, confirm } = watch();
  const isComplete = Boolean(email && password && confirm);

  if (confirmationSent) {
    return (
      <div className="space-y-5 text-right" dir="rtl">
        <h1 className="text-2xl sm:text-[28px] font-extrabold leading-[1.2] text-ink">
          בדקו את האימייל שלכם
        </h1>
        <p className="text-ink-muted leading-relaxed">
          שלחנו אליכם קישור לאימות החשבון. הקליקו על הקישור באימייל כדי להתחיל להשתמש ב־CraftAd.
        </p>
        <p className="text-sm text-ink-muted">
          לא קיבלתם את האימייל? בדקו בתיבת הספאם או{' '}
          <Link to={ROUTES.auth.signUp} className="link font-semibold">נסו שוב</Link>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
      <header className="text-right">
        <h1 className="text-2xl sm:text-[28px] font-extrabold leading-[1.2] text-ink">
          הירשמו לניסיון וקבלו<br />10 קריאייטיבים במתנה!
        </h1>
      </header>

      <GoogleButton onClick={onGoogleSignIn}>הרשמה עם גוגל</GoogleButton>
      <Divider>או הירשמו באמצעות סיסמה</Divider>

      <div className="space-y-3">
        <Field error={errors.email?.message || serverError}>
          <Input
            type="email"
            placeholder="אימייל"
            autoComplete="email"
            invalid={!!errors.email || !!serverError}
            leftIcon={<MailIcon />}
            {...register('email')}
          />
        </Field>
        <Field error={errors.password?.message}>
          <Input
            type="password"
            placeholder="סיסמה בת 8 ספרות לפחות"
            autoComplete="new-password"
            invalid={!!errors.password}
            leftIcon={<LockIcon />}
            {...register('password')}
          />
        </Field>
        <Field error={errors.confirm?.message}>
          <Input
            type="password"
            placeholder="********"
            autoComplete="new-password"
            invalid={!!errors.confirm}
            leftIcon={<LockIcon />}
            {...register('confirm')}
          />
        </Field>
      </div>

      <Button type="submit" className="w-full" loading={isSubmitting} disabled={!isComplete}>
        הרשמה לתקופת ניסיון ללא עלות
      </Button>

      <p className="text-center text-sm text-ink-muted">
        ההרשמה מהווה הסכמה <TermsLink>לתקנון ההתקשרות</TermsLink>
      </p>
      <p className="text-center text-sm text-ink-muted">
        כבר יש לך חשבון? <Link to={ROUTES.auth.signIn} className="link font-semibold">התחבר</Link>
      </p>
    </form>
  );
}
