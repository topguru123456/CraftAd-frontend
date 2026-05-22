import { forwardRef } from 'react';
import { cn } from '@lib/cn';
import { IMAGE_RATIOS } from '@features/projects/config/ratios.config';

/* Aspect-ratio chooser — N tiles, single selection.
 *
 * Used by every image-output flow's Phase-0 pre-step where the user
 * picks the ad/asset shape before any text intake begins (campaign-
 * creative pairs it with a PlatformPicker; product-images uses it
 * alone; video-creative restricts to its own subset).
 *
 * Each tile's mockup comes from the SVG asset in
 * `src/assets/icons/ratio/` — the asset already encodes the right
 * proportions (4:5, 1:1, 9:16, 16:9) plus a built-in drop shadow, so
 * the picker just renders them at a consistent height and lets the
 * natural width follow.
 *
 * `ratios` prop (optional) lets a caller restrict the set — Veo only
 * accepts 16:9 + 9:16 so video-creative passes [LANDSCAPE, STORY].
 * Defaults to IMAGE_RATIOS (story/square/portrait) rather than the
 * full RATIOS catalogue so the landscape entry — which exists ONLY
 * for video — doesn't accidentally surface in image flows that
 * forget to pass the prop.
 *
 * Forwards a ref so a parent flow can `scrollIntoView` here when an
 * earlier-section selection (e.g., platform pick) completes —
 * matches the auto-scroll UX campaign-creative uses. Flows that don't
 * need that simply don't pass a ref. */
export const RatioPicker = forwardRef(function RatioPicker(
  { selectedId, onSelect, ratios = IMAGE_RATIOS },
  ref
) {
  return (
    <section
      ref={ref}
      className="bg-white border border-line rounded-3xl shadow-soft p-5 sm:p-7 lg:p-8 space-y-6"
    >
      <h2 className="text-lg sm:text-xl font-extrabold text-ink text-center">
        בחרו גודל
      </h2>
      <ul
        role="radiogroup"
        aria-label="גודל תוכן"
        className={cn(
          'grid gap-4',
          /* Column count tracks the catalogue size — 3 ratios → 3
           * cols, 2 ratios → 2 cols. Keeps each tile a reasonable
           * size regardless of how the caller restricts the set. */
          ratios.length >= 3 ? 'grid-cols-1 sm:grid-cols-3'
            : ratios.length === 2 ? 'grid-cols-1 sm:grid-cols-2'
              : 'grid-cols-1'
        )}
      >
        {ratios.map((ratio) => {
          const isSelected = ratio.id === selectedId;
          return (
            <li key={ratio.id}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(ratio.id)}
                className={cn(
                  'w-full h-full flex flex-col items-center justify-center gap-3',
                  'rounded-2xl bg-white border-2 px-6 py-6 sm:py-8',
                  'transition-all duration-150',
                  isSelected
                    ? 'border-brand-400 shadow-[0_8px_24px_rgba(215,78,124,0.18)]'
                    : 'border-line hover:border-brand-200 hover:shadow-card'
                )}
              >
                {/* Asset proportions encode the ratio (portrait is
                    taller than square is taller than … etc). Fixed
                    height + auto width keeps the visual scaling honest
                    across the row. */}
                <ratio.Icon className="h-[120px] w-auto" />
                <div className="text-center">
                  <p className="text-md sm:text-lg font-bold text-ink">
                    {ratio.label}
                  </p>
                  <p className="text-sm text-ink-muted font-mono">
                    ({ratio.ratio})
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
});
