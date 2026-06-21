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
/* Cap was 1500px historically — too narrow on 1440p / 4K / maximised
 * 1080p once the side chrome (sidebar + chat panel) is accounted for;
 * the content sat in a 1500px island with hundreds of empty pixels on
 * either side. 1800px gives the grid pages enough room to fan out to
 * the 4-col `3xl` breakpoint we added on the project-types launcher,
 * while still keeping single-column pages from stretching uncomfortably
 * wide on ultrawide displays. */
export function PageContainer({ children, className }) {
  return (
    <div className={cn('mx-auto w-full max-w-[1800px] px-4 sm:px-8 lg:px-12 py-8 sm:py-10', className)}>
      {children}
    </div>
  );
}
