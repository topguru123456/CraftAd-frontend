import { useState } from 'react';
import { Modal } from '@components/ui';
import { cn } from '@lib/cn';
import { billingApi } from '../api/billing.api';

/* Cancel-subscription confirmation.
 *
 * Tranzila has no "cancel subscription" concept on their end — we own
 * the lifecycle. /billing/tranzila/cancel just sets
 * cancel_at_period_end=true on user_metadata. Access continues until
 * subscription_current_period_end; the renewal runner finalizes by
 * clearing the subscription_* keys when that date passes.
 *
 * UX intent: make the grace behaviour explicit so users don't think
 * they're losing access immediately. Hide the close button while
 * the request is in flight to avoid a "ghost cancel" if the network
 * is slow and the user navigates away. */
function formatHebrewDate(unixSeconds) {
  if (!unixSeconds) return null;
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function CancelConfirmModal({ open, onClose, onCancelled, periodEndUnix }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const formattedDate = formatHebrewDate(periodEndUnix);

  const handleClose = () => {
    if (busy) return;
    setError(null);
    onClose?.();
  };

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await billingApi.cancelSubscription();
    if (err) {
      setError(err.message ?? 'לא ניתן לבטל את המנוי כעת. נסו שוב.');
      setBusy(false);
      return;
    }
    /* Leave busy=true while the parent runs its cleanup (refresh
     * session, toast, close) so the confirm button stays in its
     * spinner state during the visual transition. */
    onCancelled?.();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      ariaLabel="ביטול מנוי"
      closeOnBackdrop={!busy}
      showCloseButton={!busy}
    >
      <div dir="rtl" className="p-6 sm:p-8 space-y-5">
        <header className="text-right space-y-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink">ביטול מנוי</h2>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            {formattedDate
              ? `המנוי שלכם יישאר פעיל עד ${formattedDate}. לאחר התאריך הזה לא תחויבו ולא תהיה לכם גישה למסלול.`
              : 'המנוי יבוטל. לאחר תקופת החיוב הנוכחית לא תחויבו ולא תהיה לכם גישה למסלול.'}
          </p>
        </header>

        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/5 p-3">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className={cn(
              'rounded-xl px-5 h-11 font-bold text-sm border border-line text-ink',
              'hover:bg-surface-muted transition-colors',
              busy && 'opacity-60 cursor-not-allowed'
            )}
          >
            השארת המנוי
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={cn(
              'inline-flex items-center justify-center gap-2',
              'rounded-xl px-5 h-11 min-w-[180px] font-bold text-sm',
              'border-2 border-danger text-danger bg-white',
              busy ? 'cursor-wait opacity-95' : 'hover:bg-rose-50',
              'transition-colors'
            )}
          >
            {busy && (
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border-2 border-danger/40 border-t-danger animate-spin"
              />
            )}
            <span>{busy ? 'מבטל…' : 'בטל מנוי'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
