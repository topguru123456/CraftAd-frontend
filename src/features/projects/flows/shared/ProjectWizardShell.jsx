import { WizardStepper, WizardActions } from '@components/ui';

/* White card shell shared by every project-creation wizard step.
 *
 * Owns the pill stepper + optional footer actions so individual steps
 * only declare their form body. Width comes from PageContainer — no
 * extra max-w here (same rule as brand-creation steps). */
export function ProjectWizardShell({
  steps,
  currentStepId,
  stepperAriaLabel = 'שלבי יצירת הפרויקט',
  onBack,
  onNext,
  canContinue,
  isSubmitting,
  nextLabel,
  backLabel,
  showActions = true,
  children,
}) {
  return (
    <section className="bg-white border border-line rounded-3xl shadow-soft p-5 sm:p-7 lg:p-8 space-y-6 sm:space-y-8">
      {steps?.length > 0 && (
        <div className="flex justify-center">
          <WizardStepper
            steps={steps}
            currentStepId={currentStepId}
            ariaLabel={stepperAriaLabel}
          />
        </div>
      )}

      {children}

      {showActions && (
        <WizardActions
          onBack={onBack}
          onNext={onNext}
          canContinue={canContinue}
          isSubmitting={isSubmitting}
          nextLabel={nextLabel}
          backLabel={backLabel}
        />
      )}
    </section>
  );
}
