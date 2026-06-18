import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { projectsApi } from '@features/projects/api/projects.api';
import { creativeGenerationsApi } from '@features/projects/flows/campaign-creative/api/creative-generations.api';
import { copywritingGenerationsApi } from '@features/projects/flows/copywriting/api/copywriting-generations.api';
import { VARIANTS_PER_CLICK } from '@features/projects/flows/campaign-creative/context/CampaignCreativeContext';
import {
  getCampaignGoalLabel,
  getCampaignNatureLabel,
  getConversionLocationLabel,
  getTargetAudienceLabel,
} from '@features/projects/config/project-fields.config';
import { PLATFORMS_BY_ID } from '@features/projects/config/platforms.config';

/* Submit pipeline stages — mirrors campaign-creative. Auto-image
 * generation no longer happens FE-side; when the user submits without
 * a product image, the dispatcher fabricates one server-side and the
 * FE just dispatches with an empty product slot. */
export const SUBMIT_STAGE = Object.freeze({
  idle:            'idle',
  creatingProject: 'creating-project',
  dispatching:     'dispatching',
});

/* Advertising-package wizard state.
 *
 * advertising-package bundles two artifacts in one project: a paid
 * creative (image gen) AND its copy (text gen). The wizard collects
 * everything once; on submit it fans out to BOTH backends in
 * parallel, then the project detail page renders both result sets
 * behind a tab switcher.
 *
 *   size → settings → offer → images → submit
 *
 * Phase 0 (size) is the platform+ratio precondition — same shape as
 * campaign-creative, hidden from the visible "1/2/3" stepper because
 * those choices are locked before the form starts.
 *
 * Submit (dual fan-out — load-bearing design choice):
 *   1. INSERT a `projects` row with serviceType='advertising-package'.
 *   2. In parallel:
 *      • 3 image dispatches via creative-generations (async; each
 *        returns a uid; rows land via webhook ~30-60s later).
 *      • 1 copy dispatch via copywriting-generations (SYNCHRONOUS;
 *        blocks ~10-15s while 3 GPT-4o calls run server-side; returns
 *        the populated rows directly).
 *   3. Partial success is SUCCESS — if EITHER side landed any usable
 *      output, we navigate to the project detail. The two surfaces are
 *      independently valuable; refusing to ship images because copy
 *      OpenAI was rate-limited (or vice versa) would be punitive.
 *   4. Only roll back the project when BOTH sides fully failed — that's
 *      the "empty card in the list" case worth preventing.
 *
 * Why these endpoints work unchanged for advertising-package:
 *   Both /creative-generations/dispatch and /copywriting-generations/
 *   dispatch read inputs from `project.draft` and do not gate on
 *   `serviceType`. The wizard collects the union of fields both
 *   prompts need, persists it under draft.context, and the two
 *   backends pick out what each needs. Zero backend code changes
 *   were required to add this flow.
 *
 * Mirror-don't-share rule: this context deliberately doesn't share
 * the CampaignCreativeContext implementation even though the
 * navigation is identical. The submit fan-out diverges (campaign-
 * creative does 3 image variants only; this does 3 image + 3 copy),
 * so sharing would force conditionals across the provider for a
 * small DRY win. Keeping each wizard self-owned is the established
 * pattern across the four other flows. */

export const STEP_IDS = Object.freeze({
  size:     'size',
  settings: 'settings',
  offer:    'offer',
  images:   'images',
});

/* Steps shown in the visible "1/2/3" stepper. `size` is the Phase 0
 * platform+ratio pre-step and is intentionally absent. */
export const WIZARD_STEPS = Object.freeze([
  { id: STEP_IDS.settings, label: 'הגדרת קמפיין' },
  { id: STEP_IDS.offer,    label: 'מאפייני ההצעה' },
  { id: STEP_IDS.images,   label: 'תמונות' },
]);

/* Linear forward order used by `next()`. Caps at `images`; moving
 * past it will be `submit()` once wired. */
const STEP_ORDER = [STEP_IDS.size, STEP_IDS.settings, STEP_IDS.offer, STEP_IDS.images];

