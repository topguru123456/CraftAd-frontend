import { useNavigate, useParams } from 'react-router-dom';
import { PageContainer } from '@components/ui';
import { getProjectFlow, getProjectType } from '@features/projects';
import { ROUTES } from '@config/routes';

/* /app/projects/new/:projectType
 *
 * Single entry for every project-type creation wizard. The registry
 * in `flows/shared/project-flows.registry.js` maps type ids to their
 * Flow component — no per-type page file needed when a new type ships.
 *
 * Legacy routes (/projects/new/campaign-creative, etc.) redirect here
 * so bookmarks keep working. */
export default function ProjectCreationPage() {
  const { projectType } = useParams();
  const navigate = useNavigate();

  const flow = getProjectFlow(projectType);
  const meta = getProjectType(projectType);

  const handleCancel = () => navigate(ROUTES.app.projects.new);

  const handleComplete = ({ projectId } = {}) => {
    if (projectId) {
      navigate(ROUTES.app.projects.detail(projectId));
    } else {
      navigate(ROUTES.app.projects.list);
    }
  };

  if (!flow) {
    const title = meta?.title ?? 'פרויקט';
    return (
      <PageContainer>
        <div dir="rtl" className="rounded-card border border-line bg-white p-12 text-center space-y-4">
          <h1 className="text-xl font-extrabold text-ink">{title}</h1>
          <p className="text-ink-muted">
            {meta?.status === 'coming-soon'
              ? 'סוג פרויקט זה עדיין בפיתוח — בקרוב.'
              : 'סוג פרויקט לא נמצא.'}
          </p>
          <button
            type="button"
            onClick={handleCancel}
            className="btn-outline inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold"
          >
            חזרה לבחירת סוג
          </button>
        </div>
      </PageContainer>
    );
  }

  const { Flow } = flow;

  return (
    <PageContainer>
      <Flow onCancel={handleCancel} onComplete={handleComplete} />
    </PageContainer>
  );
}
