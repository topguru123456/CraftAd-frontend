import {
  STEP_IDS,
  WIZARD_STEPS,
  useCampaignCreative,
} from '../context/CampaignCreativeContext';
import {
  ProjectSettingsForm,
  ProjectWizardHeader,
  ProjectWizardShell,
} from '@features/projects/flows/shared';
import { PROJECT_NAME_MAX } from '@features/projects/config/project-fields.config';

export function CampaignSettingsStep() {
  const { draft, updateDraft, next, back, cancel } = useCampaignCreative();

  const trimmedName = draft.name?.trim() ?? '';
  const canContinue =
    trimmedName.length > 0 &&
    trimmedName.length <= PROJECT_NAME_MAX &&
    Boolean(draft.goalId) &&
    Boolean(draft.natureId) &&
    Boolean(draft.conversionLocationId) &&
    Boolean(draft.audienceId);

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <ProjectWizardHeader
        title="פרטי הפרויקט"
        subtitle="תמיד תוכלו לשנות את שם הפרויקט לאחר מכן. כתובת האתר תעזור לנו להתאים את התוכן עבור המותג שלכם."
        onBack={cancel}
      />

      <ProjectWizardShell
        steps={WIZARD_STEPS}
        currentStepId={STEP_IDS.settings}
        onBack={back}
        onNext={next}
        canContinue={canContinue}
      >
        <ProjectSettingsForm draft={draft} updateDraft={updateDraft} />
      </ProjectWizardShell>
    </div>
  );
}
