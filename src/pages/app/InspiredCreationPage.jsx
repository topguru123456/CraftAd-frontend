import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@components/ui';
import { ROUTES } from '@config/routes';
import { useToast } from '@/contexts/ToastContext';
import { useActiveBrand } from '@/contexts/BrandsContext';
import { requestQuotaRefresh } from '@/contexts/QuotaContext';
import { InspiredCreationWorkspace } from '@features/inspired-creation';
import { detectAspectRatio } from '@features/inspired-creation/lib/detect-aspect-ratio';
import { creativeImagesApi } from '@features/projects/flows/campaign-creative/api/creative-images.api';
import { creativeGenerationsApi } from '@features/projects/flows/campaign-creative/api/creative-generations.api';
import { VARIANTS_PER_CLICK } from '@features/projects/flows/campaign-creative/context/CampaignCreativeContext';
import { projectsApi } from '@features/projects/api/projects.api';

/* /app/inspired-creation — collect a product image + an inspo
 * creative, dispatch a campaign-creative-style image generation.
 *
 * Wired as a thin wrapper around the campaign-creative dispatch
 * pipeline:
 *   1. Upload both files to `campaign-uploads` (reuses
 *      creativeImagesApi.uploadDeviceImage — same bucket / RLS path
 *      the campaign-creative wizard uses for device uploads, so the
 *      GCF can fetch them by public URL).
 *   2. Detect the inspo's aspect ratio client-side. The output's
 *      shape mirrors the inspo per product decision; the wizard has
 *      no separate ratio picker.
 *   3. Insert a `projects` row with `serviceType='inspired-creation'`
 *      and `draft.images = [product, inspo]`. The order matches
 *      campaign-creative's slot convention: [0] is the product,
 *      [1] is the user-supplied reference, so
 *      `resolveCampaignGcfImageSlots` on the backend produces the
 *      right GCF payload without any inspired-creation-specific
 *      branching.
 *   4. Fan out VARIANTS_PER_CLICK parallel dispatches — same number
 *      campaign-creative ships per click. The webhook + scoring +
 *      edit + download paths are identical from here on.
 *   5. If every dispatch fails, roll back the orphan project row.
 *      Same rollback rule campaign-creative uses (see
 *      CampaignCreativeContext.submit). Otherwise navigate to
 *      /app/projects/:id and let ProjectDetailPage take over. */
export default function InspiredCreationPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { activeBrand } = useActiveBrand();
  const [submitting, setSubmitting] = useState(false);

  const handleGenerate = async ({ productFile, inspirationFile }) => {
    if (submitting) return;
    if (!activeBrand?.id) {
      toast.error('לא נבחר מותג פעיל');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload both files in parallel. Failure on either side
      //    aborts before we create a project row, so we never leave
      //    a half-set-up project behind.
      const [productResult, inspoResult] = await Promise.all([
        creativeImagesApi.uploadDeviceImage(productFile),
        creativeImagesApi.uploadDeviceImage(inspirationFile),
      ]);

      if (productResult.error || !productResult.data?.url) {
        toast.error(productResult.error?.message ?? 'העלאת תמונת המוצר נכשלה');
        return;
      }
      if (inspoResult.error || !inspoResult.data?.url) {
        toast.error(inspoResult.error?.message ?? 'העלאת מודעת ההשראה נכשלה');
        return;
      }

      // 2. Snap the inspo's aspect ratio to one the dispatcher
      //    accepts. The helper logs nothing and never rejects —
      //    falls back to `square` on any read error.
      const aspectRatio = await detectAspectRatio(inspirationFile);

      // 3. Project row. `name` is auto-generated; the user can rename
      //    later via the existing EditProjectModal. `draft.context`
      //    is left empty — the campaign-creative prompt path reads
      //    these fields and renders them as empty strings, which is
      //    fine: with no campaign metadata, the model leans on the
      //    reference image, which is the entire point of inspired
      //    creation.
      const { data: project, error: projectError } = await projectsApi.create({
        brandId: activeBrand.id,
        serviceType: 'inspired-creation',
        aspectRatio,
        name: buildProjectName(activeBrand.name),
        draft: {
          images: [
            {
              url: productResult.data.url,
              path: productResult.data.path,
              source: 'device',
            },
            {
              url: inspoResult.data.url,
              path: inspoResult.data.path,
              source: 'device',
            },
          ],
          /* Empty campaign context: no goal/nature/audience to pass.
           * Kept as explicit empty strings (not omitted) so the
           * backend's prompt assembler doesn't have to defend
           * against `undefined` access. */
          context: {
            product_name: '',
            description: '',
            nature_he: '',
            location_he: '',
            purpose_he: '',
            audience_display: '',
            platform: '',
            landing_page_url: '',
          },
        },
      });

      if (projectError || !project?.id) {
        toast.error(projectError?.message ?? 'יצירת הפרויקט נכשלה');
        return;
      }

      // 4. Fan out N parallel dispatches.
      const dispatchResults = await Promise.allSettled(
        Array.from({ length: VARIANTS_PER_CLICK }, () =>
          creativeGenerationsApi.dispatch({ projectId: project.id }),
        ),
      );

      const dispatched = dispatchResults.filter(
        (r) => r.status === 'fulfilled' && !r.value.error,
      );

      // 5. Roll back if zero variants made it through. Same pattern
      //    campaign-creative uses (see CampaignCreativeContext.submit).
      //    Fire-and-forget the delete — if it fails we just have an
      //    orphan project the user can delete from the projects list.
      if (dispatched.length === 0) {
        projectsApi.remove(project.id).catch((err) => {
          console.warn('[inspired-creation] orphan project rollback failed:', err);
        });
        const firstError = dispatchResults.find(
          (r) => r.status === 'fulfilled' && r.value.error,
        );
        toast.error(
          firstError?.value?.error?.message ?? 'יצירת הקריאייטיב נכשלה',
        );
        return;
      }

      // Project quota changed — nudge QuotaProvider to re-read.
      requestQuotaRefresh();

      // 6. Hand off to the project detail page. From here on it's
      //    identical to campaign-creative: variants stream in via
      //    realtime, scoring populates, "Create more" re-dispatches
      //    against the same draft.
      navigate(ROUTES.app.projects.detail(project.id));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8" dir="rtl">
        <header className="text-right space-y-2">
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-ink leading-tight">
            יצירת קריאייטיב מהשראה
          </h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-3xl leading-relaxed">
            העלו כאן מודעה שאהבתם ותרצו לקחת ממנה השראה, ואנחנו נדאג להתאים לך
            מודעה באותו קונספט ורעיון.
          </p>
        </header>

        <InspiredCreationWorkspace
          onGenerate={handleGenerate}
          onBack={() => navigate(ROUTES.app.projects.list)}
        />
      </div>
    </PageContainer>
  );
}

/* Auto-generated project name. Format: "השראה — {brand} — {DD/MM/YYYY}".
 * User can rename later via the existing project-edit modal. Hebrew
 * locale for the date so it reads naturally in the project list. */
function buildProjectName(brandName) {
  const date = new Date().toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const brand = (brandName ?? '').trim() || 'מותג';
  return `השראה — ${brand} — ${date}`;
}
