import { cn } from '@lib/cn';
export function Field({ label, error, hint, children, className }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
      {children}
      {error  && <span className="block text-sm text-danger">{error}</span>}
      {!error && hint && <span className="block text-sm text-ink-soft">{hint}</span>}
    </label>
  );
}
