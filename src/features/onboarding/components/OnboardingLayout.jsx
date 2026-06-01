import { WhatsAppButton } from '@components/ui';
import heroImage from '@assets/images/onboarding/hero.png';
import { ProgressBar } from './ProgressBar';
import { NavigationFooter } from './NavigationFooter';
import { useOnboarding } from '../context/OnboardingContext';

export function OnboardingLayout({ children, canGoNext, onNext }) {
  const { currentStep, isFirstStep, isLastStep, back, advance, finishQuestionnaire, isPersisting } = useOnboarding();

  const handleNext = onNext ?? (isLastStep ? finishQuestionnaire : advance);

  return (
    <div className="min-h-screen w-full bg-brand-500">
      <div className="min-h-screen flex" dir="rtl">
        {/* 60/40 image-to-form split at lg+ per client direction —
            illustration aside takes the visual-left 60% (flex-1 of the
            remaining space), the form takes the visual-right 40%
            (lg:w-2/5). Matches AuthLayout. */}
        <main className="w-full lg:w-2/5 lg:shrink-0 bg-white flex flex-col px-6 sm:px-10 lg:px-12 py-10 lg:py-12 min-h-screen">
          <ProgressBar currentStep={currentStep} />

          <div className="flex flex-col py-10">
            <div className="w-full max-w-[480px] mx-auto animate-fade-in">
              {children}
            </div>
          </div>

          <div className="mt-auto w-full max-w-[480px] mx-auto">
            <NavigationFooter
              onNext={handleNext}
              onBack={back}
              canGoNext={canGoNext}
              canGoBack={!isFirstStep}
              isLastStep={isLastStep}
              isSubmitting={isPersisting}
            />
          </div>
        </main>

        <aside className="hidden lg:flex flex-1 items-center justify-center overflow-hidden bg-brand-500">
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="w-full h-screen object-cover object-left"
          />
        </aside>
      </div>
      <WhatsAppButton />
    </div>
  );
}
