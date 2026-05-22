import {
  OfferFeaturesForm,
  ProjectWizardHeader,
  ProjectWizardShell,
} from '@features/projects/flows/shared';
import {
  STEP_IDS,
  WIZARD_STEPS,
  useCampaignCreative,
} from '../context/CampaignCreativeContext';

/* Step 2 (visible stepper) — מאפייני ההצעה for the campaign-creative
 * flow.
 *
 * Composes shared `OfferFeaturesForm` (the field grid + brief + URL)
 * inside the shared `ProjectWizardShell` so every wizard's offer-style
 * step has the same chrome. The validation rule lives here — campaign-
 * creative requires every field except `landingPageUrl`, which stays
 * optional even though the form renders it. */
export function OfferFeaturesStep() {
  const { draft, updateDraft, next, back, cancel } = useCampaignCreative();

  const canContinue =
    Boolean(draft.saleType) &&
    Boolean(draft.audienceType) &&
    Boolean(draft.itemName?.trim()) &&
    Boolean(draft.offerToneId) &&
    Boolean(draft.brief?.trim());

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <ProjectWizardHeader
        title="מאפייני ההצעה"
        subtitle="ספרו לנו על המוצר או השירות שאתם מקדמים — המידע הזה מזין את הקריאייטיב שה-AI ייצר."
        onBack={cancel}
      />

      <ProjectWizardShell
        steps={WIZARD_STEPS}
        currentStepId={STEP_IDS.offer}
        onBack={back}
        onNext={next}
        canContinue={canContinue}
      >
        <OfferFeaturesForm draft={draft} updateDraft={updateDraft} />
      </ProjectWizardShell>
    </div>
  );
}
