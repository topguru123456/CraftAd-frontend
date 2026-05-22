import { cn } from '@lib/cn';

/* Toggle group for binary / few-option fields like שירות vs מוצר or
 * חם vs קר. Visually a pill-rounded container holding equally-sized
 * buttons; selected option lights up with the brand-rose tint, the
 * others stay flat.
 *
 * Generic on `options` so any `[{ id, label }]` taxonomy works. Use
 * `<Dropdown>` instead when there are 4+ options or when the user
 * shouldn't see the full set up-front.
 *
 * Renders as a real radio group for screen readers — each option is
 * `role="radio"` with `aria-checked`, the wrapper is `role="radiogroup"`.
 *
 * RTL: DOM order [opt1, opt2] → opt1 lands on the visual right,
 * opt2 on the left. Pass options in reading order (rightmost first).
 */
export function SegmentedControl({ options, value, onChange, ariaLabel }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      dir="rtl"
      className="inline-flex w-full rounded-xl border border-line bg-white p-1"
    >
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.id)}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg text-md font-bold transition-colors',
              selected
                ? 'bg-rose-50 text-brand-500 shadow-sm'
                : 'text-ink-muted hover:bg-surface-muted/50'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
