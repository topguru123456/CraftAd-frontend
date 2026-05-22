import { z } from 'zod';

const specialChar = /[^A-Za-z0-9]/;

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'סיסמה בת 8 תווים לפחות')
      .regex(specialChar, 'נדרש תו מיוחד אחד לפחות'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'הסיסמאות אינן תואמות',
  });

export const fullNameSchema = z.object({
  name: z.string().trim().min(1, 'יש להזין שם מלא'),
});

export const emailSchema = z.object({
  email: z.string().email('כתובת אימייל לא תקינה'),
});
