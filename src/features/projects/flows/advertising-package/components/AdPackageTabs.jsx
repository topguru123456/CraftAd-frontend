import { cn } from '@lib/cn';

const TABS = [
  { id: 'images', label: 'קריאייטיב לקמפיינים' },
  { id: 'copy',   label: 'קופירייטינג למודעות' },
];

// Same responsive height (h-11/md:h-12) as the toolbar buttons so
// the row stays on one baseline.
export function AdPackageTabs({ active, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="סוג התוצאות"
      dir="rtl"
      className="h-11 md:h-12 inline-flex w-full max-w-full items-center rounded-xl bg-white border border-brand-100 p-1 shadow-soft"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={tab.id === active}
          onClick={() => onChange(tab.id)}
          className={cn(
            'h-full flex-1 px-3 sm:px-5 md:px-8 inline-flex items-center justify-center rounded-lg',
            'text-xs sm:text-sm md:text-base font-bold transition-colors',
            tab.id === active
              ? 'bg-brand-50 text-brand-500'
              : 'text-ink-muted hover:text-ink',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
