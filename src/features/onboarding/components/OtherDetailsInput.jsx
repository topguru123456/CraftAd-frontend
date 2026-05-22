import { Input } from '@components/ui';

export function OtherDetailsInput({
  value,
  onChange,
  label = 'פרט את תשובתך',
  placeholder = 'הקלד/י את תשובתך...',
  autoFocus = true,
}) {
  return (
    <div className="space-y-2 text-right animate-fade-in" dir="rtl">
      <label className="block text-sm font-medium text-ink-muted">{label}</label>
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        maxLength={200}
      />
    </div>
  );
}
