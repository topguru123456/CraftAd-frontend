import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@lib/cn';

/* Side panel that slides in from the RTL "end" edge (visual left).
 *
 * Built on the same skeleton as Modal — focus trap, ESC handler, body
 * scroll lock, click-outside-to-close — but laid out as an edge-anchored
 * panel rather than a centered card. Useful for context views like brand
 * details, where the user wants to see the surrounding page state but
 * can't interact with it until they decide.
 *
 * The panel is full-width on mobile and caps at a sensible reading width
 * on desktop. Override via `panelClassName`.
 *
 * App is RTL-only at the moment; the slide animation is hard-coded to
 * come in from the visual left. When LTR support lands, the animation +
 * `inset-inline-end` pinning give us symmetric behavior for free.
 */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Drawer({
  open,
  onClose,
  closeOnEsc = true,
  closeOnBackdrop = true,
  showCloseButton = true,
  ariaLabel,
  ariaLabelledBy,
  className,
  panelClassName,
  children,
}) {
  const panelRef = useRef(null);
  const previousFocusRef = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (!open) return;
      if (closeOnEsc && e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
        if (!focusables || focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [open, closeOnEsc, onClose]
  );

  // Stable ref to the latest handleKeyDown. Putting handleKeyDown in
  // the setup effect's deps caused the whole setup-and-cleanup to re-run
  // whenever a consumer passed a fresh inline `onClose` — which restored
  // previous focus AND re-auto-focused the first focusable on every
  // keystroke inside the drawer (inputs lost focus after each character
  // typed). Same fix as <Modal> — see its comment for the full trace.
  const handleKeyDownRef = useRef(handleKeyDown);
  useEffect(() => {
    handleKeyDownRef.current = handleKeyDown;
  });

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement;

    /* Lock body scroll while open so the page behind doesn't drift. */
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const listener = (e) => handleKeyDownRef.current(e);
    document.addEventListener('keydown', listener);

    /* Focus the first interactive element so keyboard users land
     * inside the drawer, not on whatever was behind it. */
    const focusables = panelRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
    const firstFocusable = focusables?.[0];
    if (firstFocusable) {
      firstFocusable.focus({ preventScroll: true });
    } else {
      panelRef.current?.focus({ preventScroll: true });
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.removeEventListener('keydown', listener);
      const previous = previousFocusRef.current;
      if (previous && typeof previous.focus === 'function') {
        previous.focus({ preventScroll: true });
      }
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={cn('fixed inset-0 z-[100]', className)}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <div
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm animate-fade-in"
      />

      <aside
        ref={panelRef}
        tabIndex={-1}
        dir="rtl"
        className={cn(
          /* Pinned to the RTL end (visual left). Full-height + scroll
             internally so the body scroll lock outside is never visible.
             `scrollbar-brand` matches the sidebar's pink scrollbar so
             both vertical scrolls in the same shell read as one
             treatment. */
          'absolute inset-y-0 end-0 flex flex-col',
          /* Width steps up at each breakpoint so the panel feels like a
             real workspace (forms, dropdowns, color rows) instead of a
             cramped peek. xl gives generous room while still leaving the
             page visible behind. Override via `panelClassName`. */
          'w-full sm:w-[560px] lg:w-[680px] xl:w-[760px]',
          'bg-white shadow-2xl outline-none overflow-y-auto scrollbar-brand',
          'animate-drawer-in-end',
          panelClassName
        )}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className={cn(
              'absolute top-4 start-4 z-10',
              'inline-flex h-9 w-9 items-center justify-center',
              'rounded-full text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors'
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        )}

        {children}
      </aside>
    </div>,
    document.body
  );
}
