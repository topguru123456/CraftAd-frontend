import {
  ProjectSettingsForm,
  ProjectWizardHeader,
  ProjectWizardShell,
} from '@features/projects/flows/shared';
import { PROJECT_NAME_MAX } from '@features/projects/config/project-fields.config';
import {
  STEP_IDS,
  WIZARD_STEPS,
  useCopywriting,
} from '../context/CopywritingContext';

/* Step 1 (visible stepper) — הגדרת קמפיין for the copywriting-ads flow.
 *
 * Same intake form as campaign-creative's CampaignSettingsStep — both
 * flows need the same project metadata (name, goal, nature, conversion
 * location, target audience) before the type-specific steps diverge.
 * The form itself lives in shared/ProjectSettingsForm so a third flow
 * with the same first-step shape costs nothing.
 *
 * Preceded by PlatformStep, which sits outside the numbered stepper
 * because the platform choice is locked before the form begins. */
export function SettingsStep() {
  const { draft, updateDraft, next, back, cancel } = useCopywriting();

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