const EMPTY_DRAFT = Object.freeze({
  /* Phase 0 — platform + ratio. */
  platformId: null,
  ratioId: null,
  /* Step 1 — campaign settings (same shape as campaign-creative /
   * copywriting-ads so ProjectSettingsForm can render it unchanged). */
  name: '',
  goalId: null,
  natureId: null,
  conversionLocationId: null,
  audienceId: null,
  /* Step 2 — offer features (shape matches the shared
   * OfferFeaturesForm: sale type, audience temperature, item name,
   * brand tone, free-form brief). landingPageUrl is intentionally
   * absent — advertising-package hides that field
   * (showLandingPageUrl={false}), so persisting it would create dead
   * state. Topics is bundled into the same step (rendered below the
   * OfferFeaturesForm via TopicsField); current spec keeps it
   * OPTIONAL (no minimum chip count gates Continue). */
  saleType: 'product',
  audienceType: 'cold',
  itemName: '',
  offerToneIds: [],
  brief: '',
  topics: [],
  /* Step 3 — chosen image source. Single-entry array (same shape as
   * campaign-creative.images) so future multi-image support is a
   * push-not-replace. Each entry is { url, path, source, pexelsId? }
   * — url is always a Storage-backed public URL (device upload,
   * Pexels mirror, or AI-generate result all commit to the bucket
   * up front). */
  images: [],
});

const AdvertisingPackageContext = createContext(null);

