import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '@components/ui';
import { cn } from '@lib/cn';
import { useActiveBrand } from '@/contexts/BrandsContext';
import { ROUTES } from '@config/routes';
import { projectsApi } from '@features/projects/api/projects.api';
import {
  fetchProjectVariants,
  pickPreviewFromVariants,
} from '@features/projects/lib/service-type-output';
import { EditProjectModal } from './EditProjectModal';
import { ProjectCard } from './ProjectCard';

/* Project list for /app/projects.
 *
 * Loads in two stages: list the projects (fast), then enrich each card
 * with its first-variant preview in parallel (slow). The grid paints
 * after stage 1 with icon placeholders so the page feels instant on
 * brands with many projects. */

export function CreativeGenerationsList({ view, query }) {
  const navigate = useNavigate();
  const { activeBrand } = useActiveBrand();

  const {
    rows,
    loading,
    error,
    reload,
    replaceProject,
    removeProject,
  } = useEnrichedProjects(activeBrand?.id);

  const [editingProject, setEditingProject] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const visibleRows = useMemo(
    () => filterRows(rows, query),
    [rows, query],
  );

  const handleSaveName = async (nextName) => {
    if (!editingProject) return { error: { message: 'אין פרויקט נבחר' } };
    const { data, error: err } = await projectsApi.update(editingProject.id, {
      name: nextName,
    });
    if (err) return { error: err };
    replaceProject(editingProject.id, data);
    return { data };
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    removeProject(id);
    const { error: err } = await projectsApi.remove(id);
    if (err) {
      console.error('[CreativeGenerationsList] delete failed:', err);
      reload();
    }
  };

  if (loading) return <SkeletonGrid view={view} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (visibleRows.length === 0) return <EmptyState query={query} />;

  return (
    <>
      <div
        className={cn(
          view === 'list'
            ? 'space-y-3'
            : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-5',
        )}
      >
        {visibleRows.map(({ project, preview }) => (
          <ProjectCard
            key={project.id}
            project={project}
            preview={preview}
            onOpen={() => navigate(ROUTES.app.projects.detail(project.id))}
            onEdit={() => setEditingProject(project)}
            onDelete={() => setPendingDelete(project)}
          />
        ))}
      </div>

      <EditProjectModal
        open={editingProject !== null}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSave={handleSaveName}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="מחיקת פרויקט"
        description={
          pendingDelete?.name
            ? `הפרויקט "${pendingDelete.name}" וכל הוריאציות שבו יימחקו לצמיתות. הפעולה אינה ניתנת לביטול.`
            : 'הפרויקט וכל הוריאציות שבו יימחקו לצמיתות. הפעולה אינה ניתנת לביטול.'
        }
        confirmLabel="מחק פרויקט"
        variant="danger"
      />
    </>
  );
}

/* Each row: { project, variantCount, preview }
 *   variantCount === null  → enrichment in flight (row visible, icon placeholder)
 *   variantCount === 0     → confirmed orphan (row hidden)
 *   variantCount  >  0     → enriched */
function useEnrichedProjects(brandId) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!brandId) {
      setRows([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const { data: projects = [], error: listErr } = await projectsApi.list({
        brandId,
        limit: 100,
      });
      if (cancelled) return;

      if (listErr) {
        setError(listErr.message ?? 'שגיאה בטעינת הפרויקטים');
        setRows([]);
        setLoading(false);
        return;
      }

      setRows(projects.map((project) => ({
        project,
        variantCount: null,
        preview: { kind: 'pending' },
      })));
      setLoading(false);

      // Enrich in parallel; each enrichment updates one row in place.
      projects.forEach(async (project) => {
        const { data: variants } = await fetchProjectVariants(
          project.serviceType,
          project.id,
        );
        if (cancelled) return;
        const list = variants ?? [];
        setRows((prev) =>
          prev.map((row) =>
            row.project.id === project.id
              ? {
                  project,
                  variantCount: list.length,
                  preview: pickPreviewFromVariants(project.serviceType, list),
                }
              : row,
          ),
        );
      });
    })();

    return () => { cancelled = true; };
  }, [brandId, reloadToken]);

  return {
    rows,
    loading,
    error,
    reload: () => setReloadToken((t) => t + 1),
    replaceProject: (id, nextProject) =>
      setRows((prev) =>
        prev.map((row) =>
          row.project.id === id
            ? { ...row, project: { ...row.project, ...nextProject } }
            : row,
        ),
      ),
    removeProject: (id) =>
      setRows((prev) => prev.filter((row) => row.project.id !== id)),
  };
}

function filterRows(rows, query) {
  const visible = rows.filter(
    (row) => row.variantCount === null || row.variantCount > 0,
  );
  const q = query?.trim().toLowerCase();
  if (!q) return visible;
  return visible.filter(({ project }) => {
    const name = (project.name ?? '').toLowerCase();
    const brief = (project.draft?.brief ?? '').toLowerCase();
    return name.includes(q) || brief.includes(q);
  });
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-card border border-line bg-white p-12 text-center" dir="rtl">
      <p className="text-base text-danger mb-3">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-outline inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold"
      >
        נסו שוב
      </button>
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-white p-12 text-center text-ink-muted" dir="rtl">
      <p className="text-base">
        {query
          ? 'לא נמצאו פרויקטים התואמים לחיפוש'
          : 'אין כאן עדיין פרויקטים — לחצו על "צור פרויקט חדש" כדי להתחיל'}
      </p>
    </div>
  );
}

function SkeletonGrid({ view }) {
  const count = view === 'list' ? 4 : 6;
  const wrapperClass = view === 'list'
    ? 'space-y-3'
    : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-5';
  return (
    <div className={wrapperClass}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-line p-5 min-h-[180px] flex flex-col shadow-[0_4px_16px_rgba(237,86,153,0.08)]">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-lg bg-surface-muted animate-pulse" />
        <div className="h-5 w-20 rounded-full bg-surface-muted animate-pulse" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-2/3 bg-surface-muted rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-surface-muted rounded animate-pulse" />
        <div className="h-3 w-4/6 bg-surface-muted rounded animate-pulse" />
      </div>
      <div className="mt-auto pt-4 border-t border-line flex items-center justify-between">
        <div className="h-3 w-32 bg-surface-muted rounded animate-pulse" />
        <div className="h-8 w-8 bg-surface-muted rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
