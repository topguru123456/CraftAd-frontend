import {
  OfferFeaturesForm,
  ProjectWizardHeader,
  ProjectWizardShell,
} from '@features/projects/flows/shared';
import {
  STEP_IDS,
  WIZARD_STEPS,
  useCopywriting,
} from '../context/CopywritingContext';

/* Step 2 (visible stepper) — מאפייני ההצעה for the copywriting-ads flow.
 *
 * Same field set as campaign-creative's OfferFeaturesStep, served from
 * the shared `OfferFeaturesForm` so the two flows can't drift. Two
 * intentional deltas for the copywriting variant:
 *   • briefLabel reads "תיאור חופשי..." instead of "בריף קמפיין..." —
 *     the wizard is producing copy, not campaign creatives.
 *   • Landing-page URL is hidden — copywriting output doesn't take a
 *     landing-page input, and the underlying draft has no
 *     `landingPageUrl` field. */
export function OfferStep() {
  const { draft, updateDraft, next, back, cancel } = useCopywriting();

  const canContinue =
    Boolean(draft.saleType) &&
    Boolean(draft.audienceType) &&
    Boolean(draft.itemName?.trim()) &&
    (draft.offerToneIds?.length ?? 0) > 0 &&
    Boolean(draft.brief?.trim());

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <ProjectWizardHeader
        title="מאפייני ההצעה"
        subtitle="ספרו לנו על המוצר או השירות — המידע הזה מזין את הטקסט שה-AI יכתוב."
        onBack={cancel}
      />

      <ProjectWizardShell
        steps={WIZARD_STEPS}
        currentStepId={STEP_IDS.offer}
        onBack={back}
        onNext={next}
        canContinue={canContinue}
      >
        <OfferFeaturesForm
          draft={draft}
          updateDraft={updateDraft}
          briefLabel="תיאור חופשי של המוצר/שירות"
          showLandingPageUrl={false}
        />
      </ProjectWizardShell>
    </div>
  );
}
