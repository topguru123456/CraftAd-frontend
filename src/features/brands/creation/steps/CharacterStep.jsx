import { cn } from '@lib/cn';
import { BrandsHeader } from '../../components/BrandsHeader';
import { useBrandCreation, STEP_IDS } from '../context/BrandCreationContext';
import { WizardStepper } from '../components/WizardStepper';
import { WizardActions } from '../components/WizardActions';
import {
  BRAND_VALUES,
  BRAND_TONES,
  MIN_BRAND_VALUES,
} from '../config/character.config';

/* Step 3 — brand character (values + tone).
 *
 * Two sections, both backed by a frozen taxonomy in character.config.js:
 *   - "ערכי המותג" — multi-select, min 3.
 *   - "טון המותג"   — single-select, exactly 1.
 *
 * Submission persists `values` (string[]) and `tone` (string) onto the
 * brand record — they're the contract for downstream features
 * (creative-score, copy generation) so the ids are stable, not the
 * Hebrew labels.
 *
 * Forward gates on min values + a chosen tone. Once both are satisfied
 * the button calls submit() which fires brandsApi.create and on success
 * BrandsPage's onComplete handler swaps the wizard out for the list —
 * the new brand surfaces immediately because BrandsContext refetches.
 */
export function CharacterStep() {
  const {
    draft,
    updateDraft,
    back,
    submit,
    isSubmitting,
    submitError,
    cancel,
  } = useBrandCreation();

  const selectedValues = draft.values ?? [];
  const selectedTone = draft.tone ?? null;

  const toggleValue = (id) => {
    const next = selectedValues.includes(id)
      ? selectedValues.filter((v) => v !== id)
      : [...selectedValues, id];
    updateDraft({ values: next });
  };

  const setTone = (id) => {
    /* Toggle off if the same tone is re-clicked — keeps the
     * single-select behaviour symmetric with the multi-select section
     * and lets the user clear their pick without a separate control. */
    updateDraft({ tone: selectedTone === id ? null : id });
  };

  const valuesValid = selectedValues.length >= MIN_BRAND_VALUES;
  const toneValid = Boolean(selectedTone);
  const canSubmit = valuesValid && toneValid && !isSubmitting;

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8">
      <BrandsHeader
        title="הקימו מותג חדש"
        subtitle="בחרו אם להקים את המותג אוטומטית באמצעות צירוף קישור לאתר המותג או ידנית בכמה שלבים מהירים"
        onBack={cancel}
      />

      <section className="bg-white border border-line rounded-3xl shadow-soft p-5 sm:p-7 lg:p-8 space-y-6 sm:space-y-8">
        <div className="flex justify-center">
          <WizardStepper currentStepId={STEP_IDS.character} />
        </div>

        <div className="space-y-8">
          <SectionHeader
            title="ערכי המותג"
            hint={`יש לסמן ${MIN_BRAND_VALUES} לפחות`}
            invalid={!valuesValid}
          />
          <CheckboxGrid
            options={BRAND_VALUES}
            selected={selectedValues}
            onToggle={toggleValue}
            mode="multi"
          />

          <SectionHeader
            title="טון המותג"
            hint="יש לסמן אחד"
            invalid={!toneValid}
          />
          <CheckboxGrid
            options={BRAND_TONES}
            selected={selectedTone ? [selectedTone] : []}
            onToggle={setTone}
            mode="single"
          />

          {submitError && (
            <p className="text-sm text-danger text-right">
              {submitError.message ?? 'שמירה נכשלה — נסו שוב'}
            </p>
          )}
        </div>

        <WizardActions
          onBack={back}
          onNext={submit}
          canContinue={canSubmit}
          isSubmitting={isSubmitting}
          nextLabel="סיים"
        />
      </section>
    </div>
  );
}

/* -------------------- internals -------------------- */

function SectionHeader({ title, hint, invalid }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2 text-right">
      <h3 className="text-base sm:text-lg font-bold text-ink">{title}</h3>
      <span
        className={cn(
          'text-xs sm:text-sm',
          invalid ? 'text-danger font-bold' : 'text-ink-muted'
        )}
      >
        ({hint})
      </span>
    </div>
  );
}

function CheckboxGrid({ options, selected, onToggle, mode }) {
  return (
    <ul
      role={mode === 'single' ? 'radiogroup' : 'group'}
      className="flex flex-wrap gap-x-6 gap-y-3"
    >
      {options.map((opt) => (
        <li key={opt.id}>
          <CheckOption
            id={opt.id}
            label={opt.label}
            checked={selected.includes(opt.id)}
            onChange={() => onToggle(opt.id)}
            mode={mode}
          />
        </li>
      ))}
    </ul>
  );
}

function CheckOption({ id, label, checked, onChange, mode }) {
  /* Single-select uses radio semantics (so screen readers announce
   * "1 of N"); multi-select uses checkbox semantics. The visual
   * appearance is identical between the two — design treats them as
   * the same control. */
  const inputType = mode === 'single' ? 'radio' : 'checkbox';

  return (
    <label
      className="inline-flex items-center gap-2 cursor-pointer select-none"
    >
      <input
        type={inputType}
        checked={checked}
        onChange={onChange}
        /* Native input is hidden but reachable for screen readers and
         * keyboard navigation; the styled box renders the visible
         * state. */
        className="sr-only peer"
        aria-labelledby={`opt-${id}-label`}
      />
      <span
        aria-hidden="true"
        className={cn(
          'inline-flex h-[18px] w-[18px] items-center justify-center shrink-0',
          'rounded-[4px] border transition-colors',
          checked
            ? 'bg-brand-500 border-brand-500'
            : 'bg-white border-line peer-hover:border-brand-300',
          /* Focus ring on the box when the hidden input is focused. */
          'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300 peer-focus-visible:ring-offset-1'
        )}
      >
        {checked && <CheckGlyph className="h-3 w-3 text-white" />}
      </span>
      <span
        id={`opt-${id}-label`}
        className={cn(
          'text-sm sm:text-[15px]',
          checked ? 'text-ink font-bold' : 'text-ink'
        )}
      >
        {label}
      </span>
    </label>
  );
}

function CheckGlyph({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5L10 17.5L19 7.5" />
    </svg>
  );
}
