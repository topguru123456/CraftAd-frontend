import { Add } from 'iconsax-react';
import { cn } from '@lib/cn';

/**
 * Gradient CTA with the nested plus badge used on the projects/brands
 * toolbars (white tile → light-pink tile → pink +). Border-radius is
 * the shared `rounded-card` (16px) design token — matches the app's
 * card/button language; the prior `rounded-pill` (9999px) made the
 * ends fully semicircular which QA flagged as off-language.
 */
function NestedPlusBadge({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white p-1',
        className,
      )}
    >
      <span className="inline-flex h-full w-full items-center justify-center rounded-lg bg-brand-50">
        <Add size={18} variant="Bold" color="#D63F84" />
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
