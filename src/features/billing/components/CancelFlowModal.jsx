import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@components/ui';
import { cn } from '@lib/cn';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@lib/supabase';
import { requestQuotaRefresh } from '@/contexts/QuotaContext';
import TickIcon from '@assets/icons/tick.svg?react';
import { billingApi } from '../api/billing.api';
import {
  CURRENCY_SYMBOL,
  getPlanById,
} from '../config/plans.config';

/* Three-step subscription-cancellation flow.
 *
 *   Step 1 — REASON CAPTURE: the user picks ONE of the predefined
 *            reasons + an optional free-text note (required when
 *            'אחר' / 'other' is chosen; optional otherwise). Reason
 *            IDs are English / kebab-case so analytics + future
 *            retention routing stay language-agnostic.
 *
 *   Step 2 — DISCOUNT OFFER: 50% off the next renewal charge. One
 *            per user lifetime — skipped entirely when
 *            `user_metadata.retention_discount_used` is already true.
 *            Accepting calls /billing/tranzila/apply-retention-discount
 *            which clears any pending cancel state and writes the
 *            discount the renewal runner consumes on the next sweep.
 *            Declining advances to step 3.
 *
 *   Step 3 — FINAL CONFIRM: grace-period-end explanation + the actual
 *            cancel call. Reached when the user declined the offer OR
 *            already used their discount.
 *
 * The same modal stays mounted across all steps so the user sees a
 * smooth transition rather than three backdrops. Reset on close so a
 * re-open starts fresh. */

const REASONS = [
  { id: 'too_expensive',   label: 'המחיר גבוה לי' },
  { id: 'not_using',       label: 'לא מצאתי שימוש מספיק' },
  { id: 'missing_feature', label: "חסרה לי פיצ'ר מסוים" },
  { id: 'temporary_break', label: 'אני לוקח/ת הפסקה זמנית' },
  { id: 'switching_tool',  label: 'עובר/ת לכלי אחר' },
  { id: 'other',           label: 'אחר' },
];

const NOTE_MAX_LENGTH = 1000;
const RETENTION_DISCOUNT_PCT = 50;

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

