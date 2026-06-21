import { cn } from '@lib/cn';
import TickIcon from '@assets/icons/tick.svg?react';
import { CURRENCY_SYMBOL } from '../config/plans.config';

/* Single pricing card.
 *
 * `isCurrent` is true only when BOTH plan.id AND billingCycle match the
 * user's active subscription tuple — toggling cycles flips the same
 * plan back to "selectable" because that would be a real plan change.
 *
 * `isCanceled` only matters together with `isCurrent`. When the user
 * cancelled their plan but is still inside the grace period
 * (cancel_at_period_end=true, plan_id still set), the card is the
 * "current plan" technically — but the CTA flips to a resume action
 * and we show the grace-end date above it. Without this state the
 * cancelled user just saw "המסלול שלך" with a disabled CTA — no
 * indication anything had changed.
 *
 * Active uncancelled  → solid pink CTA labelled "המסלול שלך", non-clickable.
 * Active cancelled    → solid pink CTA labelled "המשך מנוי", CLICKABLE,
 *                       with a small grace-end banner above.
 * Inactive            → white outline CTA labelled "בחירה".
 */
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

export function PlanCard({
  plan,
  billingCycle,
  isCurrent,
  isCanceled,
  periodEndUnix,
  isSelecting,
  isLocked,
  onSelect,
}) {
  const showCanceledBanner = isCurrent && isCanceled;
  const periodEndLabel = showCanceledBanner ? formatHebrewDate(periodEndUnix) : null;
  const cyclePricing = plan.pricing[billingCycle];

  return (
    <article className="relative flex flex-col rounded-3xl bg-white/65 backdrop-blur-[2px] ring-4 ring-white/80 shadow-[0_18px_40px_rgba(120,30,60,0.12)] p-5 sm:p-6">
      {/* Plan name pill — small, centered. */}
      <div className="flex justify-center mb-3">
        <span className="inline-block bg-rose-100/70 text-brand-600 font-extrabold text-sm px-3 py-1 rounded-full">
          {plan.name}
        </span>
      </div>

      {/* Price block.
          DOM order [number, currency] → in RTL the currency renders on the
          right of the number, matching the screenshot's "349 ש״ח" reading
          order. Discount badge (yearly only) sits on the LEFT (last DOM). */}
      <div className="text-center space-y-1 mb-2">
        <div className="flex items-baseline gap-2 justify-center" dir="rtl">
          
          <div className="flex items-center">
            {cyclePricing.discount && (
              <span className="bg-[#18C84A] ml-2 text-white text-[14px] font-extrabold px-1.5 py-0.5 rounded-md">
                {cyclePricing.discount}%-
              </span>
            )}
            <span className="text-[44px] sm:text-[50px] font-bold leading-none text-ink">
              {cyclePricing.price}
            </span>
            <span className="text-[42px] sm:text-[48px] font-bold leading-none text-ink ms-1">
              {CURRENCY_SYMBOL}
            </span>
            <p className="text-[18px] text-ink mr-2">/ חודש</p>
          </div>

        </div>

      </div>

      {/* Description */}
      <p className="text-center text-[16px] text-ink mb-4 min-h-[1.5em] px-2">
        {plan.description}
      </p>

      {/* Cancellation banner — only shown when this is the user's
          current plan AND it has cancel_at_period_end=true. Pinned
          above the CTA so the user reads "this plan is ending" before
          they see the resume button. */}
      {showCanceledBanner && (
        <div
          role="status"
          className="mb-2.5 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs sm:text-sm text-rose-700 leading-snug text-center"
        >
          {periodEndLabel
            ? `המנוי בוטל. הגישה תסתיים ב-${periodEndLabel}. לחצו לחידוש.`
            : 'המנוי בוטל. לחצו לחידוש.'}
        </div>
      )}

      {/* CTA. Four states:
          - current uncancelled : pink-gradient, "המסלול שלך", non-interactive
          - current cancelled   : pink-gradient, "המשך מנוי", CLICKABLE (opens resume modal)
          - selecting           : spinner while the change-plan request is in flight
          - locked              : another card is selecting, gray out to avoid double-fire
          - default             : white outline, "בחירה" */}
      <button
        type="button"
        onClick={
          isSelecting || isLocked
            ? undefined
            : isCurrent && !isCanceled
              ? undefined
              : onSelect
        }
        disabled={isSelecting || isLocked || (isCurrent && !isCanceled)}
        aria-disabled={isSelecting || isLocked || (isCurrent && !isCanceled)}
        className={cn(
          'w-full font-bold py-2.5 rounded-xl transition-colors mb-4',
          'inline-flex items-center justify-center gap-2',
          isCurrent
            ? isCanceled
              ? 'bg-gradient-to-l from-brand-400 to-brand-500 text-white shadow-[0_8px_18px_rgba(215,78,124,0.35)] hover:opacity-95'
              : 'bg-gradient-to-l from-brand-400 to-brand-500 text-white cursor-default shadow-[0_8px_18px_rgba(215,78,124,0.35)]'
            : isSelecting
              ? 'bg-brand-500 text-white cursor-wait'
              : isLocked
                ? 'bg-white border border-line text-ink-soft cursor-not-allowed'
                : 'bg-white border border-brand-400 hover:border-brand-500 text-ink'
        )}
      >
        {isSelecting && (
          <span
            aria-hidden="true"
            className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
          />
        )}
        <span>
          {isCurrent
            ? isCanceled
              ? 'המשך מנוי'
              : 'המסלול שלך'
            : isSelecting
              ? 'פותח תשלום...'
              : 'בחירה'}
        </span>
      </button>

      {/* Feature list. divide-y handles inter-row separators (no per-item
          conditional borders). RTL: tick lands on the LEFT (last DOM). */}
      <ul className="divide-y divide-gray-400/50" dir="rtl">
        {plan.features.map((feature) => (
          
          <li key={feature} className="flex items-center gap-2 py-1.5 text-[16px] text-ink mb-1.5">
            <TickIcon className="h-4.5 w-4.5 shrink-0 text-brand-500" />
            <span className="flex-1 text-right">{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
