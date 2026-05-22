import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { projectsApi } from '@features/projects/api/projects.api';
import { creativeImagesApi } from '@features/projects/flows/campaign-creative/api/creative-images.api';
import { videoGenerationsApi } from '../api/video-generations.api';

/* Video-creative wizard state.
 *
 * Mirrors ProductImagesContext / CopywritingContext / CampaignCreative
 * so adding new flows stays consistent: provider on the outside, step
 * renderer on the inside, one step file each under `steps/`.
 *
 *   ratio → projectInfo → options → productInfo → submit
 *
 * `ratio` is the Phase 0 pre-step (1:1 / 4:5 / 9:16). Locked once the
 * user advances — switching ratio mid-flow would invalidate later
 * choices that depend on it. Doesn't appear in the visible "1/2/3"
 * stepper. `productInfo` is the terminal visible step; its Continue
 * calls `submit()` rather than `next()`.
 *
 * Submit is stubbed — wiring requires steps 2 (options) and 3
 * (product info) to know what feeds the project draft + downstream
 * video-generation pipeline. Calling submit() before they land
 * returns a clear error rather than silently doing nothing.
 */
export const STEP_IDS = Object.freeze({
  ratio:       'ratio',
  projectInfo: 'projectInfo',
  options:     'options',
  productInfo: 'productInfo',
});

/* Steps shown in the visible "1/2/3" stepper. `ratio` is the Phase 0
 * pre-step and intentionally absent — same rule as the other flows. */
export const WIZARD_STEPS = Object.freeze([
  { id: STEP_IDS.projectInfo, label: 'מידע על הפרויקט' },
  { id: STEP_IDS.options,     label: 'בחר אפשרות' },
  { id: STEP_IDS.productInfo, label: 'מידע על המוצר' },
]);

/* Linear forward order used by `next()`. `productInfo` is the
 * terminal step — `next()` on it is a no-op; submission happens via
 * `submit()` once it's wired. */
const STEP_ORDER = [
  STEP_IDS.ratio,
  STEP_IDS.projectInfo,
  STEP_IDS.options,
  STEP_IDS.productInfo,
];

const EMPTY_DRAFT = Object.freeze({
  /* Ratio pre-step */
  ratioId: null,
  /* Project-info step — what the user calls the project + free-form
   * description that anchors the downstream video brief. */
  name: '',
  description: '',
  /* Options step — which video-generation path the user picked.
   * Values mirror the option ids in OptionsStep.jsx:
   *   'image' — animate from a static product image
   *   'text'  — generate from a written script / description
   * Step 3 (productInfo) branches on this value: the description
   * input is always rendered, the image picker only when 'image'. */
  videoSourceType: null,
  /* productInfo step — the user's scene/script description for the
   * video. Same shape for both modes; the image-mode also pairs it
   * with a product reference image (below). */
  videoDescription: '',
  /* Reference image (image-mode only). Same array shape as
   * product-images so the existing upload/crop/bg-removal API and
   * adoptImage/removeImage helpers compose without translation —
   * single entry today, array leaves room for multi-reference flows
   * without a schema change later. Empty in text-mode. */
  images: [],
});

const VideoCreativeContext = createContext(null);

