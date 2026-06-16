import { Add } from 'iconsax-react';
import { cn } from '@lib/cn';

/* Nested-tile chip matching the original Bubble create-button:
 * white outer card → softly tinted inner tile → brand-pink plus.
 * The structural cue is "stamp inside a paper card", not the
 * stacked-frames-with-halo we had before — the outer is pure
 * white so it reads as a single clean tile against the pink
 * gradient pill, with a subtle white halo for the soft bloom.
 * The inner uses a tiny brand-50 → brand-100 vertical gradient
 * so the nested tile is visible without competing with the +. */
function NestedPlusBadge({ className }) {
  return (
    <span
      aria-hidden="true"
      style={{ boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.35)' }}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white',
        className,
      )}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] bg-gradient-to-b from-brand-50 to-brand-100">
        <Add size={20} variant="Bold" color="#D63F84" />
      </span>
    </span>
  );
}

export function GradientCreateButton({
  children,
  className,
  iconClassName,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center gap-3 rounded-card px-5 py-2.5',
        'bg-brand-gradient text-white text-md font-bold shadow-brand',
        'hover:shadow-[0_10px_22px_rgba(237,86,153,0.45)] active:translate-y-[1px]',
        'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      <NestedPlusBadge className={iconClassName} />
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}
