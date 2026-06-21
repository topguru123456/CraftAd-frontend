import { useEffect, useState } from 'react';
import { Modal } from '@components/ui';
import { cn } from '@lib/cn';
import { billingApi } from '../api/billing.api';

/* Two-step subscription-cancellation flow.
 *
 *   Step 1 — REASON CAPTURE: the user picks ONE of the predefined
 *            reasons + an optional free-text note (required when
 *            'אחר' / 'other' is chosen; optional otherwise). Reason
 *            IDs are English / kebab-case so analytics + future
 *            retention routing stay language-agnostic.
 *
 *   Step 2 — FINAL CONFIRM: grace-period-end explanation + the
 *            actual cancel call. Single endpoint receives both
 *            steps' data in one request.
 *
 * Why a multi-step modal instead of the original one-click cancel:
 *   - Churn-analytics: knowing WHY users leave is the input to every
 *     retention decision we'll make later (discounts, pause-instead-
 *     of-cancel, feature priority).
 *   - Light retention friction: a reason picker before the final
 *     confirm is the floor of any retention flow — even without an
 *     offer it nudges users to think twice. Discount/pause logic
 *     comes in a later turn and reads `cancellation_reason` to route.
 *
 * The same modal stays mounted across both steps so the user sees
 * a smooth step transition rather than two backdrops. Reset on
 * close so a re-open starts at step 1 with a fresh form. */

const REASONS = [
  { id: 'too_expensive',   label: 'המחיר גבוה לי' },
  { id: 'not_using',       label: 'לא מצאתי שימוש מספיק' },
  { id: 'missing_feature', label: "חסרה לי פיצ'ר מסוים" },
  { id: 'temporary_break', label: 'אני לוקח/ת הפסקה זמנית' },
  { id: 'switching_tool',  label: 'עובר/ת לכלי אחר' },
  { id: 'other',           label: 'אחר' },
];

const NOTE_MAX_LENGTH = 1000;

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
  const [step, setStep] = useState('reason'); // 'reason' | 'confirm'
  const [reasonId, setReasonId] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  /* Reset the flow whenever the modal opens — re-entry should start
   * on step 1 with a fresh form, not resume mid-flow. Tied to `open`
   * (not unmount) so quick close/re-open doesn't carry state. */
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
  const canProceedToConfirm =
    Boolean(reasonId) && (!noteRequired || noteTrimmed.length > 0);

  const handleClose = () => {
    if (busy) return;
    setError(null);
    onClose?.();
  };

  const handleProceed = () => {
    if (!canProceedToConfirm) return;
    setError(null);
    setStep('confirm');
  };

  const handleBack = () => {
    if (busy) return;
    setError(null);
    setStep('reason');
  };

  const handleConfirm = async () => {
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
        {step === 'reason' ? (
          <ReasonStep
            reasonId={reasonId}
            onReasonChange={setReasonId}
            note={note}
            onNoteChange={setNote}
            noteRequired={noteRequired}
            error={error}
            onClose={handleClose}
            onProceed={handleProceed}
            canProceed={canProceedToConfirm}
          />
        ) : (
          <ConfirmStep
            formattedDate={formattedDate}
            busy={busy}
            error={error}
            onBack={handleBack}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </Modal>
  );
}

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
          המשך
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
      {/* `value` is bound to the option's id; kept off-DOM so we don't
          duplicate it in the visible label */}
      <span className="sr-only">{value}</span>
    </button>
  );
}

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