export function AdvertisingPackageProvider({ onCancel, onComplete, children }) {
  const [step, setStep] = useState(STEP_IDS.size);
  const [draft, setDraft] = useState(() => ({ ...EMPTY_DRAFT }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitStage, setSubmitStage] = useState(SUBMIT_STAGE.idle);

  /* Back-stack: leaving a step pushes the leaving step so back()
   * returns there. Empty stack → back exits the wizard. */
  const historyRef = useRef([]);

  const finishSubmit = useCallback((error) => {
    setSubmitError(error ?? null);
    setSubmitStage(SUBMIT_STAGE.idle);
    setIsSubmitting(false);
  }, []);

  const goTo = useCallback((nextStep) => {
    setStep((current) => {
      if (current !== nextStep) historyRef.current.push(current);
      return nextStep;
    });
  }, []);

  const next = useCallback(() => {
    setStep((current) => {
      const idx = STEP_ORDER.indexOf(current);
      if (idx === -1 || idx >= STEP_ORDER.length - 1) return current;
      historyRef.current.push(current);
      return STEP_ORDER[idx + 1];
    });
  }, []);

  const back = useCallback(() => {
    const previous = historyRef.current.pop();
    if (previous) {
      setStep(previous);
      return;
    }
    onCancel?.();
  }, [onCancel]);

  const cancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const updateDraft = useCallback((patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  /* Build the project draft snapshot — wizard form state plus the
   * resolved Hebrew labels under `context`. Mirrors the campaign-
   * creative + copywriting flows so the two dispatch backends both
   * see the keys they expect (creative-generations reads
   * context.{product_name, description, nature_he, ...} and
   * project.draft.images[0].url; copywriting-generations also reads
   * context.* plus the topics array). landingPageUrl is hardcoded
   * empty — advertising-package's spec doesn't collect it. */
  const buildProjectDraft = useCallback(() => {
    return {
      ...draft,
      context: {
        product_name:     draft.itemName?.trim() ?? '',
        description:      draft.brief?.trim() ?? '',
        nature_he:        getCampaignNatureLabel(draft.natureId),
        location_he:      getConversionLocationLabel(draft.conversionLocationId),
        purpose_he:       getCampaignGoalLabel(draft.goalId),
        audience_display: getTargetAudienceLabel(draft.audienceId),
        platform:         PLATFORMS_BY_ID[draft.platformId]?.label ?? '',
        landing_page_url: '',
        topics:           Array.isArray(draft.topics) ? draft.topics : [],
      },
    };
  }, [draft]);

  /* One HTTP call dispatches all `count` variants — backend picks N
   * distinct ad-reference templates server-side. Mirrors campaign-
   * creative's dispatchBatch. */
  const dispatchImageBatch = useCallback(async (projectId, count) => {
    const { data, error } = await creativeGenerationsApi.dispatch({
      projectId,
      count,
    });
    if (error) {
      return { uids: [], errors: [error.message ?? 'דחיית קריאה'] };
    }
    return { uids: data?.uids ?? [], errors: data?.errors ?? [] };
  }, []);

  /* Submit terminator — dual fan-out.
   *
   * 1. Validate (active brand + product image).
   * 2. Create the projects row (serviceType='advertising-package').
   * 3. Fire image batch + copy dispatch in PARALLEL with Promise.all.
   *    Image batch is async (returns uids; rows land via webhook).
   *    Copy dispatch is sync (~10-15s; returns populated rows).
   * 4. PARTIAL success policy: if either side produced any usable
   *    output, navigate to the detail page. The detail page shows
   *    whichever sides have content and gracefully handles the empty
   *    side. Only when BOTH sides totally failed do we roll back the
   *    project to avoid leaving an empty card in the user's list.
   *
   * Failure surface: submitError carries the most actionable message
   * — preferring the image batch's first error, falling back to
   * copy's error, falling back to a generic Hebrew message. The
   * wizard surfaces this inline on step 3 so the user can retry
   * without re-walking the earlier steps. */
  const submit = useCallback(
    async ({ brand }) => {
      if (!brand?.id) {
        const err = { message: 'לא נבחר מותג פעיל' };
        finishSubmit(err);
        return { data: null, error: err };
      }

      setIsSubmitting(true);
      setSubmitError(null);

      /* Product image is optional — when draft.images is empty, the
       * dispatcher fabricates a product image server-side and the
       * copywriting prompt simply runs without a visual reference. */
      // Phase 1: create the project row.
      setSubmitStage(SUBMIT_STAGE.creatingProject);
      const projectDraft = buildProjectDraft();
      const { data: project, error: projectError } = await projectsApi.create({
        brandId: brand.id,
        draft: projectDraft,
        aspectRatio: draft.ratioId,
        name: draft.name,
        serviceType: 'advertising-package',
      });
      if (projectError || !project?.id) {
        finishSubmit(projectError ?? { message: 'יצירת הפרויקט נכשלה' });
        return { data: null, error: projectError ?? { message: 'project create failed' } };
      }

      // Phase 2: parallel dual dispatch.
      setSubmitStage(SUBMIT_STAGE.dispatching);
      const [imageResult, copyResult] = await Promise.all([
        dispatchImageBatch(project.id, VARIANTS_PER_CLICK),
        /* copywritingGenerationsApi.dispatch returns { data, error }
         * already — wrap in Promise.resolve so a thrown error from
         * inside (e.g. apiClient timeout) becomes a clean rejection
         * we can normalize. */
        Promise.resolve()
          .then(() => copywritingGenerationsApi.dispatch({ projectId: project.id }))
          .catch((err) => ({
            data: null,
            error: { message: err?.message ?? 'יצירת הקופי נכשלה' },
          })),
      ]);

      const imageUids = imageResult.uids;
      const copyVariants = Array.isArray(copyResult?.data) ? copyResult.data : [];
      const copyReadyCount = copyVariants.filter((v) => v.status === 'ready').length;

      // Both fully failed → roll back the project.
      if (imageUids.length === 0 && copyReadyCount === 0) {
        projectsApi.remove(project.id).catch((err) => {
          console.warn(
            '[advertising-package submit] orphan project rollback failed:',
            err,
          );
        });
        const firstImageError = imageResult.errors[0];
        const copyErrorMessage =
          copyResult?.error?.message ?? copyVariants[0]?.errorMessage;
        const err = {
          message:
            firstImageError ?? copyErrorMessage ?? 'יצירת התוכן נכשלה',
        };
        finishSubmit(err);
        return { data: null, error: err };
      }

      // At least partial success: navigate to the detail page.
      finishSubmit(null);
      onComplete?.({
        draft,
        projectId: project.id,
        imageUids,
        copyVariants,
      });
      return {
        data: { projectId: project.id, imageUids, copyVariants },
      };
    },
    [draft, buildProjectDraft, dispatchImageBatch, finishSubmit, onComplete],
  );

  const value = useMemo(
    () => ({
      step,
      draft,
      isSubmitting,
      submitError,
      submitStage,
      wizardSteps: WIZARD_STEPS,
      goTo,
      next,
      back,
      cancel,
      updateDraft,
      submit,
    }),
    [
      step,
      draft,
      isSubmitting,
      submitError,
      submitStage,
      goTo,
      next,
      back,
      cancel,
      updateDraft,
      submit,
    ],
  );

  return (
    <AdvertisingPackageContext.Provider value={value}>
      {children}
    </AdvertisingPackageContext.Provider>
  );
}

export function useAdvertisingPackage() {
  const ctx = useContext(AdvertisingPackageContext);
  if (!ctx) {
    throw new Error('useAdvertisingPackage must be used inside <AdvertisingPackageProvider>');
  }
  return ctx;
}
