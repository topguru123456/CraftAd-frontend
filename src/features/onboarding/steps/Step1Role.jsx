import { OnboardingLayout } from '../components/OnboardingLayout';
import { RadioCardGroup } from '../components/RadioCardGroup';
import { OtherDetailsInput } from '../components/OtherDetailsInput';
import {
  RoleAgencyIcon,
  RoleCompanyIcon,
  RoleMarketingIcon,
  OtherIcon,
} from '../components/StepIcons';
import { useOnboarding } from '../context/OnboardingContext';
import { isStepComplete } from '../schemas/onboarding.schema';

const ROLE_OPTIONS = [
  { value: 'agency',   label: 'סוכנות שיווק',          icon: RoleAgencyIcon },
  { value: 'business', label: 'בעל עסק/חברה',          icon: RoleCompanyIcon },
  { value: 'team',     label: 'צוות שיווק בארגון',     icon: RoleMarketingIcon },
  { value: 'other',    label: 'אחר',                    icon: OtherIcon },
];

export function Step1Role() {
  const { answers, setAnswer } = useOnboarding();
  const role = answers.role;
  const roleOther = answers.roleOther;

  return (
    <OnboardingLayout canGoNext={isStepComplete(role, roleOther)}>
      <div className="space-y-8" dir="rtl">
        <header className="space-y-3 text-right">
          <p className="text-base text-ink-muted leading-relaxed">
            ברוכים הבאים! נתחיל בשאלון קצר כדי להתאים את CraftAD בשבילך.
          </p>
          <h1 className="text-2xl sm:text-[28px] font-extrabold leading-[1.2] text-ink">
            איך אפשר להגדיר אותך?
          </h1>
        </header>

        <div className="space-y-4">
          <RadioCardGroup
            name="role"
            value={role}
            onChange={(value) => setAnswer('role', value)}
            options={ROLE_OPTIONS}
          />
          {role === 'other' && (
            <OtherDetailsInput
              value={roleOther}
              onChange={(text) => setAnswer('roleOther', text)}
            />
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}
