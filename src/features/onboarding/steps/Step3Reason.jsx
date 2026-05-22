import { OnboardingLayout } from '../components/OnboardingLayout';
import { RadioCardGroup } from '../components/RadioCardGroup';
import { OtherDetailsInput } from '../components/OtherDetailsInput';
import { FootprintsIcon, RocketIcon, SparklesIcon, PuzzleIcon } from '../components/StepIcons';
import { useOnboarding } from '../context/OnboardingContext';
import { isStepComplete } from '../schemas/onboarding.schema';

const REASON_OPTIONS = [
  { value: 'time',        label: 'לחסוך זמן',                  icon: FootprintsIcon },
  { value: 'performance', label: 'לשפר את ביצועי הקמפיינים',   icon: RocketIcon },
  { value: 'quality',     label: 'לשפר את איכות התוצרים',      icon: SparklesIcon },
  { value: 'other',       label: 'אחר',                         icon: PuzzleIcon },
];

export function Step3Reason() {
  const { answers, setAnswer } = useOnboarding();
  const reason = answers.reason;
  const reasonOther = answers.reasonOther;

  return (
    <OnboardingLayout canGoNext={isStepComplete(reason, reasonOther)}>
      <div className="space-y-8" dir="rtl">
        <header className="text-right">
          <h1 className="text-2xl sm:text-[28px] font-extrabold leading-[1.2] text-ink">
            מהי הסיבה שהגעת אלינו?
          </h1>
        </header>

        <div className="space-y-4">
          <RadioCardGroup
            name="reason"
            value={reason}
            onChange={(value) => setAnswer('reason', value)}
            options={REASON_OPTIONS}
          />
          {reason === 'other' && (
            <OtherDetailsInput
              value={reasonOther}
              onChange={(text) => setAnswer('reasonOther', text)}
            />
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}
