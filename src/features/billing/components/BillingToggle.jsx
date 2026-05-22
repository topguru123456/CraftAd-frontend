import { cn } from '@lib/cn';
import { BILLING_CYCLES } from '../config/plans.config';

/* Compact monthly/yearly toggle.
 *
 * - Container: white, rounded-lg (NOT pill), subtle shadow.
 * - Active button: light-pink fill (brand-50) with brand-500 text.
 * - Inactive: transparent with muted text.
 *
 * RTL DOM-order rule: BILLING_CYCLES is [monthly, yearly]. In RTL flex,
 * monthly (first DOM) lands on the right and yearly (last) on the left —
 * matching the screenshot (חודשי right, שנתי left).
 */
export function BillingToggle({ value, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="מחזור חיוב"
      className="inline-flex items-center gap-1 p-1 rounded-lg bg-white shadow-[0_4px_14px_rgba(80,20,60,0.08)]"
    >
      {BILLING_CYCLES.map((cycle) => {
        const selected = value === cycle.id;
        return (
          <button
            key={cycle.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(cycle.id)}
            className={cn(
              'px-2.5 py-1.5 rounded-md text-[18px] font-normal transition-colors duration-150',
              selected
                ? 'bg-brand-50 text-brand-500'
                : 'text-ink-muted hover:text-ink'
            )}
          >
            {cycle.label}
          </button>
        );
      })}
    </div>
  );
}
