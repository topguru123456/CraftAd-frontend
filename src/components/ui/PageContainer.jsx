import { cn } from '@lib/cn';

/**
 * Standard centered page container — every "normal" /app page wraps its
 * content in one of these. Pages that need a full-bleed background (like
 * the Payment page with its gradient) skip the wrapper and put one inside
 * their own bg div instead.
 *
 * Pulled out of <AppLayout/> so individual pages can opt out of the
 * width/padding constraint when their design demands it.
 */
export function PageContainer({ children, className }) {
  return (
    <div className={cn('mx-auto w-full max-w-[1500px] px-4 sm:px-8 lg:px-12 py-8 sm:py-10', className)}>
      {children}
    </div>
  );
}