export function CancelFlowModal({ open, onClose, onCancelled, periodEndUnix }) {
  const { user } = useAuth();
  const toast = useToast();
  const meta = user?.user_metadata ?? {};
  const planId = meta.subscription_plan_id ?? 'starter';
  const cycle = meta.subscription_cycle ?? 'monthly';
  const skipOffer = meta.retention_discount_used === true;

  const [step, setStep] = useState('reason'); // 'reason' | 'offer' | 'confirm'
  const [reasonId, setReasonId] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  /* Reset the flow whenever the modal opens — re-entry should start
   * on step 1 with a fresh form, not resume mid-flow. */
  useEffect(() => {
    if (!open) {
      setStep('reason');
      setReasonId(null);
      setNote('');
      setBusy(false);
      setError(null);
    }
  }, [open]);

  const formattedDate = formatHebrewDate(periodEndUnix);
  const noteRequired = reasonId === 'other';
  const noteTrimmed = note.trim();
  const canProceedToOffer =
    Boolean(reasonId) && (!noteRequired || noteTrimmed.length > 0);

  const handleClose = () => {
    if (busy) return;
    setError(null);
    onClose?.();
  };

  const handleProceedFromReason = () => {
    if (!canProceedToOffer) return;
    setError(null);
    setStep(skipOffer ? 'confirm' : 'offer');
  };

  const handleBackToReason = () => {
    if (busy) return;
    setError(null);
    setStep('reason');
  };

  const handleAcceptOffer = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await billingApi.applyRetentionDiscount({
      reason: reasonId,
      note: noteTrimmed || undefined,
    });
    if (err) {
      setError(err.message ?? 'הפעלת ההנחה נכשלה. נסו שוב.');
      setBusy(false);
      return;
    }
    /* Refresh the session so user_metadata reflects retention_discount_used
     * = true (so the offer is hidden if the user clicks cancel again),
     * + so the cancel flag is cleared if it was pending. Then close +
     * surface the win as a success toast. */
    await supabase.auth.refreshSession();
    requestQuotaRefresh();
    toast.success('ההנחה הופעלה! החיוב הבא יבוצע במחיר מוזל.');
    onClose?.();
  };

  const handleDeclineOffer = () => {
    if (busy) return;
    setError(null);
    setStep('confirm');
  };

  const handleConfirmCancel = async () => {
    if (busy || !reasonId) return;
    setBusy(true);
    setError(null);
    const { error: err } = await billingApi.cancelSubscription({
      reason: reasonId,
      note: noteTrimmed || undefined,
    });
    if (err) {
      setError(err.message ?? 'לא ניתן לבטל את המנוי כעת. נסו שוב.');
      setBusy(false);
      return;
    }
    /* Leave busy=true while parent runs cleanup (refresh + toast +
     * close); the useEffect resets on `open=false`. */
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
        {step === 'reason' && (
          <ReasonStep
            reasonId={reasonId}
            onReasonChange={setReasonId}
            note={note}
            onNoteChange={setNote}
            noteRequired={noteRequired}
            error={error}
            onClose={handleClose}
            onProceed={handleProceedFromReason}
            canProceed={canProceedToOffer}
            proceedLabel={skipOffer ? 'המשך' : 'המשך'}
          />
        )}
        {step === 'offer' && (
          <OfferStep
            planId={planId}
            cycle={cycle}
            busy={busy}
            error={error}
            onBack={handleBackToReason}
            onAccept={handleAcceptOffer}
            onDecline={handleDeclineOffer}
          />
        )}
        {step === 'confirm' && (
          <ConfirmStep
            formattedDate={formattedDate}
            busy={busy}
            error={error}
            onBack={skipOffer ? handleBackToReason : () => setStep('offer')}
            onConfirm={handleConfirmCancel}
          />
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1: reason picker                                               */
/* ------------------------------------------------------------------ */

function ReasonStep({
  reasonId,
  onReasonChange,
  note,
  onNoteChange,
  noteRequired,
  error,
  onClose,
  onProceed,
  canProceed,
  proceedLabel,
}) {
  return (
    <>
      <header className="text-right space-y-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-ink">
          לפני שתבטלו את המנוי
        </h2>
        <p className="text-sm text-ink-muted leading-relaxed">
          נשמח להבין מה הסיבה שאתם עוזבים. המידע עוזר לנו לשפר את השירות.
        </p>
      </header>

      <fieldset className="space-y-2">
        <legend className="sr-only">סיבת ביטול</legend>
        {REASONS.map((option) => (
          <ReasonRadio
            key={option.id}
            label={option.label}
            value={option.id}
            selected={reasonId === option.id}
            onSelect={() => onReasonChange(option.id)}
          />
        ))}
      </fieldset>

      <div className="space-y-1.5">
        <label
          htmlFor="cancel-note"
          className="block text-sm font-bold text-ink text-right"
        >
          {noteRequired ? 'פרטו לנו יותר *' : 'הערה נוספת (אופציונלי)'}
        </label>
        <textarea
          id="cancel-note"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          maxLength={NOTE_MAX_LENGTH}
          rows={3}
          dir="rtl"
          placeholder="אם תרצו להוסיף משהו, נשמח לקרוא…"
          className={cn(
            'w-full rounded-xl border border-line bg-white',
            'px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft text-right',
            'focus:border-brand-300 focus:outline-none focus:shadow-focus',
            'resize-y min-h-[80px]',
          )}
        />
        <div className="flex items-center justify-between">
          {noteRequired && note.trim().length === 0 ? (
            <span className="text-xs text-danger">שדה חובה כאשר נבחר "אחר"</span>
          ) : (
            <span />
          )}
          <span dir="ltr" className="text-xs text-ink-soft">
            {note.length} / {NOTE_MAX_LENGTH}
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/5 p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'rounded-xl px-5 h-11 font-bold text-sm border border-line text-ink',
            'hover:bg-surface-muted transition-colors',
          )}
        >
          חזרה
        </button>
        <button
          type="button"
          onClick={onProceed}
          disabled={!canProceed}
          className={cn(
            'inline-flex items-center justify-center gap-2',
            'rounded-xl px-5 h-11 min-w-[160px] font-bold text-sm',
            canProceed
              ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
              : 'bg-brand-100 text-brand-300 cursor-not-allowed',
            'transition-opacity',
          )}
        >
          {proceedLabel}
        </button>
      </div>
    </>
  );
}

function ReasonRadio({ label, value, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'w-full flex items-center justify-between gap-3',
        'rounded-xl border px-4 py-3 text-right transition-colors',
        selected
          ? 'border-brand-300 bg-brand-50/60'
          : 'border-line bg-white hover:border-brand-200',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full border-2',
          selected ? 'border-brand-500' : 'border-line',
        )}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
      </span>
      <span className="flex-1 text-sm font-medium text-ink">{label}</span>
      <span className="sr-only">{value}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2: discount offer                                              */
/* ------------------------------------------------------------------ */

function OfferStep({ planId, cycle, busy, error, onBack, onAccept, onDecline }) {
  const plan = useMemo(() => getPlanById(planId), [planId]);
  /* Display price (per-month) — yearly subscribers see the per-month
   * equivalent (e.g. ₪62/mo for Starter yearly) which is what matches
   * the user's mental model from the pricing page. Math.floor so the
   * user benefits on half-shekel rounding (e.g. ₪119/mo → ₪59/mo). */
  const fullPrice = plan?.pricing?.[cycle]?.price ?? 0;
  const discountedPrice = Math.floor((fullPrice * (100 - RETENTION_DISCOUNT_PCT)) / 100);

  return (
    <>
      <header className="text-right space-y-2">
        <p className="text-sm font-bold text-brand-500">
          רגע לפני שמבטלים, יש לנו הצעה
        </p>
        <h2 className="text-xl sm:text-2xl font-extrabold text-ink">
          קבלו {RETENTION_DISCOUNT_PCT}% הנחה על החיוב הבא
        </h2>
        <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
          לא רוצים להיפרד. כלקוחות מוערכים של Craftad, נשמח להציע לכם{' '}
          {RETENTION_DISCOUNT_PCT}% הנחה על התשלום הבא. המשיכו ליצור מודעות יפות
          וממירות בחצי מהמחיר.
        </p>
      </header>

      <OfferPlanCard
        planName={plan?.name ?? 'Plan'}
        features={plan?.features ?? []}
        fullPrice={fullPrice}
        discountedPrice={discountedPrice}
      />

      {error && (
        <div className="rounded-card border border-danger/20 bg-danger/5 p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={onAccept}
          disabled={busy}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2',
            'rounded-xl h-12 font-bold text-base',
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
          <span>{busy ? 'מפעיל הנחה…' : 'כן, אני רוצה את ההנחה'}</span>
        </button>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className={cn(
              'text-xs text-ink-soft underline-offset-2 hover:underline transition-colors',
              busy && 'opacity-60 cursor-not-allowed',
            )}
          >
            הקודם
          </button>
          <button
            type="button"
            onClick={onDecline}
            disabled={busy}
            className={cn(
              'text-sm font-bold text-ink underline-offset-2 hover:underline transition-colors',
              busy && 'opacity-60 cursor-not-allowed',
            )}
          >
            לא תודה, להמשיך לביטול
          </button>
        </div>
      </div>
    </>
  );
}

function OfferPlanCard({ planName, features, fullPrice, discountedPrice }) {
  return (
    <section
      className={cn(
        'relative rounded-2xl bg-brand-50/40 border border-brand-200/60',
        'p-4 sm:p-5 space-y-4',
      )}
    >
      {/* RTL header row.
       *   DOM[0] = visual RIGHT  → price block (strikethrough + discounted)
       *   DOM[1] = visual LEFT   → plan name + badges + subtitle
       * This matches the design sample. Reversing them swaps the columns
       * because in `dir="rtl"` the first DOM child renders at inline-start
       * which is the visual right edge. */}
      <div className="flex items-start justify-between gap-3">
        <div className="text-right shrink-0">
          <p className="text-sm text-ink-soft line-through tabular-nums leading-tight">
            {fullPrice}
            {CURRENCY_SYMBOL} / חודש
          </p>
          <p className="text-[28px] font-extrabold text-brand-600 tabular-nums leading-tight">
            <span>{discountedPrice}</span>
            <span className="ms-1">{CURRENCY_SYMBOL}</span>
            <span className="text-base font-bold text-ink ms-1">/ חודש</span>
          </p>
        </div>

        <div className="space-y-1.5 text-right">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold text-ink">{planName} Plan</h3>
            <span className="inline-flex items-center rounded-full bg-brand-500 text-white text-[11px] font-bold px-2 py-0.5">
              {RETENTION_DISCOUNT_PCT}% הנחה
            </span>
            <span className="inline-flex items-center rounded-full bg-rose-100 text-brand-600 text-[11px] font-bold px-2 py-0.5">
              מבצע מוגבל
            </span>
          </div>
          <p className="text-xs text-ink-muted">
            החיוב יתחדש במחיר הרגיל לאחר חודש אחד.
          </p>
        </div>
      </div>

      {features.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 text-sm text-ink"
            >
              <TickIcon className="h-3.5 w-3.5 shrink-0 text-brand-500" />
              <span className="text-right">{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3: final confirm                                               */
/* ------------------------------------------------------------------ */

function ConfirmStep({ formattedDate, busy, error, onBack, onConfirm }) {
  return (
    <>
      <header className="text-right space-y-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-ink">
          ביטול מנוי
        </h2>
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
          onClick={onBack}
          disabled={busy}
          className={cn(
            'rounded-xl px-5 h-11 font-bold text-sm border border-line text-ink',
            'hover:bg-surface-muted transition-colors',
            busy && 'opacity-60 cursor-not-allowed',
          )}
        >
          הקודם
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={cn(
            'inline-flex items-center justify-center gap-2',
            'rounded-xl px-5 h-11 min-w-[180px] font-bold text-sm',
            'border-2 border-danger text-danger bg-white',
            busy ? 'cursor-wait opacity-95' : 'hover:bg-rose-50',
            'transition-colors',
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
    </>
  );
}
