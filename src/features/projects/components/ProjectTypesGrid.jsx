import { ProjectTypeCard } from './ProjectTypeCard';
import { PROJECT_TYPES } from '../config/project-types.config';

/* Three-column responsive grid of project types.
 *
 * Reads PROJECT_TYPES directly from the catalogue — adding/removing a
 * type happens in one file and propagates here. Each card is rendered
 * the same way; "selected" state is drawn by the card itself based on
 * the prop (the parent owns the selection state machine).
 */
export function ProjectTypesGrid({ selectedId, onSelect }) {
  return (
    <ul
      dir="rtl"
      role="list"
      /* `auto-rows-fr` distributes each row's height equally across its
         items — combined with `h-full` on the card, every card in a row
         shares the same height regardless of description length. */
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 auto-rows-fr"
    >
      {PROJECT_TYPES.map((type) => (
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
