import { ArrowRight } from 'iconsax-react';
import { cn } from '@lib/cn';

/* Footer action row used by every wizard step.
 *
 * Layout (RTL):
 *   - DOM[0] back-arrow icon button → visual right (RTL start)
 *   - DOM[1] primary forward button (gradient pink) → visual left (RTL end)
 *
 * Forward gates on `canContinue` and shows a spinner when
 * `isSubmitting`. Back is the small outlined arrow. Reuse this for
 * any new wizard step rather than re-rolling the layout.
 */
export function WizardActions({
  onBack,
  onNext,
  canContinue = true,
  isSubmitting = false,
  nextLabel = 'המשך',
  backLabel = 'חזרה',
}) {
  return (
    <div dir="rtl" className="flex items-center justify-center gap-3 pt-2">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className={cn(
          'inline-flex h-12 w-12 items-center justify-center shrink-0',
          'rounded-xl border border-brand-200 bg-white text-brand-500',
          'hover:bg-brand-50 transition-colors'
        )}
      >
        <ArrowRight size="20" variant="Linear" color="currentColor" />
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canContinue || isSubmitting}
        className={cn(
          'inline-flex h-12 min-w-[180px] sm:min-w-[260px] items-center justify-center',
          'rounded-xl px-6 text-base font-bold transition-opacity',
          canContinue && !isSubmitting
            ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
            : 'bg-brand-100 text-brand-300 cursor-not-allowed'
        )}
      >
        {isSubmitting ? (
          <span
            aria-hidden="true"
            className="h-5 w-5 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
          />
        ) : (
          nextLabel
        )}
      </button>
    </div>
  );
}
