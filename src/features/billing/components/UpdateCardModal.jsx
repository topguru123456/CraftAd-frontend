import { useEffect, useState } from 'react';
import { Modal, Spinner } from '@components/ui';
import { TranzilaIframe } from '@features/trial';
import { billingApi } from '../api/billing.api';
import { useCurrentPlan } from '../hooks/useCurrentPlan';

/* Update payment method.
 *
 * Mounts a fresh Tranzila iframe in `kind='update_card'` mode. The BE's
 * handleNotify path sees kind=update_card and replaces the stored
 * tranzila_token + last4 + expiry; subscription state (plan, cycle,
 * period_end) is left untouched. The next renewal sweep charges the
 * new card on the existing schedule.
 *
 * Uses the same TranzilaIframe component as StartTrialModal — Tranzila's
 * J5 ₪1 verify auto-reverses regardless of whether it's the first card
 * or a replacement.
 *
 * Same notify-vs-redirect race as the trial flow: postMessage tells us
 * the user-visible flow finished; the parent component refreshes
 * session + shows toast. The new last4 becomes visible on the next
 * render via useSubscriptionInfo.
 */
export function UpdateCardModal({ open, onClose, onUpdated }) {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const currentPlan = useCurrentPlan();

  useEffect(() => {
    if (!open) {
      setSession(null);
      setError(null);
      return;
    }
    let cancelled = false;

    billingApi
      .initIframeSession({
        planId: currentPlan.planId,
        cycle: currentPlan.cycle,
        kind: 'update_card',
      })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err || !data?.iframeUrl) {
          setError(err?.message ?? 'לא ניתן לפתוח את הטופס כעת. נסו שוב מאוחר יותר.');
          return;
        }
        setSession(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? 'אירעה שגיאת רשת');
      });

    return () => {
      cancelled = true;
    };
  }, [open, currentPlan.planId, currentPlan.cycle]);

  const handleComplete = (result) => {
    if (result === 'success') {
      onUpdated?.();
      return;
    }
    setError('עדכון הכרטיס לא הושלם. סגרו ונסו שוב.');
  };

  return (
    <Modal open={open} onClose={onClose} size="md" ariaLabel="עדכון אמצעי תשלום">
      <div dir="rtl" className="p-6 sm:p-8 space-y-5">
        <header className="text-right space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink">
            עדכון אמצעי תשלום
          </h2>
          <p className="text-sm text-ink-muted">
            החיוב הבא יתבצע מהכרטיס החדש. לא יבוצע חיוב כעת.
          </p>
        </header>

        {error && (
          <div className="rounded-card border border-danger/20 bg-danger/5 p-3">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <div className="min-h-[300px] flex flex-col">
          {!session && !error ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner size={28} />
            </div>
          ) : session ? (
            <TranzilaIframe
              iframeUrl={session.iframeUrl}
              fields={session.fields}
              onComplete={handleComplete}
            />
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
