import { useState } from 'react';
import { Modal } from '@components/ui';
import { cn } from '@lib/cn';
import { CURRENCY_SYMBOL } from '../config/plans.config';

/* In-app subscribe confirmation.
 *
 * Shown when /billing/checkout returns kind=confirm — meaning the user
 * already has a card on file (from onboarding's SetupIntent). Skipping
 * Stripe Checkout for this case avoids forcing the user to re-enter the
 * same card they already gave us. The modal IS the confirmation step —
 * it explicitly names the card, the plan, the price, and the trial terms
 * so the user knows exactly what's about to happen.
 *
 * Closing the modal cancels the action; clicking "Subscribe" calls the
 * parent's `onConfirm` which POSTs /billing/subscribe. We only render
 * the spinner / error here — the Subscription is created server-side
 * and the webhook updates user_metadata.subscription_* a moment later.
 *
 * `cycle` controls which price to display (monthly vs yearly tier from
 * the FE plans.config.js). The number rendered is what the user is
 * actually agreeing to pay per month. */

const CARD_BRAND_LABELS = {
  visa:        'Visa',
  mastercard:  'Mastercard',
  amex:        'American Express',
  discover:    'Discover',
  jcb:         'JCB',
  diners:      'Diners Club',
  unionpay:    'UnionPay',
  unknown:     'Card',
};

export function SubscribeConfirmModal({
  open,
  onClose,
  onConfirm,
  card,
  plan,
  cycle,
  trialDays = 7,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

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
      setError(result.error.message ?? 'הרישום נכשל. נסו שוב.');
      setBusy(false);
      return;
    }
    /* Success — parent owns the close + toast. We leave `busy` true so
     * the button stays in its spinner state during the parent's cleanup
     * (toast + modal close). */
  };

  if (!plan) return null;

  const cyclePricing = plan.pricing?.[cycle];
  const price = cyclePricing?.price;
  const cycleLabelHe = cycle === 'yearly' ? 'במנוי שנתי' : 'חודשי';

  const brandLabel = CARD_BRAND_LABELS[card?.brand] ?? CARD_BRAND_LABELS.unknown;
  const expMonth = card?.expMonth ? String(card.expMonth).padStart(2, '0') : '--';
  const expYear = card?.expYear ? String(card.expYear).slice(-2) : '--';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      ariaLabel="אישור הצטרפות למסלול"
      closeOnBackdrop={!busy}
      showCloseButton={!busy}
    >
      <div dir="rtl" className="p-6 sm:p-8 space-y-6">
        {/* Header */}
        <header className="text-center space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink">
            הצטרפות למסלול {plan.name}
          </h2>
          <p className="text-sm sm:text-base text-ink-muted">
            {trialDays} ימי ניסיון חינם — לא יבוצע חיוב היום
          </p>
        </header>

        {/* Plan summary card */}
        <section className="rounded-2xl bg-brand-50/40 border border-brand-100 p-4 sm:p-5 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-muted">המסלול</span>
            <span className="text-base font-bold text-ink">{plan.name}</span>
          </div>
          {typeof price === 'number' && (
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-muted">לאחר הניסיון</span>
              <span className="text-base font-bold text-ink">
                {price}{CURRENCY_SYMBOL} / חודש <span className="text-xs text-ink-muted font-normal">({cycleLabelHe})</span>
              </span>
            </div>
          )}
          <div className="flex items-baseline justify-between pt-1 border-t border-brand-100">
            <span className="text-sm text-ink-muted">לתשלום היום</span>
            <span className="text-base font-extrabold text-brand-600">0{CURRENCY_SYMBOL}</span>
          </div>
        </section>

        {/* Card preview */}
        <section className="rounded-2xl border border-line p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="text-right space-y-0.5">
            <p className="text-xs text-ink-muted">שיטת תשלום</p>
            <p className="text-base font-bold text-ink">
              {brandLabel} •••• {card?.last4 ?? '••••'}
            </p>
            <p className="text-xs text-ink-soft">
              תוקף {expMonth}/{expYear}
            </p>
          </div>
          <CardBrandGlyph brand={card?.brand} />
        </section>

        {error && <p className="text-sm text-danger text-right">{error}</p>}

        {/* Actions */}
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
              'transition-opacity'
            )}
          >
            {busy && (
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
              />
            )}
            <span>{busy ? 'מעבד...' : `אישור והתחלת ניסיון של ${trialDays} ימים`}</span>
          </button>
        </div>

        {/* Footnote */}
        <p className="text-[11px] text-ink-soft text-center leading-relaxed">
          ניתן לבטל בכל עת לפני סיום הניסיון מבלי להיות מחויבים.
          לאחר {trialDays} ימים יבוצע חיוב אוטומטי לכרטיס שלמעלה לפי תנאי המסלול.
        </p>
      </div>
    </Modal>
  );
}

/* Tiny inline brand mark — keeps the modal dependency-free (no extra
 * icon-set install for credit card brands). Falls back to a generic
 * "CARD" pill for unknown brands so the layout doesn't shift. */
function CardBrandGlyph({ brand }) {
  const text = (brand ?? 'card').toUpperCase().slice(0, 4);
  return (
    <span
      aria-hidden="true"
      className="shrink-0 inline-flex items-center justify-center rounded-md bg-ink/5 px-2 h-7 text-[11px] font-extrabold text-ink tracking-wide"
    >
      {text}
    </span>
  );
}