export function VideoCreativeProvider({ onCancel, onComplete, children }) {
  const [step, setStep] = useState(STEP_IDS.ratio);
  const [draft, setDraft] = useState(() => ({ ...EMPTY_DRAFT }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  /* Back-stack: leaving a step pushes the leaving step so back()
   * returns there. Empty stack → back exits the wizard. */
  const historyRef = useRef([]);

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

  /* Image helpers — mirror product-images' shape so the same draft
   * conventions apply across image-using flows. Adopting a new image
   * GCs the previous one from Storage so a user who uploads then
   * re-uploads (or runs crop/bg-removal) doesn't leave orphan blobs
   * in their bucket. Fire-and-forget cleanup; a failed delete leaves
   * an orphan that the future bucket-sweep job picks up. */
  const adoptImage = useCallback((entry) => {
    setDraft((prev) => {
      const previous = prev.images?.[0];
      if (previous?.url && previous.url !== entry.url) {
        creativeImagesApi.deleteCampaignUpload(previous.url).catch(() => {});
      }
      return { ...prev, images: [entry] };
    });
  }, []);

  const removeImage = useCallback(() => {
    setDraft((prev) => {
      const previous = prev.images?.[0];
      if (previous?.url) {
        creativeImagesApi.deleteCampaignUpload(previous.url).catch(() => {});
      }
      return { ...prev, images: [] };
    });
  }, []);

  /* Submit terminator.
   *
   * Two phases (mirrors product-images / copywriting submit shape):
   *   1. INSERT a `projects` row with serviceType='video-creative'.
   *      The wizard draft snapshot (with mode + description + ratio +
   *      images[0] for image-mode) goes into draft.* — the backend
   *      dispatcher reads from there.
   *   2. POST to /video-generations/dispatch. Backend reserves one
   *      pending row, POSTs to the Veo GCF, returns the row ref.
   *      The mp4 itself lands later via /webhooks/video (~1-3min).
   *
   * On full failure (no row reserved): roll back the project so the
   * user's list doesn't grow an empty card. CASCADE on
   * video_generations means any partial state from the backend is
   * cleaned up by the project delete.
   *
   * On success: fire onComplete with project id. The parent
   * (ProjectCreationPage) navigates to /app/projects/<id>; the detail
   * page picks up the row via useVideoVariants and shows the
   * "still cooking..." card until the webhook flips it to ready. */
  const submit = useCallback(
    /* `= {}` default guards against a caller invoking `submit()`
     * with no args — the validation block below still catches the
     * missing brandId and returns a clean error envelope, but
     * without the default the destructure would throw a raw
     * TypeError before any validation ran. Belt-and-suspenders
     * against the kind of "forgot to pass the arg at the call
     * site" bug that's invisible at compile time in JS. */
    async ({ brandId } = {}) => {
      setIsSubmitting(true);
      setSubmitError(null);

      if (!brandId) {
        const err = { message: 'לא נבחר מותג פעיל' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }
      if (!draft.ratioId) {
        const err = { message: 'יש לבחור גודל לפני יצירת התוכן' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }
      if (!draft.videoSourceType) {
        const err = { message: 'יש לבחור סוג מקור (טקסט או תמונה)' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }
      if (!draft.videoDescription?.trim()) {
        const err = { message: 'יש למלא תיאור לסרטון' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }
      if (draft.videoSourceType === 'image' && !draft.images?.[0]?.url) {
        const err = { message: 'יש להעלות תמונת מוצר במצב תמונה-לסרטון' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }

      /* Phase 1: create the project. Whole draft goes through —
       * backend reads videoSourceType, videoDescription, and
       * (image-mode) images[0].url from project.draft. */
      const { data: project, error: projectError } = await projectsApi.create({
        brandId,
        draft: { ...draft },
        aspectRatio: draft.ratioId,
        name: draft.name,
        serviceType: 'video-creative',
      });
      if (projectError || !project?.id) {
        const err = projectError ?? { message: 'יצירת הפרויקט נכשלה' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }

      /* Phase 2: dispatch. Single call (not 3-parallel) — Veo is too
       * expensive + too slow per unit for a fan-out pattern; the
       * user iterates on one video at a time. */
      const { data: row, error: dispatchError } =
        await videoGenerationsApi.dispatch({ projectId: project.id });

      if (dispatchError || !row?.uid) {
        /* Roll back the orphan project so the list doesn't grow an
         * empty card. CASCADE cleans up any partial row state. */
        projectsApi.remove(project.id).catch((err) => {
          console.warn('[video-creative submit] orphan project rollback failed:', err);
        });
        const err = dispatchError ?? { message: 'יצירת הסרטון נכשלה. נסו שוב.' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }

      setIsSubmitting(false);
      onComplete?.({ draft, projectId: project.id, row });
      return { data: { projectId: project.id, row } };
    },
    [draft, onComplete],
  );

  const value = useMemo(
    () => ({
      step,
      draft,
      isSubmitting,
      submitError,
      wizardSteps: WIZARD_STEPS,
      goTo,
      next,
      back,
      cancel,
      updateDraft,
      adoptImage,
      removeImage,
      submit,
    }),
    [
      step,
      draft,
      isSubmitting,
      submitError,
      goTo,
      next,
      back,
      cancel,
      updateDraft,
      adoptImage,
      removeImage,
      submit,
    ],
  );

  return (
    <VideoCreativeContext.Provider value={value}>
      {children}
    </VideoCreativeContext.Provider>
  );
}

export function useVideoCreative() {
  const ctx = useContext(VideoCreativeContext);
  if (!ctx) {
    throw new Error('useVideoCreative must be used inside <VideoCreativeProvider>');
  }
  return ctx;
}
