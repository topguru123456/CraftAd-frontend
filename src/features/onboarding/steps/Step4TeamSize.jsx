import { OnboardingLayout } from '../components/OnboardingLayout';
import { RadioCardGroup } from '../components/RadioCardGroup';
import {
  SinglePersonIcon,
  SmallTeamIcon,
  MediumTeamIcon,
  TeamGridIcon,
} from '../components/StepIcons';
import { useOnboarding } from '../context/OnboardingContext';

const TEAM_SIZE_OPTIONS = [
  { value: 'solo',   label: 'זה רק אני',     icon: SinglePersonIcon },
  { value: 'small',  label: '2-5 עובדים',    icon: SmallTeamIcon },
  { value: 'medium', label: '6-15 עובדים',   icon: MediumTeamIcon },
  { value: 'large',  label: 'מעל 15 עובדים', icon: TeamGridIcon },
];

export function Step4TeamSize() {
  const { answers, setAnswer } = useOnboarding();
  const teamSize = answers.teamSize;

  return (
    <OnboardingLayout canGoNext={Boolean(teamSize)}>
      <div className="space-y-8" dir="rtl">
        <header className="text-right">
          <h1 className="text-2xl sm:text-[28px] font-extrabold leading-[1.2] text-ink">
            מהו גודל הצוות שלכם?
          </h1>
        </header>

        <RadioCardGroup
          name="teamSize"
          value={teamSize}
          onChange={(value) => setAnswer('teamSize', value)}
          options={TEAM_SIZE_OPTIONS}
        />
      </div>
    </OnboardingLayout>
  );
}
