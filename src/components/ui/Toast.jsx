import { createPortal } from 'react-dom';
import { cn } from '@lib/cn';

const POSITION_CLASSES = {
  'top-right':     'top-6 right-6 items-end',
  'top-left':      'top-6 left-6 items-start',
  'bottom-right':  'bottom-6 right-6 items-end',
  'bottom-left':   'bottom-6 left-6 items-start',
  'top-center':    'top-6 left-1/2 -translate-x-1/2 items-center',
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2 items-center',
};

const VARIANTS = {
  success: { iconWrap: 'bg-emerald-50 text-emerald-500',  icon: <CheckIcon /> },
  error:   { iconWrap: 'bg-red-50 text-danger',           icon: <XIcon /> },
  warning: { iconWrap: 'bg-amber-50 text-warning',        icon: <WarnIcon /> },
  info:    { iconWrap: 'bg-brand-50 text-brand-500',      icon: <InfoIcon /> },
};

export function ToastViewport({ toasts, onDismiss, position = 'top-right' }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="region"
      aria-live="polite"
      aria-label="התראות"
      className={cn(
        'fixed z-[200] flex flex-col gap-2 pointer-events-none p-2 max-w-full',
        POSITION_CLASSES[position] ?? POSITION_CLASSES['top-right']
      )}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>,
    document.body
  );
}

function Toast({ toast, onDismiss }) {
  const styles = VARIANTS[toast.variant] ?? VARIANTS.info;
  return (
    <div
      role="status"
      dir="rtl"
      className={cn(
        'pointer-events-auto w-[min(calc(100vw-2rem),360px)] rounded-card bg-white',
        'shadow-[0_12px_32px_rgba(10,31,48,0.18)] border border-line',
        'p-4 flex items-start gap-3 animate-slide-in-right'
      )}
    >
      <span
        aria-hidden="true"
        className={cn('shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full', styles.iconWrap)}
      >
        {styles.icon}
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-ink leading-snug">{toast.message}</p>
        {toast.description && (
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="סגור התראה"
        className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-soft hover:text-ink hover:bg-surface-muted transition-colors"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.3 4l-7.7 13a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
