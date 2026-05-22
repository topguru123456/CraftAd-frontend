import { forwardRef } from 'react';
import { cn } from '@lib/cn';

export const Input = forwardRef(function Input(
  { className, leftIcon, rightIcon, invalid, ...rest }, ref
) {
  return (
    // Added 'flex items-center' to the wrapper
    <div className="relative flex items-center width-full">
      {leftIcon && (
        <span className="absolute start-3 flex items-center justify-center text-ink-soft pointer-events-none">
          {leftIcon}
        </span>
      )}
      
      <input 
        ref={ref} 
        className={cn(
          'input w-full', // Ensure full width
          leftIcon && 'ps-10', 
          rightIcon && 'pe-10', 
          invalid && 'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(220,38,38,0.2)]', 
          className
        )} 
        {...rest} 
      />

      {rightIcon && (
        <span className="absolute end-3 flex items-center justify-center text-ink-soft pointer-events-none">
          {rightIcon}
        </span>
      )}
    </div>
  );
});