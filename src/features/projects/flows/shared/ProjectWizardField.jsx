import { cn } from '@lib/cn';

/* Label + control wrapper for project-creation wizards.
 *
 * Pass `value` + `max` to show an inline counter on the visual left
 * (RTL `start`) inside text inputs — matches the campaign-settings
 * mock. Dropdowns omit `value`/`max` and get no counter. */
export function ProjectWizardField({ label, value, max, className, children }) {
  const showCounter = typeof max === 'number';
  const length = typeof value === 'string' ? value.length : 0;

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-[16px] font-bold text-ink-muted">
        {label}
      </label>
      {showCounter ? (
        <div className="relative">
          {children}
          <span
            dir="ltr"
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 start-3',
              'text-sm tabular-nums',
              length >= max ? 'text-danger font-bold' : 'text-ink-soft'
            )}
          >
            {max}
          </span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
