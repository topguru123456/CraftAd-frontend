import { Add } from 'iconsax-react';
import { cn } from '@lib/cn';

export function CreateMoreButton({ onClick, isDispatching }) {
  const disabled = isDispatching || !onClick;
  return (
    <div className="flex justify-center pt-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-8 py-3',
          'text-base font-bold bg-brand-gradient text-white shadow-brand transition-opacity',
          isDispatching ? 'opacity-60 cursor-wait' : 'hover:opacity-95',
        )}
      >
        {isDispatching ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
          />
        ) : (
          <Add size="18" variant="Bold" color="currentColor" />
        )}
        <span>{isDispatching ? 'יוצר עוד...' : 'צור עוד!'}</span>
      </button>
    </div>
  );
}
