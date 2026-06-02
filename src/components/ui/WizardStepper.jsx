import { cn } from '@lib/cn';

/**
 * Multi-step wizard progress.
 *
 * - Mobile: numbered dots (1–n) with horizontal connectors.
 * - sm+: pill labels ("1. הגדרת קמפיין", …).
 *
 * RTL: first step in the array sits on the right.
 */
export function WizardStepper({ steps, currentStepId, ariaLabel = 'שלבי תהליך' }) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <nav aria-label={ariaLabel} dir="rtl" className="w-full">
      <ol className="flex sm:hidden items-center justify-center w-full max-w-xs mx-auto">
        {steps.map((step, idx) => {
          const isActive = step.id === currentStepId;
          const isLast = idx === steps.length - 1;

          return (
            <li
              key={step.id}
              className={cn('flex items-center', !isLast && 'flex-1')}
            >
              <StepDot
                number={idx + 1}
                label={step.label}
                isActive={isActive}
              />
              {!isLast && <StepConnector />}
            </li>
          );
        })}
      </ol>

      <ul className="hidden sm:flex w-full items-center gap-1 rounded-full bg-slate-100 p-1">
        {steps.map((step, idx) => {
          const isActive = step.id === currentStepId;
          return (
            <li key={step.id} className="flex-1">
              <span
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex w-full items-center justify-center whitespace-nowrap',
                  'px-5 py-0.5 rounded-full text-base font-bold transition-colors',
                  'text-red-800',
                  isActive ? 'shadow-sm bg-white' : 'text-gray-300',
                )}
              >
                {idx + 1}. {step.label}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Screen-reader context on mobile (labels are not shown visually). */}
      <p className="sr-only">
        שלב {currentIndex + 1} מתוך {steps.length}:{' '}
        {steps[currentIndex]?.label ?? ''}
      </p>
    </nav>
  );
}

function StepDot({ number, label, isActive }) {
  return (
    <span
      aria-current={isActive ? 'step' : undefined}
      aria-label={`${number}. ${label}`}
      className={cn(
        'h-8 w-8 shrink-0 rounded-full inline-flex items-center justify-center',
        'text-sm font-bold transition-colors',
        isActive
          ? 'bg-brand-500 text-white shadow-sm'
          : 'bg-white text-ink-muted border border-brand-200',
      )}
    >
      {number}
    </span>
  );
}

function StepConnector() {
  return (
    <span
      aria-hidden="true"
      className="flex-1 h-px min-w-3 mx-1 bg-brand-200"
    />
  );
}
