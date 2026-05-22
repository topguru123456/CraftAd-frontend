import {
  ProjectWizardField,
  ProjectWizardHeader,
  ProjectWizardShell,
  WizardTextInput,
} from '@features/projects/flows/shared';
import { PROJECT_NAME_MAX } from '@features/projects/config/project-fields.config';
import { BRIEF_MAX } from '@features/projects/config/offer-fields.config';
import { cn } from '@lib/cn';
import {
  STEP_IDS,
  WIZARD_STEPS,
  useVideoCreative,
} from '../context/VideoCreativeContext';

/* Step 1 (visible stepper) — מידע על הפרויקט for the video-creative flow.
 *
 * Two single-column fields:
 *   • שם הפרויקט        — project name, max 25 (WizardTextInput chrome:
 *                          pencil at start, max overlay at end)
 *   • תיאור הפרויקט      — long-form description, max 5000 (textarea
 *                          with counter underneath, same pattern as
 *                          product-images and the offer-features brief)
 *
 * Single column instead of the product-images 2-col grid because the
 * spec mock shows the name field full-width — no product-name pair to
 * balance against here.
 *
 * Validation: both required. Continue → step 2 (options, TBD).
 *
 * Constants imported from the shared field-config files rather than
 * declared locally — PROJECT_NAME_MAX and BRIEF_MAX are the same caps
 * used by every other flow, so a future "loosen the cap" decision
 * ripples through one place. */
const DESCRIPTION_PLACEHOLDER =
  'הקרם מוצג עם תאורה חמה, על שיש במקלחת...';

export function ProjectInfoStep() {
  const { draft, updateDraft, next, back, cancel } = useVideoCreative();

  const canContinue =
    Boolean(draft.name?.trim()) &&
    Boolean(draft.description?.trim());

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <ProjectWizardHeader
        title="בחרו איזה תוכן ונכסים דיגיטליים תרצו לייצר באמצעות AI"
        subtitle="זה השלב הראשון בדרך ליצירת התכנים עבור המותג שלכם. זה רק כמה צעדים פשוטים, לא יותר מ-3 דקות!"
        onBack={back}
      />

      <ProjectWizardShell
        steps={WIZARD_STEPS}
        currentStepId={STEP_IDS.projectInfo}
        onBack={cancel}
        onNext={next}
        canContinue={canContinue}
      >
        <div dir="rtl" className="space-y-5">
          <NameField label="איך נקרא לפרויקט שלך?">
            <WizardTextInput
              value={draft.name}
              onChange={(val) => updateDraft({ name: val })}
              maxLength={PROJECT_NAME_MAX}
              placeholder="שם הפרויקט"
              ariaLabel="שם הפרויקט"
            />
          </NameField>

          <ProjectWizardField label="תיאור הפרויקט">
            <DescriptionTextarea
              value={draft.description}
              onChange={(val) => updateDraft({ description: val })}
            />
          </ProjectWizardField>
        </div>
      </ProjectWizardShell>
    </div>
  );
}

/* Local label wrapper for the name field. We bypass ProjectWizardField
 * here because its max-overlay machinery is already baked into
 * WizardTextInput — using both would double-render the max badge.
 * (Same local pattern as product-images CustomizationStep.) */
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
 * brief and product-images CustomizationStep description fields so
 * every "long description" surface in the app feels the same. Counter
 * goes red at the cap to match the per-input convention. */
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
