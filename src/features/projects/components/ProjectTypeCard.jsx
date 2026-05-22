import { LottieIcon } from '@components/ui';
import { cn } from '@lib/cn';
import { PROJECT_BADGE_TONES } from '../config/project-types.config';

/* Single tile in the project-type chooser.
 *
 * Layout (RTL):
 *   - Right (start): badge → title → description
 *   - Left  (end):   icon tile (light pink card behind the icon)
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
           own content height and the row reads visually uneven.
           `items-start` aligns icon + text to the top so any extra
           vertical space lands at the bottom — cleaner than centering
           with mismatched content lengths. */
        'group relative w-full h-full text-right rounded-2xl bg-white border p-5 sm:p-6',
        'transition-all duration-150',
        'flex items-start gap-4',
        isAvailable
          ? selected
            ? 'border-brand-400 shadow-[0_8px_24px_rgba(215,78,124,0.18)]'
            : 'border-line hover:border-brand-200 hover:shadow-card'
          : 'border-line opacity-60 cursor-not-allowed'
      )}
    >
      {/* Right column (RTL start): badge + text. flex-1 takes remaining
          width so the icon tile keeps its fixed size. */}
      <div className="flex-1 min-w-0 space-y-2">
        <Badge {...type.badge} />
        <h3 className="text-lg sm:text-xl font-extrabold text-ink leading-tight">
          {type.title}
        </h3>
        <p className="text-sm sm:text-md text-ink-muted leading-relaxed">
          {type.description}
        </p>
      </div>

      {/* Left column (RTL end): icon tile. Fixed-size square so the
          card heights line up across the grid even when description
          length varies. */}
      <div
        aria-hidden="true"
        className={cn(
          'shrink-0 h-[72px] w-[72px] sm:h-20 sm:w-20',
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
