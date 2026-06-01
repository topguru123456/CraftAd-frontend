/* Trial summary card on the left side of the checkout modal.
 *
 * Three blocks, top-to-bottom:
 *   1. Plan name + trial-duration pill (single source — no duplicate
 *      trial label across the card the way the prior version had).
 *   2. Monthly price block — small "לאחר מכן" label, big emerald
 *      headline price, muted strikethrough original beside it, suffix
 *      below. The emerald headline is the single focal point.
 *   3. Annual total row — divider above; label on the right, current
 *      total + strikethrough original on the left. Neutral `text-ink`
 *      so it doesn't fight the monthly headline emerald — emerald is
 *      reserved for the one focal element.
 *
 * Layout is RTL throughout. flex+justify-between rows are in DOM
 * reading order; in RTL the first child renders on the visual right
 * (label position), the last child on the visual left (value position).
 */

export function PlanSummaryCard({ plan }) {
  const { name, trialLabel, pricing } = plan;
  const {
    currency,
    monthly,
    monthlyOriginal,
    annualTotal,
    annualTotalOriginal,
    monthlyLabel,
    monthlySuffix,
    totalLabel,
  } = pricing;

  return (
    <div
      dir="rtl"
      className="bg-white rounded-[20px] border-2 border-brand-100 shadow-[0_8px_24px_rgba(80,20,60,0.10)] p-5 sm:p-6"
    >
      {/* 1. Plan name + trial pill */}
      <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-line">
        <h3 className="text-lg sm:text-xl font-extrabold text-ink leading-tight">
          {name}
        </h3>
        <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 whitespace-nowrap">
          {trialLabel}
        </span>
      </div>

      {/* 2. Monthly price block — the headline element */}
      <div className="space-y-1.5">
        <p className="text-xs sm:text-sm text-ink-muted">{monthlyLabel}</p>
        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 leading-none tabular-nums">
            {monthly}{currency}
          </span>
          <span className="text-base text-ink-muted line-through tabular-nums">
            {monthlyOriginal}{currency}
          </span>
        </div>
        <p className="text-xs text-ink-muted">{monthlySuffix}</p>
      </div>

      {/* 3. Annual total — separated by a divider */}
      <div className="mt-5 pt-4 border-t border-line">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-ink-muted">{totalLabel}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-ink tabular-nums">
              {annualTotal}{currency}
            </span>
            <span className="text-sm text-ink-muted line-through tabular-nums">
              {annualTotalOriginal.toLocaleString('en-US')}{currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
