import { Add } from 'iconsax-react';
import { cn } from '@lib/cn';

/* White chip with a brand-pink plus, sitting on the gradient pill.
 * Single-layer card — no nested inner tile — with a soft white halo
 * for the gentle bloom borrowed from the original Bubble chip. */
function PlusBadge({ className }) {
  return (
    <span
      aria-hidden="true"
      style={{ boxShadow: '0 0 0 3px rgba(255, 255, 255, 0.35)' }}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white',
        className,
      )}
    >
      <Add size={22} variant="Bold" color="#D63F84" />
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
        'inline-flex items-center gap-3 rounded-card px-2.5 py-2.5',
        'bg-brand-gradient text-white text-md font-bold shadow-brand',
        'hover:shadow-[0_10px_22px_rgba(237,86,153,0.45)] active:translate-y-[1px]',
        'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      <PlusBadge className={iconClassName} />
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}
