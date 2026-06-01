/* Trial summary card on the left side of the checkout modal.
 *
 * Compact layout matching the Figma reference exactly:
 *
 *   Top row    name (right) + green trial label (left)
 *              with a small subtitle under the name
 *              ─────────────────────────────────────
 *   Row 1      לאחר מכן <green ₪M> ~~<gray ₪Mo>~~ <gray suffix>
 *   Row 2      (<green ₪Y> ~~<gray ₪Yo>~~ סה״כ)
 *
 * Both content rows are right-aligned and stacked vertically — small
 * inline text rather than separate vertical blocks. The compact form is
 * deliberate per the design reference; the price line carries label +
 * value + strikethrough + suffix all inline, the annual total sits
 * underneath in parentheses at text-xs.
 *
 * tabular-nums on the numbers so the strikethrough digits align with
 * the current-price digits visually (Hebrew text alignment + Latin
 * digits otherwise look slightly off).
 */

export function PlanSummaryCard({ plan }) {
  const { name, trialLabel, pricing } = plan;

  return (
    <div
      dir="rtl"
      className="bg-white rounded-[20px] border-2 border-brand-100 shadow-[0_8px_24px_rgba(80,20,60,0.10)] p-5 sm:p-6"
    >
      {/* Header — plan name + subtitle on right, green trial label on left */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
        <div className="text-right">
          <p className="text-base font-extrabold text-ink leading-tight">{name}</p>
          <p className="text-xs text-ink-muted mt-1">{trialLabel}</p>
        </div>
        <p className="text-base font-extrabold text-emerald-500 leading-tight pt-0.5 whitespace-nowrap">
          {trialLabel}
        </p>
      </div>

      {/* Price rows — stacked, right-aligned, compact */}
      <div className="pt-4 space-y-1 text-right">
        <p className="text-sm leading-snug">
          <span className="text-ink-muted">{pricing.monthlyLabel} </span>
          <span className="text-emerald-500 font-extrabold tabular-nums">
            {pricing.monthly}{pricing.currency}
          </span>
          <span className="text-ink-muted line-through ms-1 tabular-nums">
            {pricing.monthlyOriginal}{pricing.currency}
          </span>
          <span className="text-ink-muted"> {pricing.monthlySuffix}</span>
        </p>
        <p className="text-xs text-ink-muted whitespace-nowrap">
          (
          <span className="text-emerald-500 font-bold tabular-nums">
            {pricing.annualTotal}{pricing.currency}
          </span>
          <span className="line-through ms-1 tabular-nums">
            {pricing.annualTotalOriginal.toLocaleString('en-US')}{pricing.currency}
          </span>
          {' '}{pricing.totalLabel})
        </p>
      </div>
    </div>
  );
}
