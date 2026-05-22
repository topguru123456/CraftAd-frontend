import { cn } from '@lib/cn';
import TickIcon from '@assets/icons/tick.svg?react';
import { CURRENCY_SYMBOL } from '../config/plans.config';

/* Single pricing card.
 *
 * `isCurrent` is true only when BOTH plan.id AND billingCycle match the
 * user's active subscription tuple — toggling cycles flips the same plan
 * back to "selectable" because that would be a real Stripe sub change.
 *
 * Active card → solid pink CTA labelled "המסלול שלך", non-clickable.
 * Inactive   → white outline CTA labelled "בחירה".
 */
export function PlanCard({ plan, billingCycle, isCurrent, isSelecting, isLocked, onSelect }) {
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

      {/* CTA. Three states:
          - current plan: pink-gradient, "המסלול שלך", non-interactive
          - selecting: spinner while we mint the Stripe Checkout URL
          - locked: another card is selecting, gray out to avoid double-fire
          - default: white outline, "בחירה" */}
      <button
        type="button"
        onClick={isCurrent || isSelecting || isLocked ? undefined : onSelect}
        disabled={isCurrent || isSelecting || isLocked}
        aria-disabled={isCurrent || isSelecting || isLocked}
        className={cn(
          'w-full font-bold py-2.5 rounded-xl transition-colors mb-4',
          'inline-flex items-center justify-center gap-2',
          isCurrent
            ? 'bg-gradient-to-l from-brand-400 to-brand-500 text-white cursor-default shadow-[0_8px_18px_rgba(215,78,124,0.35)]'
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
            ? 'המסלול שלך'
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
