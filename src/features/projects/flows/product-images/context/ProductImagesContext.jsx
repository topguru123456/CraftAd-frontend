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
import { productImageGenerationsApi } from '../api/product-image-generations.api';

/* Product-images wizard state.
 *
 * Mirrors CopywritingContext / CampaignCreativeContext so adding new
 * flows stays consistent: provider on the outside, step renderer on
 * the inside, one step file each under `steps/`.
 *
 *   ratio → customization → upload → submit
 *
 * `ratio` is the Phase 0 pre-step (same role as campaign-creative's
 * ContentSizeStep). Locked once the user advances — switching ratio
 * mid-flow would invalidate the user's product image upload, so it
 * sits before the form begins. Doesn't appear in the visible
 * "1/2" stepper. `upload` is the terminal visible step; its Continue
 * button calls `submit()` rather than `next()`.
 *
 * Submit today creates the project row only — image-generation
 * dispatch is a planned follow-up (Pebblely-style upstream isn't
 * wired yet). The submit therefore goes:
 *   1. Validate aspect + image presence
 *   2. INSERT `projects` row (serviceType: 'product-images')
 *   3. Surface a clear "pipeline pending" error and roll back so
 *      the user's list doesn't fill with empty cards
 * Once the backend lands, swap step 3 for the dispatch fan-out (same
 * shape as CopywritingContext.submit).
 */
export const STEP_IDS = Object.freeze({
  ratio:         'ratio',
  customization: 'customization',
  upload:        'upload',
});

/* Steps shown in the visible "1/2" stepper. `ratio` is the Phase 0
 * pre-step and intentionally absent — same rule as the other flows. */
export const WIZARD_STEPS = Object.freeze([
  { id: STEP_IDS.customization, label: 'התאמה אישית' },
  { id: STEP_IDS.upload,        label: 'העלאת מוצר' },
]);

/* Linear forward order used by `next()`. `upload` is the terminal
 * step — `next()` on it is a no-op; submission happens via `submit()`. */
const STEP_ORDER = [
  STEP_IDS.ratio,
  STEP_IDS.customization,
  STEP_IDS.upload,
];

const EMPTY_DRAFT = Object.freeze({
  /* Ratio pre-step */
  ratioId: null,
  /* Customization step — name + product context the AI uses to ground
   * the generated product images. */
  name: '',
  productName: '',
  imageDescription: '',
  /* Upload step — same shape as campaign-creative's draft.images: an
   * array of { url, path, source } records. Single entry today
   * (the product reference); the array shape keeps the door open for
   * multi-reference flows without a schema change. */
  images: [],
});

const ProductImagesContext = createContext(null);

export function ProductImagesProvider({ onCancel, onComplete, children }) {
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

  /* Build the project draft snapshot. The downstream image-generation
   * pipeline (when wired) will read product context + the reference
   * image off here. Resolved Hebrew labels under `context` follow the
   * same convention as the other flows so a future shared dispatcher
   * can read across them. */
  const buildProjectDraft = useCallback(() => {
    return {
      ...draft,
      context: {
        product_name: draft.productName?.trim() ?? '',
        description: draft.imageDescription?.trim() ?? '',
      },
    };
  }, [draft]);

  /* Submit terminator.
   *
   * Two phases:
   *   1. INSERT a `projects` row (serviceType: 'product-images') with
   *      the wizard draft so the GCF dispatcher can read the product
   *      image, ratio, and prompt inputs back from one place.
   *   2. POST to /product-image-generations/dispatch — backend fans
   *      out N parallel calls to the GCF, returns the reserved row
   *      refs. Results land asynchronously via the existing creative
   *      webhook (no Realtime listener needed here — the detail page's
   *      useVariantSync handles the live update).
   *
   * On full failure (zero rows reserved): roll back the project row
   * so the user's list doesn't grow an empty card. CASCADE on
   * creative_generations means any partially-reserved rows are cleaned
   * up by the project delete.
   *
   * On at least one row reserved: fire onComplete with the project id.
   * The parent (ProjectCreationPage) navigates to /app/projects/<id>;
   * the detail page renders the variants as they land via webhook. */
  const submit = useCallback(
    async ({ brandId }) => {
      setIsSubmitting(true);
      setSubmitError(null);

      const productImage = draft.images?.[0];
      if (!productImage?.url) {
        const err = { message: 'יש להעלות תמונת מוצר לפני יצירת התוכן' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }
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

      /* Phase 1: create the project. */
      const projectDraft = buildProjectDraft();
      const { data: project, error: projectError } = await projectsApi.create({
        brandId,
        draft: projectDraft,
        aspectRatio: draft.ratioId,
        name: draft.name,
        serviceType: 'product-images',
      });
      if (projectError || !project?.id) {
        const err = projectError ?? { message: 'יצירת הפרויקט נכשלה' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }

      /* Phase 2: dispatch. Backend fans out 3 parallel GCF calls and
       * returns the row refs; we don't wait for the actual Gemini
       * results (those land later via webhook). */
      const { data: rows, error: dispatchError } =
        await productImageGenerationsApi.dispatch({ projectId: project.id });

      if (dispatchError || !Array.isArray(rows) || rows.length === 0) {
        /* Full failure — roll back the orphan project. CASCADE cleans
         * up any partial rows the backend may have managed to
         * reserve. Fire-and-forget; even if the rollback fails the
         * list page filters zero-variant projects client-side. */
        projectsApi.remove(project.id).catch((err) => {
          console.warn('[product-images submit] orphan project rollback failed:', err);
        });
        const err = dispatchError ?? {
          message: 'יצירת תמונות המוצר נכשלה. נסו שוב.',
        };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }

      /* Success path. The parent's onComplete navigates to
       * /app/projects/<id>; the detail page picks up the rows via
       * useVariantSync + Realtime as they flip pending → ready. */
      setIsSubmitting(false);
      onComplete?.({ draft, projectId: project.id, rows });
      return { data: { projectId: project.id, rows } };
    },
    [draft, buildProjectDraft, onComplete],
  );

  /* Image helpers. Adopting a new image GCs the previous one from
   * Storage so the user's bucket doesn't grow with abandoned uploads
   * across crop + re-upload cycles. Fire-and-forget — a failed
   * delete leaves an orphan blob which the future cleanup job will
   * sweep. */
  const adoptImage = useCallback(async (entry) => {
    const previous = draft.images?.[0];
    setDraft((prev) => ({ ...prev, images: [entry] }));
    if (previous?.url && previous.url !== entry.url) {
      creativeImagesApi.deleteCampaignUpload(previous.url).catch(() => {});
    }
  }, [draft.images]);

  const removeImage = useCallback(async () => {
    const previous = draft.images?.[0];
    setDraft((prev) => ({ ...prev, images: [] }));
    if (previous?.url) {
      creativeImagesApi.deleteCampaignUpload(previous.url).catch(() => {});
    }
  }, [draft.images]);

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
    [step, draft, isSubmitting, submitError, goTo, next, back, cancel, updateDraft, adoptImage, removeImage, submit],
  );

  return (
    <ProductImagesContext.Provider value={value}>
      {children}
    </ProductImagesContext.Provider>
  );
}

export function useProductImages() {
  const ctx = useContext(ProductImagesContext);
  if (!ctx) {
    throw new Error('useProductImages must be used inside <ProductImagesProvider>');
  }
  return ctx;
}
