import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListPageToolbar, PageContainer } from '@components/ui';
import { GridIcon, ListIcon } from '@features/navigation';
import { CreativeGenerationsList } from '@features/projects/components/CreativeGenerationsList';
import { ROUTES } from '@config/routes';

const VIEW_MODES = { GRID: 'grid', LIST: 'list' };

/* /app/projects
 *
 * Project list. Project creation lives at /app/projects/new (its own
 * route, not a `creating` flag here) so the URL reflects state and
 * each type's flow can navigate to / from there cleanly.
 *
 * Projects are scoped to the active brand. If none is selected the
 * page short-circuits to the shared no-brand prompt; the sidebar
 * separately disables this row in that state.
 */
export default function ProjectsPage() {
  const navigate = useNavigate();
  const [view, setView] = useState(VIEW_MODES.GRID);
  const [query, setQuery] = useState('');

  return (
    <PageContainer>
      <div className="space-y-8" dir="rtl">
        <header className="text-right space-y-2">
          <h1 className="text-[28px] sm:text-[32px] font-extrabold leading-tight text-ink">
            נהלו את הפרוייקטים והטיוטות שלכם
          </h1>
          <p className="text-base text-ink-muted">
            במסך הזה תוכלו לראות את כל הפרויקטים שלכם ולנהל אותם בקלות!
          </p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ListPageToolbar
            createLabel="צור פרויקט חדש"
            onCreate={() => navigate(ROUTES.app.projects.new)}
            search={query}
            onSearchChange={setQuery}
          />
          <ViewToggle value={view} onChange={setView} />
        </div>

        <CreativeGenerationsList view={view} query={query} />
      </div>
    </PageContainer>
  );
}

function ViewToggle({ value, onChange }) {
  const baseCls = 'inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors';
  return (
    <div className="hidden md:inline-flex items-center gap-1 bg-white p-1 rounded-card border border-line shadow-sm">
      <button
        type="button"
        onClick={() => onChange(VIEW_MODES.GRID)}
        aria-pressed={value === VIEW_MODES.GRID}
        aria-label="תצוגת רשת"
        className={`${baseCls} ${value === VIEW_MODES.GRID ? 'bg-surface-muted text-ink' : 'text-ink-soft hover:text-ink'}`}
      >
        <GridIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => onChange(VIEW_MODES.LIST)}
        aria-pressed={value === VIEW_MODES.LIST}
        aria-label="תצוגת רשימה"
        className={`${baseCls} ${value === VIEW_MODES.LIST ? 'bg-surface-muted text-ink' : 'text-ink-soft hover:text-ink'}`}
      >
        <ListIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

