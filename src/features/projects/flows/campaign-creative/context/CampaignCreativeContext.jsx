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

  const dispatchBatch = useCallback(async (projectId, count) => {
    const settled = await Promise.allSettled(
      Array.from({ length: count }, () =>
        creativeGenerationsApi.dispatch({ projectId }),
      ),
    );
    const uids = [];
    const errors = [];
    for (const result of settled) {
      if (result.status === 'fulfilled') {
        const { data, error } = result.value;
        if (error) errors.push(error.message ?? 'דחיית קריאה');
        else if (data?.uid) uids.push(data.uid);
      } else {
        errors.push(result.reason?.message ?? 'תקלת רשת');
      }
    }
    return { uids, errors };
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

  const submit = useCallback(
    async ({ brandId }) => {
      setIsSubmitting(true);
      setSubmitError(null);

      const productImage = draft.images?.[0];
      if (!productImage?.url) {
        const err = { message: 'יש לבחור תמונה לפני יצירת הקריאייטיב' };
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

      const { data: project, error: projectError } = await projectsApi.create({
        brandId,
        draft: buildProjectDraft(),
        aspectRatio: draft.ratioId,
        name: draft.name,
        serviceType: 'campaign-creative',
      });
      if (projectError || !project?.id) {
        const err = projectError ?? { message: 'יצירת הפרויקט נכשלה' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }

      const { uids, errors } = await dispatchBatch(project.id, VARIANTS_PER_CLICK);

      if (uids.length === 0) {
        projectsApi.remove(project.id).catch((err) => {
          console.warn('[submit] orphan project rollback failed:', err);
        });
        const err = { message: errors[0] ?? 'יצירת הקריאייטיב נכשלה' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }

      setIsSubmitting(false);
      onComplete?.({ draft, projectId: project.id, uids });
      return { data: { projectId: project.id, uids } };
    },
    [draft, dispatchBatch, buildProjectDraft, onComplete],
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
      submit,
    }),
    [step, draft, isSubmitting, submitError, goTo, next, back, cancel, updateDraft, submit],
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
