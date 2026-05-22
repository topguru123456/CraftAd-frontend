export const getErrorMessage = (err) => {
  if (!err) return 'אירעה שגיאה';
  if (typeof err === 'string') return err;
  return err.response?.data?.message || err.message || 'אירעה שגיאה';
};

const SUPABASE_ERROR_MAP = {
  'Invalid login credentials': 'אימייל או סיסמה שגויים',
  'Email not confirmed': 'יש לאמת את כתובת האימייל לפני התחברות',
  'User already registered': 'משתמש עם אימייל זה כבר רשום במערכת',
  'Email rate limit exceeded': 'נשלחו יותר מדי בקשות. נסו שוב בעוד מספר דקות',
  'Password should be at least 6 characters': 'סיסמה בת 6 תווים לפחות',
  'Unable to validate email address: invalid format': 'כתובת אימייל לא תקינה',
  'New password should be different from the old password': 'הסיסמה החדשה חייבת להיות שונה מהקודמת',
  'Auth session missing!': 'תוקף הקישור פג. בקשו קישור חדש',
  'Token has expired or is invalid': 'תוקף הקישור פג. בקשו קישור חדש',
  'Email link is invalid or has expired': 'תוקף הקישור פג. בקשו קישור חדש',
  'Signup requires a valid password': 'יש להזין סיסמה תקינה',
};

const SUPABASE_ERROR_PREFIX_MAP = [
  ['For security purposes, you can only request this after', 'מטעמי אבטחה, ניתן לנסות שוב בעוד מספר שניות'],
  ['Email address', 'כתובת אימייל לא תקינה'],
];

export function getAuthErrorMessage(error) {
  if (!error) return null;
  const msg = typeof error === 'string' ? error : error.message;
  if (!msg) return 'אירעה שגיאה. נסו שוב';
  if (SUPABASE_ERROR_MAP[msg]) return SUPABASE_ERROR_MAP[msg];
  for (const [prefix, translation] of SUPABASE_ERROR_PREFIX_MAP) {
    if (msg.startsWith(prefix)) return translation;
  }
  return 'אירעה שגיאה. נסו שוב';
}
