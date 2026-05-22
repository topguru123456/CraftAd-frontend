import { cn } from '@lib/cn';

/**
 * @param {boolean} [stretch] — match adjacent input height (use inside flex rows with items-stretch).
 */
export function SettingsSaveButton({
  children = 'שמירה',
  loading,
  disabled,
  stretch = false,
  className,
  ...rest
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'shrink-0 inline-flex items-center justify-center gap-2',
        'px-5 rounded-xl text-sm font-bold text-white',
        'bg-brand-gradient hover:shadow-brand active:translate-y-[1px]',
        'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        loading && 'cursor-wait',
        stretch
          ? 'self-stretch h-auto min-h-[48px] max-h-[48px] py-3'
          : 'h-11 min-w-[88px]',
        className,
      )}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
        />
      )}
      <span>{loading ? 'שומר…' : children}</span>
    </button>
  );
}

/** Invisible copy of Field label height — aligns a stretched button with inputs below labels. */
export function FieldLabelSpacer({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'hidden md:block text-sm font-medium text-ink leading-tight mb-1.5',
        'opacity-0 pointer-events-none select-none',
        className,
      )}
    >
      &#8203;
    </span>
  );
}
