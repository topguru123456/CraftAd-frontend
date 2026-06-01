/* Trial summary card on the left side of the checkout modal.
 *
 * Layout (matches the design reference exactly):
 *
 *   Header  — plan name + small subtitle on visual RIGHT (DOM[0]);
 *             green trial label on visual LEFT.
 *   Row 1   — לאחר מכן <green ₪M> <gray strike ₪Mo> <gray suffix>
 *             all inline in one paragraph, right-aligned.
 *   Row 2   — (<green ₪Y> <gray strike ₪Yo> סה״כ) — separate paragraph
 *             stacked below Row 1, right-aligned, smaller.
 *
 * The two body rows are STACKED (space-y-1), not side-by-side in a
 * flex row. The suffix is INLINE inside Row 1 — not on its own line.
 *
 * RTL ordering inside each row follows memory feedback_rtl_dom_ordering:
 * DOM[0] = visual right. Within Row 1: label is rightmost, then 62₪,
 * then 129₪ strikethrough, then the suffix on the visual left. That's
 * the natural Hebrew reading order — "לאחר מכן 62₪ 129₪ לחודש במנוי
 * שנתי" reads right-to-left in that order.
 */

export function PlanSummaryCard({ plan }) {
  const { name, trialLabel, pricing } = plan;

  return (
    <div
      dir="rtl"
      className="bg-white rounded-[20px] border-2 border-brand-100 shadow-[0_8px_24px_rgba(80,20,60,0.10)] p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
        <div className="text-right">
          <p className="text-base font-extrabold text-ink leading-tight">{name}</p>
          <p className="text-xs text-ink-muted mt-1">{trialLabel}</p>
        </div>
        <p className="text-base font-extrabold text-emerald-500 leading-tight pt-0.5 whitespace-nowrap">
          {trialLabel}
        </p>
      </div>

      {/* Body — stacked rows, right-aligned. Row 1 inline suffix, Row 2
          annual total below. */}
      <div className="pt-4 space-y-1 text-right">
        <p className="text-sm leading-snug">
          <span className="text-ink-muted">{pricing.monthlyLabel} </span>
          <span className="text-emerald-500 font-extrabold">
            {pricing.monthly}{pricing.currency}
          </span>
          <span className="text-ink-muted line-through ms-1">
            {pricing.monthlyOriginal}{pricing.currency}
          </span>
          <span className="text-ink-muted"> {pricing.monthlySuffix}</span>
        </p>
        <p className="text-xs text-ink-muted whitespace-nowrap">
          (<span className="text-emerald-500 font-bold">{pricing.annualTotal}{pricing.currency}</span>
          <span className="line-through ms-1">{pricing.annualTotalOriginal.toLocaleString('en-US')}{pricing.currency}</span>
          {' '}{pricing.totalLabel})
        </p>
      </div>
    </div>
  );
}
