import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton, PageContainer } from '@components/ui';
import { ROUTES } from '@config/routes';
import { projectsApi } from '@features/projects/api/projects.api';
import {
  creativeGenerationsApi,
  variantPlaceholderFromDispatch,
} from '@features/projects/flows/campaign-creative/api/creative-generations.api';
import { VARIANTS_PER_CLICK } from '@features/projects/flows/campaign-creative/context/CampaignCreativeContext';
import { productImageGenerationsApi } from '@features/projects/flows/product-images/api/product-image-generations.api';
import { copywritingGenerationsApi } from '@features/projects/flows/copywriting/api/copywriting-generations.api';
import { CopywritingEditModal } from '@features/projects/flows/copywriting/components/CopywritingEditModal';
import { CopywritingResults } from '@features/projects/flows/copywriting/components/CopywritingResults';
import { useCopywritingVariants } from '@features/projects/flows/copywriting/hooks/useCopywritingVariants';
import { VideoResults } from '@features/projects/flows/video-creative/components/VideoResults';
import { useVideoVariants } from '@features/projects/flows/video-creative/hooks/useVideoVariants';
import { useGenerationFailureToasts } from '@features/projects/hooks/useGenerationFailureToasts';
import { useVariantSync } from '@features/projects/hooks/useVariantSync';
import { useToast } from '@/contexts/ToastContext';
import {
  ImageResultsGrid,
  ImageResultsToolbar,
  useImageResults,
} from '@features/projects/components/ImageResultsView';
import { CreateMoreButton } from '@features/projects/components/CreateMoreButton';
import { AdPackageTabs } from '@features/projects/flows/advertising-package/components/AdPackageTabs';

const SERVICE_TYPE = {
  copywriting: 'copywriting-ads',
  video: 'video-creative',
  advertisingPackage: 'advertising-package',
  productImages: 'product-images',
};

/* Per-project hard cap on image creatives. 9 = wizard's initial 3 +
 * two more "Create more" clicks of 3 each. Beyond this, the
 * Create-more button is hidden entirely (not just disabled). Failed
 * variants count toward the cap — they cost API calls regardless. */
