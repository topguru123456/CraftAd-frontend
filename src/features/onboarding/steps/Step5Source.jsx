import { OnboardingLayout } from '../components/OnboardingLayout';
import { RadioCardGroup } from '../components/RadioCardGroup';
import { OtherDetailsInput } from '../components/OtherDetailsInput';
import {
  MessageIcon,
  FacebookIcon,
  GoogleIcon,
  PlayBoxIcon,
  PuzzleIcon,
} from '../components/StepIcons';
import { useOnboarding } from '../context/OnboardingContext';
import { isStepComplete } from '../schemas/onboarding.schema';

const SOURCE_OPTIONS = [
  { value: 'friend',  label: 'המלצה מחבר/ה',   icon: MessageIcon },
  { value: 'ad',      label: 'מודעה ממומנת',   icon: FacebookIcon },
  { value: 'google',  label: 'חיפשתי בגוגל',    icon: GoogleIcon },
  { value: 'fbGroup', label: 'קבוצת פייסבוק',  icon: PlayBoxIcon },
  { value: 'other',   label: 'אחר',             icon: PuzzleIcon },
];

export function Step5Source() {
  const { answers, setAnswer } = useOnboarding();
  const source = answers.source;
  const sourceOther = answers.sourceOther;

  return (
    <OnboardingLayout canGoNext={isStepComplete(source, sourceOther)}>
      <div className="space-y-8" dir="rtl">
        <header className="text-right">
          <h1 className="text-2xl sm:text-[28px] font-extrabold leading-[1.2] text-ink">
            איך הגעת אלינו?
          </h1>
        </header>

        <div className="space-y-4">
          <RadioCardGroup
            name="source"
            value={source}
            onChange={(value) => setAnswer('source', value)}
            options={SOURCE_OPTIONS}
          />
          {source === 'other' && (
            <OtherDetailsInput
              value={sourceOther}
              onChange={(text) => setAnswer('sourceOther', text)}
            />
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}
