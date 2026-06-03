import { cn } from '@lib/cn';
import { CharCounter } from './CharCounter';

/* Label + control wrapper for project-creation wizards.
 *
 * Pass `value` + `max` to render a helper-text counter below the field
 * showing how many characters remain. Dropdowns omit `value`/`max` and
 * get no counter. The counter sits below the input so it doesn't
 * compete with the field's own padding or right-aligned RTL text. */
export function ProjectWizardField({ label, value, max, className, children }) {
  const showCounter = typeof max === 'number';
  const length = typeof value === 'string' ? value.length : 0;

  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-[16px] font-bold text-ink-muted">
        {label}
      </label>
      {children}
      {showCounter && <CharCounter length={length} max={max} />}
    </div>
  );
}
