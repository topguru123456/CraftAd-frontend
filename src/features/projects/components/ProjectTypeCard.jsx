import { LottieIcon } from '@components/ui';
import { cn } from '@lib/cn';
import { PROJECT_BADGE_TONES } from '../config/project-types.config';

/* Single tile in the project-type chooser.
 *
 * Layout (RTL):
 *   - Header row: icon tile on the visual RIGHT (DOM start), badge on
 *     the visual LEFT (DOM end) — opposite corners so neither competes
 *     for the same edge with the other.
 *   - Body: title + description, right-aligned, full-width under the
 *     header so multi-line descriptions don't compress into a narrow
 *     side column.
 *
 * Icon source: animated Lottie for `available` types (always-playing —
 * the product call is that motion across the grid is the right amount
 * of energy for a "pick what to create" moment), iconsax fallback for
 * `coming-soon` placeholders.
 *
 * Coming-soon types render disabled: muted opacity, grey-toned badge,
 * `cursor-not-allowed`, click handler suppressed. The badge is the only
 * outwardly different element vs. an available card so users recognize
 * the gating at a glance.
 */
export function ProjectTypeCard({ type, selected, onSelect }) {
  const isAvailable = type.status === 'available';
  const handleClick = isAvailable ? () => onSelect?.(type) : undefined;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isAvailable}
      aria-pressed={isAvailable ? !!selected : undefined}
      className={cn(
        /* `h-full` makes every card stretch to the row's tallest sibling
           (CSS-grid auto-rows behaviour). Without it, cards adopt their
           own content height and the row reads visually uneven. */
        'group relative w-full h-full text-right rounded-2xl bg-white border p-5 sm:p-6',
        'transition-all duration-150',
        'flex flex-col gap-4',
        isAvailable
          ? selected
            ? 'border-brand-400 shadow-[0_8px_24px_rgba(215,78,124,0.18)]'
            : 'border-line hover:border-brand-200 hover:shadow-card'
          : 'border-line opacity-60 cursor-not-allowed'
      )}
    >
      {/* Header row: icon (DOM[0] → visual RIGHT in RTL) and badge
          (DOM[1] → visual LEFT) pinned to opposite ends via
          `justify-between`. */}
      <div className="flex items-start justify-between gap-3">
        <div
          aria-hidden="true"
          className={cn(
            'shrink-0 h-[64px] w-[64px] sm:h-[72px] sm:w-[72px]',
            'rounded-2xl bg-rose-50/70 flex items-center justify-center',
            'overflow-hidden',
            !isAvailable && 'opacity-70'
          )}
        >
          {type.animationLoader ? (
            /* The Lottie renders at the tile's full size; the Lottie file
               itself ships with the pink palette baked in (same as the
               previous SVG approach), so no recolor is needed. Always
               playing so the chooser feels alive. Loader is invoked on
               mount; lottie-react chunk + the JSON itself are both lazy-
               loaded so the rest of the app doesn't pay their cost. */
            <LottieIcon
              loader={type.animationLoader}
              playMode="always"
              className="h-[88%] w-[88%]"
            />
          ) : (
            /* Coming-soon fallback: static iconsax glyph in brand pink so
               it visually echoes the animated tiles' colour without trying
               to compete on motion. */
            <type.Icon
              className="h-9 w-9 sm:h-10 sm:w-10"
              color="#ED5699"
            />
          )}
        </div>
        <Badge {...type.badge} />
      </div>

      {/* Body: title + description, full-width under the header. */}
      <div className="space-y-2 min-w-0">
        <h3 className="text-lg sm:text-xl font-extrabold text-ink leading-tight">
          {type.title}
        </h3>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          {type.description}
        </p>
      </div>
    </button>
  );
}

/* Small pill in the top-right (RTL start) of the card. Tone drives
 * color: ממומן/beta/אורגני all share the brand-pink fill (matching the
 * screenshot's same-color treatment), `soon` flips to a muted slate so
 * the user reads "this isn't live yet" at a glance. */
const TONE_CLASSES = {
  [PROJECT_BADGE_TONES.paid]:    'bg-brand-500 text-white',
  [PROJECT_BADGE_TONES.beta]:    'bg-brand-500 text-white',
  [PROJECT_BADGE_TONES.organic]: 'bg-brand-500 text-white',
  [PROJECT_BADGE_TONES.soon]:    'bg-ink-muted text-white',
};

function Badge({ label, tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1',
        'text-xs font-bold leading-none',
        TONE_CLASSES[tone] ?? TONE_CLASSES.paid
      )}
    >
      {label}
    </span>
  );
}
