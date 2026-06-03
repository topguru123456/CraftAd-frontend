import {
  STEP_IDS,
  WIZARD_STEPS,
  useAdvertisingPackage,
} from '../context/AdvertisingPackageContext';
import {
  OfferFeaturesForm,
  ProjectWizardHeader,
  ProjectWizardShell,
  TopicsField,
} from '@features/projects/flows/shared';

/* Step 2 (visible stepper) — מאפייני ההצעה.
 *
 * Composes two existing shared blocks rather than introducing new
 * field components: OfferFeaturesForm (the row of 4 fields + brief
 * textarea) on top, TopicsField (chip-list editor) below. Same
 * intake shape as campaign-creative's step 2, with two
 * advertising-package-specific deltas baked in via existing knobs:
 *
 *   • briefLabel: "תיאור חופשי של המוצר/שירות"
 *       The shared form's default is "בריף קמפיין והסבר על המוצר/שירות"
 *       (campaign-creative tone). The advertising-package spec phrases
 *       it as a generic product description, so we override at the
 *       caller — no shared-component change needed.
 *
 *   • showLandingPageUrl: false
 *       The spec mock has no landing-page URL row. Copywriting-ads
 *       already uses this same knob for the same reason.
 *
 * Continue gate: the offer-form fields are all required (sale type,
 * audience temp, item name, brand tone, brief — same set as
 * campaign-creative). Topics are intentionally NOT gated — current
 * spec keeps them optional; zero chips is a valid advance state. If
 * that flips, add `draft.topics.length > 0` to canContinue and the
 * EMPTY_DRAFT comment in the context already calls out this contract. */
export function OfferFeaturesStep() {
  const { draft, updateDraft, next, back, cancel } = useAdvertisingPackage();

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
        subtitle="ספרו לנו על המוצר או השירות — המידע הזה מזין הן את הקריאייטיב והן את הקופי שה-AI ייצר."
        onBack={cancel}
      />

      <ProjectWizardShell
        steps={WIZARD_STEPS}
        currentStepId={STEP_IDS.offer}
        onBack={back}
        onNext={next}
        canContinue={canContinue}
      >
        <div className="space-y-8">
          <OfferFeaturesForm
            draft={draft}
            updateDraft={updateDraft}
            briefLabel="תיאור חופשי של המוצר/שירות"
            showLandingPageUrl={false}
          />

          <TopicsField
            topics={draft.topics ?? []}
            onChange={(next) => updateDraft({ topics: next })}
          />
        </div>
      </ProjectWizardShell>
    </div>
  );
}