const MAX_CREATIVES_PER_PROJECT = 9;

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const project = useProject(projectId);
  const projectName = (project.data?.name ?? '').trim() || 'פרויקט';

  const toast = useToast();
  const variants = useVariantSync({ mode: 'project', projectId });
  const imageResults = useImageResults({
    variants: variants.variants,
    projectName,
  });

  const isCopywriting = project.data?.serviceType === SERVICE_TYPE.copywriting;
  const isVideo = project.data?.serviceType === SERVICE_TYPE.video;
  const isAdPackage = project.data?.serviceType === SERVICE_TYPE.advertisingPackage;
  const isProductImages =
    project.data?.serviceType === SERVICE_TYPE.productImages;

  const copywriting = useCopywritingVariants({
    projectId,
    enabled: isCopywriting || isAdPackage,
  });
  const video = useVideoVariants({
    projectId,
    enabled: isVideo,
    /* Failed Veo generations no longer render as a card (filtered
     * out in VideoResults). Surface the failure once via toast so
     * the user still sees what happened — the row is detected
     * inside useVideoVariants on the poll tick where its status
     * flips to 'failed', deduped by id. */
    onFailure: (variant) => {
      toast.error(variant.errorMessage ?? 'יצירת הסרטון נכשלה');
    },
  });

  const [adPackageTab, setAdPackageTab] = useState('images');
  const [editingVariant, setEditingVariant] = useState(null);
  const [dispatchMore, setDispatchMore] = useState({
    inFlight: false,
    error: null,
  });

  /* Cap state. `imageCreativeCount` includes all statuses (pending,
   * dispatched, ready, failed) — failed variants still consumed a
   * dispatcher call, so they count toward the per-project budget.
   * `remainingCreativeSlots` drives both the "hide Create more" gate
   * and the dispatch-count clamp on the last click. */
  const imageCreativeCount = variants.variants?.length ?? 0;
  const remainingCreativeSlots = Math.max(
    0,
    MAX_CREATIVES_PER_PROJECT - imageCreativeCount,
  );
  const canDispatchMoreImages = remainingCreativeSlots > 0;

  const handleDispatchMore = useCallback(async () => {
    if (!projectId || dispatchMore.inFlight) return;
    if (remainingCreativeSlots <= 0) return;
    setDispatchMore({ inFlight: true, error: null });

    if (isProductImages) {
      /* The product-images dispatcher is fixed at 3 variants per call
       * and doesn't accept a count param — accept a slight overshoot
       * when remainingCreativeSlots is 1 or 2 (rare, only after a
       * failed-variant cap math wrinkle). */
      const { data: rows, error } = await productImageGenerationsApi.dispatch({
        projectId,
      });
      if (Array.isArray(rows)) {
        for (const row of rows) {
          if (row?.id) {
            variants.mergeVariant(variantPlaceholderFromDispatch(row));
          }
        }
      }
      const errMsg =
        error?.message ??
        (Array.isArray(rows) && rows.length > 0 ? null : 'הוספת בקשות נכשלה');
      if (errMsg) {
        toast.warning(errMsg, {
          description: 'לא כל הבקשות יצאו לדרך — ניתן לנסות שוב.',
        });
      }
      setDispatchMore({ inFlight: false, error: errMsg });
      return;
    }

    /* One batch call dispatches all variants; the backend coordinates
     * distinct ad-reference templates across them. `data.uids` carries
     * the variants that were accepted, `data.errors` carries any
     * per-variant failures (partial success surfaces both).
     *
     * Count is clamped to remainingCreativeSlots so the LAST click
     * hits MAX exactly even when the user is at 7 or 8 (e.g., a
     * previous failure consumed budget). */
    const requested = Math.min(VARIANTS_PER_CLICK, remainingCreativeSlots);
    const { data, error } = await creativeGenerationsApi.dispatch({
      projectId,
      count: requested,
    });

    const uids = data?.uids ?? [];
    const errors = data?.errors ?? [];

    for (const uid of uids) {
      variants.mergeVariant(variantPlaceholderFromDispatch({ uid, projectId }));
    }

    const errMsg = summarizeDispatchOutcome({
      uids,
      errors,
      requested,
      topLevelError: error,
    });
    if (errMsg) {
      toast.warning(errMsg, {
        description: 'לא כל הבקשות יצאו לדרך — ניתן לנסות שוב.',
      });
    }
    setDispatchMore({ inFlight: false, error: errMsg });
  }, [
    projectId,
    dispatchMore.inFlight,
    isProductImages,
    variants,
    toast,
    remainingCreativeSlots,
  ]);

  // Optimistic bookmark toggle. Mirror copywriting's pattern: flip
  // the local row immediately, fire the PATCH, roll back if the
  // server rejects.
  const handleToggleBookmark = useCallback(async (variantId, next) => {
    variants.mergeVariant({ id: variantId, bookmarked: next });
    const { error: err } = await creativeGenerationsApi.setBookmarked(
      variantId,
      next,
    );
    if (err) {
      console.error('[ProjectDetailPage] bookmark toggle failed:', err);
      variants.mergeVariant({ id: variantId, bookmarked: !next });
    }
  }, [variants]);

  const handleSaveCopyEdit = useCallback(async (nextText) => {
    if (!editingVariant) return { error: { message: 'אין וריאציה נבחרת' } };
    const { data, error: err } = await copywritingGenerationsApi.updateAdText(
      editingVariant.id,
      nextText,
    );
    if (err) return { error: err };
    copywriting.replaceVariant(data);
    return { data };
  }, [editingVariant, copywriting]);

  const showImageToolbar =
    project.data &&
    !isCopywriting &&
    !isVideo &&
    (!isAdPackage || adPackageTab === 'images');

  useGenerationFailureToasts(variants.variants, {
    enabled: Boolean(showImageToolbar && !project.loading),
  });

  return (
    <PageContainer>
      <div className="space-y-6" dir="rtl">
        <Header
          name={projectName}
          brief={(project.data?.draft?.brief ?? '').trim()}
          onBack={() => navigate(ROUTES.app.projects.list)}
        />

        {project.data && (showImageToolbar || isAdPackage) && (
          <ToolbarRow
            tabs={isAdPackage && <AdPackageTabs active={adPackageTab} onChange={setAdPackageTab} />}
            toolbar={showImageToolbar && <ImageResultsToolbar {...imageResults} />}
          />
        )}

        {project.loading && <PageSkeleton />}

        {!project.loading && project.error && (
          <ErrorPanel message={project.error.message} onRetry={project.reload} />
        )}

        {project.data && isCopywriting && (
          <CopywritingBranch
            copywriting={copywriting}
            onEdit={setEditingVariant}
          />
        )}

        {project.data && isVideo && (
          <VideoBranch video={video} aspectRatio={project.data.aspectRatio} />
        )}

        {project.data && isAdPackage && (
          <AdPackageBranch
            tab={adPackageTab}
            project={project.data}
            variants={variants}
            imageResults={imageResults}
            copywriting={copywriting}
            dispatchError={dispatchMore.error}
            isImageDispatching={dispatchMore.inFlight}
            onImageDispatchMore={handleDispatchMore}
            canDispatchMoreImages={canDispatchMoreImages}
            onVariantEdit={(uid) => navigate(ROUTES.app.projects.editVariant(projectId, uid))}
            onCopyEdit={setEditingVariant}
            onVariantsRetry={project.reload}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {project.data && !isCopywriting && !isVideo && !isAdPackage && (
          <ImageBranch
            project={project.data}
            variants={variants}
            imageResults={imageResults}
            dispatchError={dispatchMore.error}
            isDispatching={dispatchMore.inFlight}
            onDispatchMore={handleDispatchMore}
            canDispatchMore={canDispatchMoreImages}
            onVariantEdit={(uid) => navigate(ROUTES.app.projects.editVariant(projectId, uid))}
            onRetry={project.reload}
            onToggleBookmark={handleToggleBookmark}
          />
        )}
      </div>

      <CopywritingEditModal
        open={editingVariant !== null}
        variant={editingVariant}
        onClose={() => setEditingVariant(null)}
        onSave={handleSaveCopyEdit}
      />
    </PageContainer>
  );
}

function useProject(projectId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!projectId) {
      setData(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    projectsApi.get(projectId).then(({ data: fresh, error: err }) => {
      if (cancelled) return;
      if (err) {
        setError(err);
        setData(null);
      } else {
        setData(fresh);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [projectId, reloadToken]);

  return {
    data,
    loading,
    error,
    reload: () => setReloadToken((t) => t + 1),
  };
}

/* Picks the most actionable user-facing error message from a dispatch
 * batch response: a top-level transport error wins, then the first
 * per-variant error, then the partial-success summary, then null when
 * everything landed. */
function summarizeDispatchOutcome({ uids, errors, requested, topLevelError }) {
  if (topLevelError) return topLevelError.message ?? 'הוספת בקשות נכשלה';
  if (uids.length === 0) {
    return errors[0] ?? 'הוספת בקשות נכשלה';
  }
  if (uids.length < requested) {
    return `${requested - uids.length} מתוך ${requested} בקשות נכשלו`;
  }
  return null;
}

function Header({ name, brief, onBack }) {
  return (
    <header className="space-y-3" dir="rtl">
      <BackButton onClick={onBack} ariaLabel="חזרה לפרויקטים" />
      <div className="text-right">
        <h1 className="text-[28px] sm:text-[32px] font-extrabold leading-tight text-ink truncate">
          {name}
        </h1>
        {brief && (
          <p className="mt-2 text-base text-ink-muted line-clamp-3">{brief}</p>
        )}
      </div>
    </header>
  );
}

function ToolbarRow({ tabs, toolbar }) {
  return (
    <div
      className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      dir="rtl"
    >
      {tabs && <div className="w-full md:w-auto min-w-0">{tabs}</div>}
      {toolbar && <div className="w-full md:w-auto min-w-0">{toolbar}</div>}
    </div>
  );
}

function CopywritingBranch({ copywriting, onEdit }) {
  return (
    <>
      {copywriting.dispatchError && (
        <p className="text-sm text-danger text-right">
          {copywriting.dispatchError.message}
        </p>
      )}
      <CopywritingResults
        variants={copywriting.variants}
        loading={copywriting.loading}
        error={copywriting.error}
        onRetry={copywriting.refresh}
        onToggleBookmark={copywriting.toggleBookmark}
        onEdit={onEdit}
      />
      <CreateMoreButton
        onClick={copywriting.dispatchMore}
        isDispatching={copywriting.isDispatchingMore}
      />
    </>
  );
}

function VideoBranch({ video, aspectRatio }) {
  return (
    <>
      {video.dispatchError && (
        <p className="text-sm text-danger text-right">
          {video.dispatchError.message}
        </p>
      )}
      <VideoResults
        variants={video.variants}
        loading={video.loading}
        error={video.error}
        onRetry={video.refresh}
        aspectRatio={aspectRatio}
      />
      <CreateMoreButton
        onClick={video.dispatchMore}
        isDispatching={video.isDispatchingMore}
      />
    </>
  );
}

function ImageBranch({
  project,
  variants,
  imageResults,
  dispatchError,
  isDispatching,
  onDispatchMore,
  canDispatchMore,
  onVariantEdit,
  onRetry,
  onToggleBookmark,
}) {
  return (
    <>
      <ImageResultsGrid
        {...imageResults}
        loading={variants.loading}
        error={variants.error}
        appendError={dispatchError}
        variants={variants.variants}
        aspectRatio={project.aspectRatio}
        onRetry={onRetry}
        onEdit={onVariantEdit}
        onToggleBookmark={onToggleBookmark}
      />
      {canDispatchMore && (
        <CreateMoreButton onClick={onDispatchMore} isDispatching={isDispatching} />
      )}
    </>
  );
}

function AdPackageBranch({
  tab,
  project,
  variants,
  imageResults,
  copywriting,
  dispatchError,
  isImageDispatching,
  onImageDispatchMore,
  canDispatchMoreImages,
  onVariantEdit,
  onCopyEdit,
  onVariantsRetry,
  onToggleBookmark,
}) {
  /* On the IMAGE tab the cap applies (hide button at 9). On the COPY
   * tab there is no per-project cap today — copy variants can be
   * regenerated freely. If the product later caps copy too, mirror
   * the canDispatchMoreImages plumbing for copy. */
  const isCopyTab = tab === 'copy';
  const dispatchProps = isCopyTab
    ? { onClick: copywriting.dispatchMore, isDispatching: copywriting.isDispatchingMore }
    : { onClick: onImageDispatchMore, isDispatching: isImageDispatching };
  const showDispatchMore = isCopyTab ? true : canDispatchMoreImages;

  return (
    <>
      {tab === 'images' && (
        <ImageResultsGrid
          {...imageResults}
          loading={variants.loading}
          error={variants.error}
          appendError={dispatchError}
          variants={variants.variants}
          aspectRatio={project.aspectRatio}
          onRetry={onVariantsRetry}
          onEdit={onVariantEdit}
          onToggleBookmark={onToggleBookmark}
        />
      )}

      {tab === 'copy' && (
        <>
          {copywriting.dispatchError && (
            <p className="text-sm text-danger text-right">
              {copywriting.dispatchError.message}
            </p>
          )}
          <CopywritingResults
            variants={copywriting.variants}
            loading={copywriting.loading}
            error={copywriting.error}
            onRetry={copywriting.refresh}
            onToggleBookmark={copywriting.toggleBookmark}
            onEdit={onCopyEdit}
          />
        </>
      )}

      {showDispatchMore && <CreateMoreButton {...dispatchProps} />}
    </>
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-card border border-line bg-white p-12 text-center">
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

// Neutral page-level loader. The project's serviceType isn't known
// yet (still fetching metadata), so the old skeleton-grid of 3
// square cards was lying about the eventual content shape — wrong on
// video (9:16) and copywriting (text), and the layout shift to the
// real shape read as broken. A small centered spinner is honest about
// "loading" without making claims about what's coming. Once metadata
// lands the right branch takes over with its own content-appropriate
// skeleton (image grid / video aspect / copy cards).
function PageSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3" dir="rtl">
      <span
        aria-hidden="true"
        className="h-10 w-10 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin"
      />
      <p className="text-sm text-ink-muted">טוען פרויקט...</p>
    </div>
  );
}
