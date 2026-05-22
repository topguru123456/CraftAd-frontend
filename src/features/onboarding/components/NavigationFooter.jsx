import { Button } from '@components/ui';

export function NavigationFooter({
  onNext,
  onBack,
  canGoNext,
  canGoBack,
  isLastStep,
  isSubmitting,
}) {
  return (
    <div className="flex justify-between gap-3 pt-6" dir="rtl">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={!canGoBack || isSubmitting}
        className="flex-1"
      >
        חזור
      </Button>
      <Button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        loading={isSubmitting}
        className="flex-1"
      >
        {isLastStep ? 'סיים' : 'הבא'}
      </Button>
      
    </div>
  );
}
