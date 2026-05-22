import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@lib/cn';

const SIZES = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-5xl',
  '2xl':'max-w-6xl',
  full: 'max-w-[min(1180px,calc(100vw-2rem))]',
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  size = 'md',
  closeOnEsc = true,
  closeOnBackdrop = true,
  showCloseButton = true,
  ariaLabel,
  ariaLabelledBy,
  className,
  panelClassName,
  children,
}) {
  const dialogRef = useRef(null);
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
        const focusables = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
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
  // keystroke inside the modal (input lost focus to the X button after
  // each character typed). Holding the handler in a ref keeps the keydown
  // listener current without re-triggering the setup.
  const handleKeyDownRef = useRef(handleKeyDown);
  useEffect(() => {
    handleKeyDownRef.current = handleKeyDown;
  });

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const listener = (e) => handleKeyDownRef.current(e);
    document.addEventListener('keydown', listener);

    const focusables = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
    const firstFocusable = focusables?.[0];
    if (firstFocusable) {
      firstFocusable.focus({ preventScroll: true });
    } else {
      dialogRef.current?.focus({ preventScroll: true });
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
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto',
        className
      )}
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

      {/* translate="no" so browser translation extensions don't re-parent
        text nodes inside the portal. Without it, Google Translate
        wraps Hebrew strings in <font> tags and React's next
        insertBefore call into the modal subtree throws NotFoundError
        ("not a child of this node"). The global `<meta name="google"
        content="notranslate">` in index.html is the primary defense;
        this attribute makes the modal portal robust even if that
        meta is missing in an embed or unusual environment. */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        translate="no"
        className={cn(
          'relative w-full bg-white rounded-[28px] shadow-[0_30px_80px_rgba(10,31,48,0.35)] outline-none animate-modal-in overflow-hidden',
          SIZES[size] ?? SIZES.md,
          panelClassName
        )}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="absolute top-4 end-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        )}

        {children}
      </div>
    </div>,
    document.body
  );
}
