import { forwardRef } from 'react';
import { cn } from '@lib/cn';

export const Input = forwardRef(function Input(
  { className, leftIcon, rightIcon, invalid, ...rest }, ref
) {
  return (
    <div className="relative flex items-center w-full">
      {leftIcon && (
        /* inset-y-0 stretches the span to the input's full 50px height
         * so the inner flex items-center actually centers the icon
         * vertically. Without inset-y-0, absolute positioning pins the
         * span to the top of the relative parent and the icon sits
         * misaligned. */
        <span className="absolute start-3 inset-y-0 flex items-center justify-center text-ink-soft pointer-events-none">
          {leftIcon}
        </span>
      )}

      <input
        ref={ref}
        className={cn(
          'input w-full',
          leftIcon && 'ps-10',
          rightIcon && 'pe-10',
          invalid && 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(220,38,38,0.2)]',
          className,
        )}
        {...rest}
      />

      {rightIcon && (
        <span className="absolute end-3 inset-y-0 flex items-center justify-center text-ink-soft pointer-events-none">
          {rightIcon}
        </span>
      )}
    </div>
  );
});