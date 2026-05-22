import { TOTAL_STEPS } from '../api/onboarding.api';

export function ProgressBar({ currentStep, total = TOTAL_STEPS }) {
  return (
    <div
      className="flex gap-2 w-full max-w-[clamp(320px,28vw,440px)] mx-auto"
      dir="rtl"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={currentStep}
      aria-label={`שלב ${currentStep} מתוך ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const stepNumber = i + 1;
        const filled = stepNumber <= currentStep;
        return (
          <span
            key={stepNumber}
            className={[
              'h-3 flex-1 rounded-full transition-colors duration-300',
              filled ? 'bg-brand-gradient' : 'bg-brand-50',
            ].join(' ')}
          />
        );
      })}
    </div>
  );
}
