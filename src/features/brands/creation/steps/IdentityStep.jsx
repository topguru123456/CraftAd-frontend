import { Trash } from 'iconsax-react';
import { cn } from '@lib/cn';
import { BrandsHeader } from '../../components/BrandsHeader';
import { useBrandCreation, STEP_IDS } from '../context/BrandCreationContext';
import { WizardStepper } from '../components/WizardStepper';
import { WizardActions } from '../components/WizardActions';

/* Step 1 — brand identity (name + description).
 *
 * Shared by both the auto and manual paths. On the auto path, the draft
 * arrives pre-filled by the URL fetch; on manual, the fields start empty.
 *
 * Constraints (per spec):
 *   - name:        max 40 chars
 *   - description: max 5000 chars
 *
 * `<input maxLength>` enforces hard caps at the DOM level so a paste
 * exceeding the budget is silently truncated. Counters next to each
 * field surface usage. Forward is gated on a non-empty trimmed name.
 */
const NAME_MAX = 40;
const DESCRIPTION_MAX = 5000;

export function IdentityStep() {
  const { draft, updateDraft, next, cancel } = useBrandCreation();

  const name = draft.name ?? '';
  const description = draft.description ?? '';
  const canContinue = name.trim().length > 0;

  const handleClearDescription = () => updateDraft({ description: '' });

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8">
      <BrandsHeader
        title="הקימו מותג חדש"
        subtitle="בחרו אם להקים את המותג אוטומטית באמצעות צירוף קישור לאתר המותג או ידנית בכמה שלבים מהירים"
        onBack={cancel}
      />

      <section className="bg-white border border-line rounded-3xl shadow-soft p-5 sm:p-7 lg:p-8 space-y-6">
        <div className="flex justify-center">
          <WizardStepper currentStepId={STEP_IDS.identity} />
        </div>

        <div className="space-y-5">
          <Field
            label="שם המותג"
            value={name}
            max={NAME_MAX}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => updateDraft({ name: e.target.value })}
              maxLength={NAME_MAX}
              placeholder="שם המותג"
              dir="rtl"
              className={cn(
                'w-full rounded-xl border-2 border-brand-300 bg-white',
                'px-4 py-3 text-base text-ink placeholder:text-ink-soft text-right',
                'focus:border-brand-500 focus:outline-none focus:shadow-focus'
              )}
            />
          </Field>

          <Field
            label="פרטים על המותג"
            value={description}
            max={DESCRIPTION_MAX}
          >
            <div className="relative">
              {description && (
                <button
                  type="button"
                  onClick={handleClearDescription}
                  aria-label="ניקוי פרטי המותג"
                  className={cn(
                    'absolute top-3 end-3 z-10 inline-flex h-7 w-7 items-center justify-center',
                    'rounded-md text-danger hover:bg-rose-50 transition-colors'
                  )}
                >
                  <Trash size="16" variant="Bold" color="currentColor" />
                </button>
              )}
              <textarea
                value={description}
                onChange={(e) => updateDraft({ description: e.target.value })}
                maxLength={DESCRIPTION_MAX}
                placeholder="פרטים על המותג"
                dir="rtl"
                rows={6}
                className={cn(
                  'w-full rounded-xl border border-line bg-white',
                  'px-4 py-3 pe-12 text-sm sm:text-base text-ink placeholder:text-ink-soft text-right',
                  'focus:border-brand-300 focus:outline-none focus:shadow-focus',
                  'resize-y min-h-[140px]'
                )}
              />
            </div>
          </Field>
        </div>

        <WizardActions
          onBack={cancel}
          onNext={next}
          canContinue={canContinue}
        />
      </section>
    </div>
  );
}

/* Label + char counter pair. The counter sits below the field on the
 * LEFT (RTL end) so it doesn't compete with the right-aligned label. */
function Field({ label, value, max, children }) {
  const length = value?.length ?? 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-ink-muted">{label}</label>
      </div>
      {children}
      <div className="flex justify-end">
        <span
          className={cn(
            'text-xs',
            length >= max ? 'text-danger font-bold' : 'text-ink-soft'
          )}
        >
          {length}{max ? ` / ${max}` : ''}
        </span>
      </div>
    </div>
  );
}
