import {
  ProjectWizardHeader,
  ProjectWizardShell,
  TopicsField,
} from '@features/projects/flows/shared';
import {
  STEP_IDS,
  WIZARD_STEPS,
  useCopywriting,
} from '../context/CopywritingContext';

/* Step 3 (visible stepper) — נושאים מרכזיים for the copywriting-ads flow.
 *
 * Lets the user list keywords/themes the AI should anchor on when
 * writing the copy. The field is optional — an empty list is a valid
 * state — so Continue is never gated by topics count. The wizard
 * advances based on `next()`; if step 4 needs every prior input it
 * gates there, not here. */
export function TopicsStep() {
  const { draft, updateDraft, next, back, cancel } = useCopywriting();

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <ProjectWizardHeader
        title="פרטי הפרויקט"
        subtitle="תמיד תוכלו לשנות את שם הפרויקט לאחר מכן. כתובת האתר תעזור לנו להתאים את התוכן עבור המותג שלכם."
        onBack={cancel}
      />

      <ProjectWizardShell
        steps={WIZARD_STEPS}
        currentStepId={STEP_IDS.topics}
        onBack={back}
        onNext={next}
        canContinue
      >
        <TopicsField
          topics={draft.topics}
          onChange={(topics) => updateDraft({ topics })}
        />
      </ProjectWizardShell>
    </div>
  );
}
