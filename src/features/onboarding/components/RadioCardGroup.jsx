import { cn } from '@lib/cn';

export function RadioCardGroup({ name, value, onChange, options }) {
  return (
    <div role="radiogroup" className="space-y-3">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <RadioCard
            key={opt.value}
            name={name}
            option={opt}
            selected={selected}
            onSelect={() => onChange(opt.value)}
          />
        );
      })}
    </div>
  );
}

function RadioCard({ name, option, selected, onSelect }) {
  const Icon = option.icon;
  return (
    <label
      dir="rtl"
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3.5 rounded-card border-2 bg-white cursor-pointer transition-all duration-150',
        selected
          ? 'border-brand-500 shadow-[0_4px_14px_rgba(237,86,153,0.18)]'
          : 'border-line hover:border-brand-200'
      )}
    >
      <input
        type="radio"
        name={name}
        value={option.value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />

      {/* Icon — the Figma SVGs render their own gradient + drop-shadow
          rounded-square treatment, so no wrapper bg/color override.
          The `selected` prop swaps to the selected-variant SVG. */}
      <span className="inline-flex shrink-0 items-center justify-center">
        {Icon ? <Icon selected={selected} /> : null}
      </span>

      <span className="flex-1 text-right text-lg font-normal text-ink">
        {option.label}
      </span>

      <span
        aria-hidden="true"
        className={cn(
          'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150',
          selected ? 'border-brand-500' : 'border-line'
        )}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />}
      </span>
    </label>
  );
}
