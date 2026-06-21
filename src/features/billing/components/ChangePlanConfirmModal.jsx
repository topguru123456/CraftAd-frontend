import { useEffect, useState } from 'react';
import { Modal } from '@components/ui';
import { cn } from '@lib/cn';
import { CURRENCY_SYMBOL, getPlanById } from '../config/plans.config';

/* Confirmation modal for plan/cycle change.
 *
 * Three branches based on the user's pre-action state:
 *   1. Active, picking different plan       → "Switch to <new>"
 *   2. Canceled-pending, picking different  → "Resume + switch to <new>"
 *   3. Canceled-pending, picking same plan  → "Resume" (no plan change)
 *
 * Tranzila has no proration. The plan_id and cycle change immediately
 * on user_metadata; the user keeps access for the existing period, and
 * the next renewal (subscription_current_period_end → now+30d/365d on
 * the new plan) charges the new amount. The modal copy makes this
 * explicit so users don't expect an immediate charge or refund.
 *
 * onConfirm returns the same { data, error } shape as billing.api.js so
 * the modal can surface server errors inline without closing.
 */

const CYCLE_LABEL_HE = {
  monthly: 'חודשי',
  yearly: 'במנוי שנתי',
};

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

export function ChangePlanConfirmModal({
  open,
  onClose,
  onConfirm,
  plan,
  cycle,
  currentPlanId,
  currentCycle,
  periodEndUnix,
  needsResume,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  /* The component stays mounted across open transitions — the parent
   * just flips `confirmState` null/non-null. After a successful
   * confirm we intentionally leave `busy=true` so the spinner persists
   * during the parent's session-refresh + toast cleanup. Without this
   * effect, the next time the user opens the modal (e.g., picks a
   * different plan) the stale `busy=true` would render a phantom
   * spinner before they even click confirm. Reset whenever `open`
   * goes false. */
  useEffect(() => {
    if (!open) {
      setBusy(false);
      setError(null);
    }
  }, [open]);

  if (!plan) return null;

  const isResumeOnly =
    needsResume && plan.id === currentPlanId && cycle === currentCycle;

  const newPrice = plan.pricing?.[cycle]?.price;
  const periodEndDate = formatHebrewDate(periodEndUnix);
  const newCycleLabel = CYCLE_LABEL_HE[cycle] ?? cycle;
  const currentPlan = currentPlanId ? getPlanById(currentPlanId) : null;
  const currentCycleLabel = currentCycle === 'yearly' ? 'שנתי' : 'חודשי';

  const handleClose = () => {
    if (busy) return;
    setError(null);
    onClose?.();
  };

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await onConfirm?.();
    if (result?.error) {
      setError(result.error.message ?? 'העדכון נכשל. נסו שוב.');
      setBusy(false);
      return;
    }
    /* Leave busy=true while the parent runs cleanup (refresh session,
     * toast, close) so the confirm button stays in its spinner state
     * during the visual transition. */
  };

  const title = isResumeOnly
    ? 'המשך מנוי'
    : needsResume
      ? `המשך מנוי + שינוי ל-${plan.name}`
      : `מעבר למסלול ${plan.name}`;

  const subtitle = isResumeOnly
    ? 'הביטול יבוטל והמנוי ימשיך באותו המסלול. לא יבוצע חיוב היום.'
    : needsResume
      ? 'הביטול יבוטל והמסלול יעודכן. החיוב הבא לפי המסלול החדש. לא יבוצע חיוב היום.'
      : 'המסלול ישתנה מיד. החיוב הבא לפי המחיר החדש. לא יבוצע חיוב היום.';

  const ctaLabel = isResumeOnly
    ? 'אישור והמשך מנוי'
    : needsResume
      ? 'אישור והמשך'
      : 'אישור';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      ariaLabel="שינוי מסלול"
      closeOnBackdrop={!busy}
      showCloseButton={!busy}
    >
      <div dir="rtl" className="p-6 sm:p-8 space-y-5">
        <header className="text-right space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink">{title}</h2>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            {subtitle}
          </p>
        </header>

        <section className="rounded-2xl bg-brand-50/40 border border-brand-100 p-4 sm:p-5 space-y-2.5">
          {!isResumeOnly && currentPlan && (
            <Row
              label="מסלול נוכחי"
              value={`${currentPlan.name} (${currentCycleLabel})`}
              muted
            />
          )}
          <Row
            label={isResumeOnly ? 'מסלול' : 'מסלול חדש'}
            value={`${plan.name} (${newCycleLabel})`}
            bold
          />
          {!isResumeOnly && typeof newPrice === 'number' && (
            <Row
              label="מחיר חדש"
              value={
                <>
                  {newPrice}
                  {CURRENCY_SYMBOL} / חודש
                </>
              }
            />
          )}
          {periodEndDate && (
            <Row
              label={needsResume ? 'חידוש המנוי' : 'חיוב הבא'}
              value={periodEndDate}
            />
          )}
        </section>

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
              busy && 'opacity-60 cursor-not-allowed',
            )}
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={cn(
              'inline-flex items-center justify-center gap-2',
              'rounded-xl px-5 h-11 min-w-[180px] font-bold text-sm',
              'bg-brand-gradient text-white shadow-brand',
              busy ? 'cursor-wait opacity-95' : 'hover:opacity-95',
              'transition-opacity',
            )}
          >
            {busy && (
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
              />
            )}
            <span>{busy ? 'מעבד…' : ctaLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value, bold, muted }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span
        className={cn(
          muted ? 'text-base text-ink-muted' : 'text-base text-ink',
          (bold ?? !muted) && 'font-bold',
        )}
      >
        {value}
      </span>
    </div>
  );
}
