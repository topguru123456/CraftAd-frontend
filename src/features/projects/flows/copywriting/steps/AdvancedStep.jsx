import { useActiveBrand } from '@/contexts/BrandsContext';
import {
  ProjectWizardHeader,
  ProjectWizardShell,
  WizardTextInput,
} from '@features/projects/flows/shared';
import {
  STEP_IDS,
  WIZARD_STEPS,
  useCopywriting,
} from '../context/CopywritingContext';

/* Step 4 (visible stepper, terminal) — מתקדם.
 *
 * Three single-line marketing-copy primitives the LLM anchors on:
 *   • הבטחה שיווקית — the bottom-line benefit (40 chars)
 *   • הצעה שיווקית — why now / what makes it urgent (40 chars)
 *   • הנעה לפעולה  — the CTA verb (25 chars)
 *
 * All three are required — the wizard's value evaporates if the LLM
 * is asked to invent a promise/offer/CTA without input. Continue is
 * the wizard's submit terminator: it calls `submit({ brandId })`,
 * which (today) returns a stubbed "not yet wired" error pending
 * backend integration. The error surfaces inline. */
const PROMISE_MAX = 40;
const OFFER_MAX   = 40;
const CTA_MAX     = 25;

export function AdvancedStep() {
  const { draft, updateDraft, back, cancel, submit, isSubmitting, submitError } =
    useCopywriting();
  const { activeBrand } = useActiveBrand();

  const canContinue =
    Boolean(draft.marketingPromise?.trim()) &&
    Boolean(draft.marketingOffer?.trim()) &&
    Boolean(draft.callToAction?.trim());

  const handleSubmit = () => {
    submit({ brandId: activeBrand?.id });
  };

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <ProjectWizardHeader
        title="פרטי הפרויקט"
        subtitle="תמיד תוכלו לשנות את שם הפרויקט לאחר מכן. כתובת האתר תעזור לנו להתאים את התוכן עבור המותג שלכם."
        onBack={cancel}
      />

      <ProjectWizardShell
        steps={WIZARD_STEPS}
        currentStepId={STEP_IDS.advanced}
        onBack={back}
        onNext={handleSubmit}
        canContinue={canContinue}
        isSubmitting={isSubmitting}
      >
        <div className="space-y-6">
          <Field label="ההבטחה השיווקית">
            <WizardTextInput
              value={draft.marketingPromise}
              onChange={(val) => updateDraft({ marketingPromise: val })}
              maxLength={PROMISE_MAX}
              placeholder="מה יוצא ללקוח מזה שורה תחתונה? בתועלות."
              ariaLabel="ההבטחה השיווקית"
            />
          </Field>

          <Field label="ההצעה השיווקית">
            <WizardTextInput
              value={draft.marketingOffer}
              onChange={(val) => updateDraft({ marketingOffer: val })}
              maxLength={OFFER_MAX}
              placeholder="למה דווקא עכשיו?"
              ariaLabel="ההצעה השיווקית"
            />
          </Field>

          <Field label="ההנעה לפעולה">
            <WizardTextInput
              value={draft.callToAction}
              onChange={(val) => updateDraft({ callToAction: val })}
              maxLength={CTA_MAX}
              placeholder="לדוגמא: שיחת ייעוץ/ הזמנה באתר/ שלח הודעה..."
              ariaLabel="ההנעה לפעולה"
            />
          </Field>

          {submitError && (
            <p role="alert" className="text-sm text-danger text-right">
              {submitError.message}
            </p>
          )}
        </div>
      </ProjectWizardShell>
    </div>
  );
}

/* Label + control wrapper local to this step — labels here are bare
 * strings (no counter; the WizardTextInput renders its own char-cap
 * hint inside the input), so the shared ProjectWizardField's counter
 * machinery would just sit unused. */
function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-[16px] font-bold text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
