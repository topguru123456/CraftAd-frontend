import { DocumentText, Gallery } from 'iconsax-react';
import {
  ProjectWizardHeader,
  ProjectWizardShell,
} from '@features/projects/flows/shared';
import { cn } from '@lib/cn';
import {
  STEP_IDS,
  WIZARD_STEPS,
  useVideoCreative,
} from '../context/VideoCreativeContext';

/* Step 2 (visible stepper) — בחר אפשרות for the video-creative flow.
 *
 * Two cards, single-select. The choice determines step 3's input
 * shape:
 *   • 'image' — animate a static product image into video
 *   • 'text'  — generate video from a written script / description
 *
 * About the placeholder visual area:
 *   The spec mock shows each card with a large hero image space above
 *   the label — the client team will provide those hero illustrations
 *   later. Until they land we render a centered iconsax glyph on a
 *   brand-tinted tile in the same slot. Importantly the layout
 *   reserves the exact space the real images will occupy (square,
 *   ~70% of card height), so dropping the real assets in later is a
 *   one-line swap (replace the icon with an <img>) with no layout
 *   shift on production cards.
 *
 * DOM order [text, image] → in RTL flex/grid, DOM[0] sits on the
 * RIGHT and DOM[1] on the LEFT. That matches the spec mock: "טקסט
 * לסרטון" on the right, "תמונה לסרטון" on the left. */
const OPTIONS = Object.freeze([
  {
    id: 'text',
    label: 'טקסט לסרטון',
    Icon: DocumentText,
  },
  {
    id: 'image',
    label: 'תמונה לסרטון',
    Icon: Gallery,
  },
]);

export function OptionsStep() {
  const { draft, updateDraft, next, back, cancel } = useVideoCreative();
  const canContinue = Boolean(draft.videoSourceType);

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <ProjectWizardHeader
        title="בחרו איזה תוכן ונכסים דיגיטליים תרצו לייצר באמצעות AI"
        subtitle="זה השלב הראשון בדרך ליצירת התכנים עבור המותג שלכם. זה רק כמה צעדים פשוטים, לא יותר מ-3 דקות!"
        onBack={cancel}
      />

      <ProjectWizardShell
        steps={WIZARD_STEPS}
        currentStepId={STEP_IDS.options}
        onBack={back}
        onNext={next}
        canContinue={canContinue}
      >
        <ul
          role="radiogroup"
          aria-label="סוג מקור הוידאו"
          dir="rtl"
          className="grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          {OPTIONS.map((option) => (
            <li key={option.id}>
              <OptionCard
                option={option}
                selected={draft.videoSourceType === option.id}
                onSelect={() => updateDraft({ videoSourceType: option.id })}
              />
            </li>
          ))}
        </ul>
      </ProjectWizardShell>
    </div>
  );
}

/* Single option tile. Selected state matches the existing
 * PlatformPicker / RatioPicker convention — brand-400 border + pink
 * drop shadow — so the three picker patterns in the app read as one
 * affordance to a user moving across flows.
 *
 * Card shape:
 *   ┌─────────────────────────┐
 *   │                         │
 *   │   [placeholder area]    │ ← square; eventually a hero image
 *   │                         │
 *   ├─────────────────────────┤
 *   │       label             │ ← below the placeholder
 *   └─────────────────────────┘ */
function OptionCard({ option, selected, onSelect }) {
  const { Icon, label } = option;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'group w-full h-full flex flex-col items-stretch gap-4',
        'rounded-2xl bg-white border-2 p-5 sm:p-6',
        'transition-all duration-150',
        selected
          ? 'border-brand-400 shadow-[0_8px_24px_rgba(215,78,124,0.18)]'
          : 'border-line hover:border-brand-200 hover:shadow-card'
      )}
    >
      {/* Placeholder hero. Fixed-height tile (not aspect-square) so
       * the card stays compact at ~210px total instead of dominating
       * the row — closer to the spec mock's proportions. The brand-50
       * fill still reserves the spot the real hero illustrations will
       * occupy when assets land; the swap is a one-line change
       * (replace <Icon> with <img>). */}
      <div
        className={cn(
          'w-full h-32 sm:h-40 rounded-xl flex items-center justify-center',
          'bg-brand-50 border border-brand-100 transition-colors',
          'group-hover:bg-brand-100/60'
        )}
      >
        <Icon
          size="48"
          variant="Linear"
          color="#ED5699"
          aria-hidden="true"
        />
      </div>

      <span className="text-base sm:text-lg font-bold text-ink text-center">
        {label}
      </span>
    </button>
  );
}
