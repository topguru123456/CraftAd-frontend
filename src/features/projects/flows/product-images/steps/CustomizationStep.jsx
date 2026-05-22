import {
  ProjectWizardField,
  ProjectWizardHeader,
  ProjectWizardShell,
  WizardTextInput,
} from '@features/projects/flows/shared';
import { PROJECT_NAME_MAX } from '@features/projects/config/project-fields.config';
import {
  BRIEF_MAX,
  ITEM_NAME_MAX,
} from '@features/projects/config/offer-fields.config';
import { cn } from '@lib/cn';
import {
  STEP_IDS,
  WIZARD_STEPS,
  useProductImages,
} from '../context/ProductImagesContext';

/* Step 1 (visible stepper) — התאמה אישית for the product-images flow.
 *
 * Three inputs grouped into two visual rows:
 *   Row 1 (2-col grid in RTL → DOM[0] on the right, DOM[1] on the left):
 *     מהו המוצר שלך?       (right) — product name, max 80
 *     איך נקרא לפרויקט שלך? (left)  — project name, max 25
 *   Row 2 (full width):
 *     תאר את התמונה הרצויה — image description textarea, max 5000
 *
 * The product/project name pair reuses WizardTextInput for the
 * pencil-leading + max-overlay chrome that the rest of the wizard
 * uses; the description uses a local Field wrapper so the char
 * counter renders UNDERNEATH (matches the OfferFeaturesForm pattern
 * for its long-form brief).
 *
 * Validation: all three required. Continue → step 2 (upload, TBD). */
const DESCRIPTION_PLACEHOLDER =
  'הקרם מוצג עם תאורה חמה, על שיש במקלחת...';

export function CustomizationStep() {
  const { draft, updateDraft, next, back, cancel } = useProductImages();

  const canContinue =
    Boolean(draft.name?.trim()) &&
    Boolean(draft.productName?.trim()) &&
    Boolean(draft.imageDescription?.trim());

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <ProjectWizardHeader
        title="בחרו איזה תוכן ונכסים דיגיטליים תרצו לייצר באמצעות AI"
        subtitle="זה השלב הראשון בדרך ליצירת התכנים עבור המותג שלכם. זה רק כמה צעדים פשוטים, לא יותר מ-3 דקות!"
        onBack={back}
      />

      <ProjectWizardShell
        steps={WIZARD_STEPS}
        currentStepId={STEP_IDS.customization}
        onBack={cancel}
        onNext={next}
        canContinue={canContinue}
      >
        <div dir="rtl" className="space-y-5">
          {/* 2-column grid for the name pair. DOM order = reading
              order in RTL: product question on the right (DOM[0]),
              project question on the left (DOM[1]). */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
            <NameField label="מהו המוצר שלך?">
              <WizardTextInput
                value={draft.productName}
                onChange={(val) => updateDraft({ productName: val })}
                maxLength={ITEM_NAME_MAX}
                placeholder="שם המוצר"
                ariaLabel="שם המוצר"
              />
            </NameField>

            <NameField label="איך נקרא לפרויקט שלך?">
              <WizardTextInput
                value={draft.name}
                onChange={(val) => updateDraft({ name: val })}
                maxLength={PROJECT_NAME_MAX}
                placeholder="שם הפרויקט"
                ariaLabel="שם הפרויקט"
              />
            </NameField>
          </div>

          <ProjectWizardField label="תאר את התמונה הרצויה">
            <DescriptionTextarea
              value={draft.imageDescription}
              onChange={(val) => updateDraft({ imageDescription: val })}
            />
          </ProjectWizardField>
        </div>
      </ProjectWizardShell>
    </div>
  );
}

/* Local label wrapper for the name fields. We bypass ProjectWizardField
 * here because its max-overlay machinery is already baked into
 * WizardTextInput — using both would double-render the max badge. */
function NameField({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-[16px] font-bold text-ink-muted text-right">
        {label}
      </label>
      {children}
    </div>
  );
}

/* Textarea with an underneath counter, mirroring the offer-features
 * brief field so the two "long description" surfaces feel the same.
 * Counter goes red at the cap to match the per-input convention. */
function DescriptionTextarea({ value, onChange }) {
  const length = value?.length ?? 0;
  const atLimit = length >= BRIEF_MAX;
  return (
    <div className="relative">
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        maxLength={BRIEF_MAX}
        placeholder={DESCRIPTION_PLACEHOLDER}
        dir="rtl"
        rows={6}
        className={cn(
          'w-full rounded-xl border border-line bg-white',
          'px-4 py-3 text-md text-ink placeholder:text-ink-soft text-right',
          'focus:border-brand-300 focus:outline-none focus:shadow-focus',
          'resize-y min-h-[160px]'
        )}
      />
      <span
        dir="ltr"
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute bottom-3 left-3',
          'text-sm tabular-nums',
          atLimit ? 'text-danger font-bold' : 'text-ink-soft'
        )}
      >
        {BRIEF_MAX}
      </span>
    </div>
  );
}
