import { WizardStepper as BaseWizardStepper } from '@components/ui';
import { WIZARD_STEPS } from '../context/BrandCreationContext';

export function WizardStepper({ currentStepId }) {
  return (
    <BaseWizardStepper
      steps={WIZARD_STEPS}
      currentStepId={currentStepId}
      ariaLabel="שלבי הקמת המותג"
    />
  );
}
