import {
  STEP_IDS,
  WIZARD_STEPS,
  useAdvertisingPackage,
} from '../context/AdvertisingPackageContext';
import {
  ProjectSettingsForm,
  ProjectWizardHeader,
  ProjectWizardShell,
} from '@features/projects/flows/shared';
import { PROJECT_NAME_MAX } from '@features/projects/config/project-fields.config';

/* Step 1 (visible stepper) — הגדרת קמפיין.
 *
 * Identical intake to campaign-creative / copywriting-ads: project
 * name + 4 dropdowns (goal / nature / conversion location /
 * audience). Renders ProjectSettingsForm verbatim — that shared
 * component owns the field grid, the dropdown configs, and the
 * mobile/desktop layout. Anything visual on this step changes there,
 * not here.
 *
 * Preceded by ContentSizeStep (platform + ratio), which is outside
 * the numbered stepper because those choices are locked before the
 * form begins. */
export function CampaignSettingsStep() {
  const { draft, updateDraft, next, back, cancel } = useAdvertisingPackage();

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
