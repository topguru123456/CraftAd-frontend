import { useState } from 'react';
import { Modal } from './Modal';
import { cn } from '@lib/cn';

/* Dialog primitive for "are you sure?" prompts.
 *
 * Replaces `window.confirm()` — that gives us a native browser dialog
 * that can't match the brand's visual language and locks up the main
 * thread. This component is built on the existing <Modal/> so it
 * inherits focus trap, scroll lock, ESC dismissal, and the same
 * shadow/animation language as every other in-app modal.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={pendingDelete !== null}
 *     onCancel={() => setPendingDelete(null)}
 *     onConfirm={async () => { await deleteBrand(...); setPendingDelete(null); }}
 *     title="למחיקת המותג"
 *     description={`המותג "${brand.name}" יימחק לצמיתות.`}
 *     confirmLabel="מחק"
 *     variant="danger"
 *   />
 *
 * `onConfirm` may be async; the component shows a spinner on the
 * confirm button until it resolves and only then closes itself. If
 * `onConfirm` throws, the error is allowed to propagate (or be caught
 * by the caller) — the dialog stays open so the user can retry or
 * dismiss.
 *
 * `variant`:
 *   - 'danger'  — destructive action, confirm button is solid danger
 *   - 'primary' — default, confirm button is the brand-gradient primary
 */
const VARIANT_CLASSES = {
  danger:
    'bg-danger text-white shadow-[0_8px_18px_rgba(220,38,38,0.30)] hover:bg-danger/90',
  primary:
    'bg-brand-gradient text-white shadow-brand hover:opacity-95',
};

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  variant = 'primary',
}) {
  const [isWorking, setIsWorking] = useState(false);

  const handleConfirm = async () => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      await onConfirm?.();
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={isWorking ? () => {} : onCancel}
      size="sm"
      closeOnEsc={!isWorking}
      closeOnBackdrop={!isWorking}
      showCloseButton={false}
      ariaLabel={title}
    >
      <div dir="rtl" className="px-6 sm:px-8 py-7 text-right">
        {title && (
          <h2 className="text-lg sm:text-xl font-extrabold text-ink mb-2">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-sm sm:text-base text-ink-muted mb-6">
            {description}
          </p>
        )}

        {/* DOM order [confirm, cancel] in RTL → confirm sits on the
            right (start), cancel on the left. Mirrors the QuotaLimit
            modal's button row so the wider app feels consistent. */}
        <div className="flex items-center justify-start gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isWorking}
            className={cn(
              'inline-flex items-center justify-center min-w-[120px] px-5 py-2.5',
              'rounded-xl text-base font-bold transition-opacity',
              VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary,
              isWorking && 'opacity-90 cursor-wait'
            )}
          >
            {isWorking ? (
              <span
                aria-hidden="true"
                className="h-5 w-5 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
              />
            ) : (
              confirmLabel
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isWorking}
            className={cn(
              'btn-outline inline-flex items-center justify-center min-w-[100px] px-5 py-2.5 text-base',
              isWorking && 'opacity-60 cursor-not-allowed'
            )}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
