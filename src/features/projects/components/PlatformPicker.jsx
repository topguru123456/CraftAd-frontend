import { cn } from '@lib/cn';
import { PLATFORMS } from '../config/platforms.config';

/* Shared "pick a social platform" card.
 *
 * Used by any project-type flow whose first step asks for the target
 * platform. White card containing a responsive grid of platform tiles;
 * each tile is a radio button with brand-pink ring when selected.
 *
 * Layout: 3 cols on tablet+, 2 on small. Icons come from the SVG
 * assets in `src/assets/icons/social/` — they ship with the brand-pink
 * gradient baked in, so we render them at-size without color overrides. */
export function PlatformPicker({ selectedId, onSelect }) {
  return (
    <Section title="בחרו פלטפורמה">
      <ul
        role="radiogroup"
        aria-label="פלטפורמה"
        className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      >
        {PLATFORMS.map((platform) => {
          const isSelected = platform.id === selectedId;
          return (
            <li key={platform.id}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(platform.id)}
                className={cn(
                  'group w-full h-full flex flex-col items-center justify-center gap-3',
                  'rounded-2xl bg-white border-2 px-6 py-8 sm:py-10',
                  'transition-all duration-150',
                  isSelected
                    ? 'border-brand-400 shadow-[0_8px_24px_rgba(215,78,124,0.18)]'
                    : 'border-line hover:border-brand-200 hover:shadow-card'
                )}
              >
                <platform.Icon className="h-12 w-12 sm:h-14 sm:w-14" />
                <span className="text-md sm:text-lg font-bold text-ink">
                  {platform.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-white border border-line rounded-3xl shadow-soft p-5 sm:p-7 lg:p-8 space-y-6">
      <h2 className="text-lg sm:text-xl font-extrabold text-ink text-center">
        {title}
      </h2>
      {children}
    </section>
  );
}
