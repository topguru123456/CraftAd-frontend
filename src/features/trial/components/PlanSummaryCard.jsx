export function PlanSummaryCard({ plan }) {
  const { name, trialLabel, pricing } = plan;

  return (
    <div
      dir="rtl"
      className="bg-white rounded-[20px] border-2 border-brand-100 shadow-[0_8px_24px_rgba(80,20,60,0.10)] p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
        <div className="text-right">
          <p className="text-base font-extrabold text-ink leading-tight">{name}</p>
          <p className="text-xs text-ink-muted mt-1">{trialLabel}</p>
        </div>
        <p className="text-base font-extrabold text-emerald-500 leading-tight pt-0.5">
          {trialLabel}
        </p>
      </div>

      <div className="flex items-end justify-between gap-4 pt-4">
        <div className="text-right">
          <p className="text-sm text-ink">
            <span className="text-ink-muted">{pricing.monthlyLabel} </span>
            <span className="text-emerald-500 font-extrabold">{pricing.monthly}{pricing.currency}</span>
            <span className="text-ink-muted line-through ms-1">{pricing.monthlyOriginal}{pricing.currency}</span>
          </p>
          <p className="text-xs text-ink-muted mt-1">{pricing.monthlySuffix}</p>
        </div>
        <p className="text-xs text-ink-muted whitespace-nowrap">
          (<span className="text-emerald-500 font-bold">{pricing.annualTotal}{pricing.currency}</span>
          <span className="line-through ms-1">{pricing.annualTotalOriginal.toLocaleString('en-US')}{pricing.currency}</span>
          {' '}{pricing.totalLabel})
        </p>
      </div>
    </div>
  );
}
