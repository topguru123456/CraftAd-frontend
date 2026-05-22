import { forwardRef } from 'react';
import { cn } from '@lib/cn';

const variants = { primary:'btn-primary', outline:'btn-outline', ghost:'btn-ghost' };
const sizes = { sm:'px-3 py-2 text-base', md:'px-4 py-3 text-lg', lg:'px-5 py-4 text-lg' };

export const Button = forwardRef(function Button(
  { variant='primary', size='md', loading, className, children, ...rest }, ref
) {
  return (
    <button ref={ref} className={cn(variants[variant], sizes[size], className)} disabled={loading || rest.disabled} {...rest}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {children}
    </button>
  );
});
