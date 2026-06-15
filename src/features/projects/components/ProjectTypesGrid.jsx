import { useMemo } from 'react';
import { ProjectTypeCard } from './ProjectTypeCard';
import { PROJECT_TYPES } from '../config/project-types.config';

/* Responsive grid of project types.
 *
 * Reads PROJECT_TYPES from the catalogue and skips entries flagged
 * `hiddenFromLauncher` (those exist for badge/lookup parity but
 * reach the user through dedicated sidebar entries instead). Adding
 * or removing a type happens in one file and propagates here.
 *
 * Breakpoints:
 *   ≥ sm  (640px)   — 2 cols
 *   ≥ lg  (1024px)  — 3 cols
 *   ≥ 3xl (1920px)  — 4 cols (4K, 1440p, maximized 1080p)
 *
 * `selected` state is drawn by the card itself based on the prop;
 * the parent owns the selection state machine.
 */
export function ProjectTypesGrid({ selectedId, onSelect }) {
  const visibleTypes = useMemo(
    () => PROJECT_TYPES.filter((t) => !t.hiddenFromLauncher),
    [],
  );

  return (
    <ul
      dir="rtl"
      role="list"
      /* `auto-rows-fr` distributes each row's height equally across its
         items — combined with `h-full` on the card, every card in a row
         shares the same height regardless of description length. */
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-4 sm:gap-5 auto-rows-fr"
    >
      {visibleTypes.map((type) => (
        <li key={type.id} className="h-full">
          <ProjectTypeCard
            type={type}
            selected={type.id === selectedId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
