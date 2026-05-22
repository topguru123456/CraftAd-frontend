import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@components/ui';
import { useActiveBrand } from '@/contexts/BrandsContext';
import { ProjectCreationLauncher, getProjectType } from '@features/projects';
import { ROUTES } from '@config/routes';

/* Project-type chooser at /app/projects/new.
 *
 * Promoted to its own route (rather than living as a `creating` flag
 * inside ProjectsPage) so the URL reflects state — back button + deep
 * links work, and each type's own flow can navigate to / from here
 * predictably.
 *
 * Picking a card with `status: 'available'` navigates to that type's
 * specific creation page. Disabled (coming-soon) cards don't fire
 * onSelect at all (the launcher swallows the click in
 * ProjectTypeCard), so we never need to gate that here.
 */
export default function NewProjectPage() {
  const navigate = useNavigate();
  const { activeBrand } = useActiveBrand();

  const handleSelect = (type) => {
    /* Each project type id maps 1:1 to a sub-route. Today we only have
     * `campaign-creative` wired; the rest are coming-soon and never
     * fire this handler. As new types ship, register the route and
     * the launcher dispatches automatically. */
    const target = getProjectType(type.id);
    if (!target) return;
    navigate(ROUTES.app.projects.newType(type.id));
  };

  return (
    <PageContainer>
      <ProjectCreationLauncher
        onCancel={() => navigate(ROUTES.app.projects.list)}
        onSelect={handleSelect}
      />
    </PageContainer>
  );
}
