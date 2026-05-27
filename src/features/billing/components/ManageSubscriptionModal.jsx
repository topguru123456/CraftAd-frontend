import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@components/ui';
import { cn } from '@lib/cn';
import { ROUTES } from '@config/routes';
import { supabase } from '@lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { requestQuotaRefresh } from '@/contexts/QuotaContext';
import { useSubscriptionInfo } from '@features/settings/hooks/useSubscriptionInfo';
import { CancelConfirmModal } from './CancelConfirmModal';
import { UpdateCardModal } from './UpdateCardModal';

/* In-app subscription management — the panel that replaces the Stripe
 * Customer Portal redirect.
 *
 * Shows the user's current plan + period_end + card last4, plus three
 * actions: change plan (navigates to /app/settings/payment), update
 * card (opens UpdateCardModal), cancel (opens CancelConfirmModal).
 *
 * Sub-modal stacking: while a sub-modal (cancel or update-card) is
 * open, this modal is visually hidden via `open={open && !activeAction}`
 * so the browser doesn't render two backdrops at once. When the
 * sub-modal closes, this one reappears with refreshed metadata.
 *
 * Refresh strategy: after a successful action (cancel or update-card),
 * we await supabase.auth.refreshSession() so user_metadata updates
 * land in the JWT, then requestQuotaRefresh() so the gate re-evaluates
 * against the new plan/status, then show a toast. The modal stays
 * open so the user sees the new state in-place.
 */
export function ManageSubscriptionModal({ open, onClose }) {
  const info = useSubscriptionInfo();
  const nav = useNavigate();
  const toast = useToast();
  const [activeAction, setActiveAction] = useState(null);

  const refreshAfterAction = async () => {
    await supabase.auth.refreshSession();
    requestQuotaRefresh();
  };

  const handleChangePlan = () => {
    onClose?.();
    nav(ROUTES.app.settings.payment);
  };

  const handleUpdated = async () => {
    setActiveAction(null);
    await refreshAfterAction();
    toast.success('הכרטיס עודכן בהצלחה');
  };

  const handleCancelled = async () => {
    setActiveAction(null);
    await refreshAfterAction();
    toast.success('המנוי יסתיים בתום תקופת החיוב הנוכחית');
  };

  return (
    <>
      <Modal
        open={open && !activeAction}
        onClose={onClose}
        size="md"
        ariaLabel="ניהול מנוי"
      >
        <div dir="rtl" className="p-6 sm:p-8 space-y-5">
          <header className="text-right">
            <h2 className="text-xl sm:text-2xl font-extrabold text-ink">ניהול מנוי</h2>
          </header>

          <section className="rounded-2xl bg-brand-50/40 border border-brand-100 p-4 sm:p-5 space-y-2.5">
            <Row label="מסלול נוכחי" value={info.planName} />
            {info.periodEndLabel && info.periodEndLabel !== '—' && (
              <Row
                label={info.cancelAtPeriodEnd ? 'גישה עד' : 'חידוש הבא'}
                value={info.periodEndLabel}
              />
            )}
            {info.cardLast4 && (
              <Row label="אמצעי תשלום" value={`•••• ${info.cardLast4}`} />
            )}
            {info.cancelAtPeriodEnd && (
              <p className="text-xs text-ink-muted pt-2 border-t border-brand-100">
                המנוי בוטל. הגישה תסתיים בתאריך לעיל ולאחר מכן לא יבוצע חיוב.
              </p>
            )}
          </section>

          <div className="space-y-2">
            <ActionButton onClick={handleChangePlan}>שינוי מסלול</ActionButton>
            <ActionButton onClick={() => setActiveAction('update_card')}>
              עדכון אמצעי תשלום
            </ActionButton>
            {!info.cancelAtPeriodEnd && (
              <ActionButton
                variant="danger"
                onClick={() => setActiveAction('cancel')}
              >
                ביטול מנוי
              </ActionButton>
            )}
          </div>
        </div>
      </Modal>

      <UpdateCardModal
        open={activeAction === 'update_card'}
        onClose={() => setActiveAction(null)}
        onUpdated={handleUpdated}
      />

      <CancelConfirmModal
        open={activeAction === 'cancel'}
        onClose={() => setActiveAction(null)}
        onCancelled={handleCancelled}
        periodEndUnix={info.periodEndUnix}
      />
    </>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-base font-bold text-ink">{value}</span>
    </div>
  );
}

function ActionButton({ children, onClick, variant }) {
  const base = 'w-full rounded-xl h-11 font-bold text-sm transition-colors';
  const styles =
    variant === 'danger'
      ? 'border-2 border-danger bg-white text-danger hover:bg-rose-50'
      : 'border border-line bg-white text-ink hover:bg-surface-muted';
  return (
    <button type="button" onClick={onClick} className={cn(base, styles)}>
      {children}
    </button>
  );
}
