import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { projectsApi } from '@features/projects/api/projects.api';
import { creativeGenerationsApi } from '../api/creative-generations.api';
import {
  getCampaignGoalLabel,
  getCampaignNatureLabel,
  getConversionLocationLabel,
  getTargetAudienceLabel,
} from '@features/projects/config/project-fields.config';
import { PLATFORMS_BY_ID } from '@features/projects/config/platforms.config';
import { generateAutoProductImage } from '@features/projects/flows/shared';

/* Submit pipeline stages. Surfaced to the UI so the step can render
 * an explanatory caption while the spinner is up (auto-image generation
 * adds 10-20s before project creation; without a stage label the user
 * just sees a long opaque spinner). */
export const SUBMIT_STAGE = Object.freeze({
  idle:             'idle',
  autoProductImage: 'auto-product-image',
  creatingProject:  'creating-project',
  dispatching:      'dispatching',
});

export const STEP_IDS = Object.freeze({
  size: 'size',
  settings: 'settings',
  offer: 'offer',
  images: 'images',
});

export const WIZARD_STEPS = Object.freeze([
  { id: STEP_IDS.settings, label: 'הגדרת קמפיין' },
  { id: STEP_IDS.offer, label: 'מאפייני ההצעה' },
  { id: STEP_IDS.images, label: 'תמונות' },
]);

const STEP_ORDER = [
  STEP_IDS.size,
  STEP_IDS.settings,
  STEP_IDS.offer,
  STEP_IDS.images,
];

export const VARIANTS_PER_CLICK = 3;

const EMPTY_DRAFT = Object.freeze({
  platformId: null,
  ratioId: null,
  name: '',
  goalId: null,
  natureId: null,
  conversionLocationId: null,
  audienceId: null,
  saleType: 'product',
  audienceType: 'cold',
  itemName: '',
  offerToneIds: [],
  brief: '',
  landingPageUrl: '',
  images: [],
});

const CampaignCreativeContext = createContext(null);

export function CampaignCreativeProvider({ onCancel, onComplete, children }) {
  const [step, setStep] = useState(STEP_IDS.size);
  const [draft, setDraft] = useState(() => ({ ...EMPTY_DRAFT }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitStage, setSubmitStage] = useState(SUBMIT_STAGE.idle);
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

  /* Server-side batching: one HTTP call dispatches all `count`
   * variants. The backend picks N distinct ad-reference templates
   * for the `example` slot in one shot, so each variant in the
   * batch anchors against a different reference (per-call requests
   * couldn't coordinate that). */
  const dispatchBatch = useCallback(async (projectId, count) => {
    const { data, error } = await creativeGenerationsApi.dispatch({
      projectId,
      count,
    });
    if (error) {
      return { uids: [], errors: [error.message ?? 'דחיית קריאה'] };
    }
    return { uids: data?.uids ?? [], errors: data?.errors ?? [] };
  }, []);

  const buildProjectDraft = useCallback(() => {
    return {
      ...draft,
      context: {
        product_name: draft.itemName?.trim() ?? '',
        description: draft.brief?.trim() ?? '',
        nature_he: getCampaignNatureLabel(draft.natureId),
        location_he: getConversionLocationLabel(draft.conversionLocationId),
        purpose_he: getCampaignGoalLabel(draft.goalId),
        audience_display: getTargetAudienceLabel(draft.audienceId),
        platform: PLATFORMS_BY_ID[draft.platformId]?.label ?? '',
        landing_page_url: draft.landingPageUrl?.trim() ?? '',
      },
    };
  }, [draft]);

  /* Submit terminator.
   *
   * If the user reached this step without picking a product image,
   * we auto-generate one via the AI image endpoint before creating
   * the project, so the existing GCF dispatcher contract (which
   * requires a `product` image slot) is unchanged. The auto path is
   * the single behavior difference vs. the previous gate-and-fail
   * approach; everything downstream — project create + variant
   * dispatch — is identical.
   *
   * Brand is passed in full (not just id) because the auto-prompt
   * needs brand name + description for context. */
  const submit = useCallback(
    async ({ brand }) => {
      if (!brand?.id) {
        const err = { message: 'לא נבחר מותג פעיל' };
        finishSubmit(err);
        return { data: null, error: err };
      }

      setIsSubmitting(true);
      setSubmitError(null);

      let productImage = draft.images?.[0] ?? null;

      if (!productImage?.url) {
        setSubmitStage(SUBMIT_STAGE.autoProductImage);
        const { data, error } = await generateAutoProductImage({ draft, brand });
        if (error || !data?.url) {
          finishSubmit(
            error ?? { message: 'יצירת תמונת המוצר האוטומטית נכשלה. נסו שוב.' },
          );
          return { data: null, error: error ?? { message: 'auto-image failed' } };
        }
        productImage = data;
        updateDraft({ images: [productImage] });
      }

      setSubmitStage(SUBMIT_STAGE.creatingProject);
      const projectDraft = { ...buildProjectDraft(), images: [productImage] };
      const { data: project, error: projectError } = await projectsApi.create({
        brandId: brand.id,
        draft: projectDraft,
        aspectRatio: draft.ratioId,
        name: draft.name,
        serviceType: 'campaign-creative',
      });
      if (projectError || !project?.id) {
        finishSubmit(projectError ?? { message: 'יצירת הפרויקט נכשלה' });
        return { data: null, error: projectError ?? { message: 'project create failed' } };
      }

      setSubmitStage(SUBMIT_STAGE.dispatching);
      const { uids, errors } = await dispatchBatch(project.id, VARIANTS_PER_CLICK);

      if (uids.length === 0) {
        projectsApi.remove(project.id).catch((err) => {
          console.warn('[submit] orphan project rollback failed:', err);
        });
        const err = { message: errors[0] ?? 'יצירת הקריאייטיב נכשלה' };
        finishSubmit(err);
        return { data: null, error: err };
      }

      finishSubmit(null);
      onComplete?.({ draft, projectId: project.id, uids });
      return { data: { projectId: project.id, uids } };
    },
    [draft, dispatchBatch, buildProjectDraft, updateDraft, finishSubmit, onComplete],
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
    <CampaignCreativeContext.Provider value={value}>
      {children}
    </CampaignCreativeContext.Provider>
  );
}

export function useCampaignCreative() {
  const ctx = useContext(CampaignCreativeContext);
  if (!ctx) {
    throw new Error('useCampaignCreative must be used inside <CampaignCreativeProvider>');
  }
  return ctx;
}
