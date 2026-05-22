import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
  password: z.string().min(8, 'סיסמה בת 8 תווים לפחות'),
});

export const signUpSchema = z
  .object({
    email: z.string().email('כתובת אימייל לא תקינה'),
    password: z.string().min(8, 'סיסמה בת 8 תווים לפחות'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'הסיסמאות אינן תואמות' });

export const forgotPasswordSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'סיסמה בת 8 תווים לפחות'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'הסיסמאות אינן תואמות' });
