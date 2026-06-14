import { Add } from 'iconsax-react';
import { cn } from '@lib/cn';

/* Nested-tile chip: light-pink outer "frame" with a bright white
 * halo, a crisp white inner tile holding the brand-pink plus.
 * Structural pattern (outer frame + halo + inner tile) is borrowed
 * from the original Bubble chip; sizing + palette are ours. */
function NestedPlusBadge({ className }) {
  return (
    <span
      aria-hidden="true"
      style={{ boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.45)' }}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-100',
        className,
      )}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white">
        <Add size={22} variant="Bold" color="#D63F84" />
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
