import { OnboardingLayout } from '../components/OnboardingLayout';
import { RadioCardGroup } from '../components/RadioCardGroup';
import { OtherDetailsInput } from '../components/OtherDetailsInput';
import { LeafIcon, EcommerceIcon, CloudIcon, PuzzleIcon } from '../components/StepIcons';
import { useOnboarding } from '../context/OnboardingContext';
import { isStepComplete } from '../schemas/onboarding.schema';

const ACTIVITY_OPTIONS = [
  { value: 'services',  label: 'שירותים',           icon: LeafIcon },
  { value: 'ecommerce', label: 'איקומרס',           icon: EcommerceIcon },
  { value: 'saas',      label: 'מוצר דיגיטלי/SaaS', icon: CloudIcon },
  { value: 'other',     label: 'אחר',                icon: PuzzleIcon },
];

export function Step2Activity() {
  const { answers, setAnswer } = useOnboarding();
  const activityType = answers.activityType;
  const activityTypeOther = answers.activityTypeOther;

  return (
    <OnboardingLayout canGoNext={isStepComplete(activityType, activityTypeOther)}>
      <div className="space-y-8" dir="rtl">
        <header className="text-right">
          <h1 className="text-2xl sm:text-[28px] font-extrabold leading-[1.2] text-ink">
            מהו סוג הפעילות המרכזי?
          </h1>
        </header>

        <div className="space-y-4">
          <RadioCardGroup
            name="activityType"
            value={activityType}
            onChange={(value) => setAnswer('activityType', value)}
            options={ACTIVITY_OPTIONS}
          />
          {activityType === 'other' && (
            <OtherDetailsInput
              value={activityTypeOther}
              onChange={(text) => setAnswer('activityTypeOther', text)}
            />
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}
