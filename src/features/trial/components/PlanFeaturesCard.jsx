import TickIcon from '@assets/icons/tick.svg?react';

export function PlanFeaturesCard({ plan, title = 'מה כלול בתוכנית?' }) {
  return (
    <div
      dir="rtl"
      className="bg-white rounded-[20px] border-2 border-brand-100 shadow-[0_8px_24px_rgba(80,20,60,0.10)] p-5 sm:p-6"
    >
      <h3 className="text-right text-md font-extrabold text-brand-500 mb-2">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-right text-ink">
            <TickIcon className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-[15px] font-medium">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
