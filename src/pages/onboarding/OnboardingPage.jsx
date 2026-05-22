import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  OnboardingProvider,
  useOnboarding,
  Step1Role,
  Step2Activity,
  Step3Reason,
  Step4TeamSize,
  Step5Source,
} from '@features/onboarding';
import { ROUTES } from '@config/routes';

const STEP_REGISTRY = {
  1: Step1Role,
  2: Step2Activity,
  3: Step3Reason,
  4: Step4TeamSize,
  5: Step5Source,
};

function OnboardingFlow() {
  const { currentStep } = useOnboarding();
  const StepComponent = STEP_REGISTRY[currentStep] ?? Step1Role;
  return <StepComponent />;
}

export default function OnboardingPage() {
  const { user, ready } = useAuth();

  if (!ready) return null;
  if (user?.user_metadata?.onboarding?.completed) {
    return <Navigate to={ROUTES.app.dashboard} replace />;
  }

  return (
    <OnboardingProvider>
      <OnboardingFlow />
    </OnboardingProvider>
  );
}
