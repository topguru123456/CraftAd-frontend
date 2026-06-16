import { Add } from 'iconsax-react';
import { cn } from '@lib/cn';

/* White plus glyph on the pink gradient pill. The earlier
 * nested-tile chip competed with the Hebrew label for visual
 * weight; a bare glyph in a sized slot reads cleaner and matches
 * the simpler create-button language the rest of the app uses. */
function PlusGlyph({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]',
        className,
      )}
    >
      <Add size={22} variant="Bold" color="#FFFFFF" />
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
      <PlusGlyph className={iconClassName} />
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}
