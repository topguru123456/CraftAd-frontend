import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { projectsApi } from '@features/projects/api/projects.api';
import {
  getCampaignGoalLabel,
  getCampaignNatureLabel,
  getConversionLocationLabel,
  getTargetAudienceLabel,
} from '@features/projects/config/project-fields.config';
import { PLATFORMS_BY_ID } from '@features/projects/config/platforms.config';
import { getToneLabel } from '@features/brands/creation/config/character.config';
import { copywritingGenerationsApi } from '../api/copywriting-generations.api';

/* Copywriting-ads wizard state.
 *
 * Mirrors CampaignCreativeContext's shape so adding new flows stays
 * consistent: provider on the outside, step renderer on the inside,
 * one step file each under `steps/`.
 *
 *   platform → settings → offer → topics → advanced → submit
 *
 * `platform` is the Phase 0 pre-step (same role as campaign-creative's
 * ContentSizeStep) — locked once you advance, so it doesn't appear in
 * the visible "1/2/3" stepper. `advanced` is the terminal visible
 * step; its Continue button calls `submit()` rather than `next()`.
 *
 * Submit flow:
 *   1. Build the project draft snapshot (wizard form state + resolved
 *      Hebrew labels under `draft.context`, plus the advanced fields
 *      and the topics array at the draft root).
 *   2. INSERT a row in `projects` with serviceType='copywriting-ads'
 *      and no aspect_ratio (text-only).
 *   3. POST to /copywriting-generations/dispatch — backend fans out
 *      VARIANTS_PER_DISPATCH parallel GPT-4o calls and returns all
 *      rows synchronously (~10-15s). The dispatch wraps each variant
 *      in its own framework so the user sees real strategic variety.
 *   4. If every variant failed → roll back the project row (no
 *      orphans) and surface the error inline. If at least one landed
 *      → fire onComplete with the project id; the parent navigates to
 *      /app/projects/<id> where the result UI renders.
 *
 *   The label resolution lives here (not the backend) for the same
 *   reason as campaign-creative: the server stays decoupled from the
 *   wizard's frozen taxonomies — adding/renaming a campaign goal is a
 *   frontend-only change.
 */
export const STEP_IDS = Object.freeze({
  platform: 'platform',
  settings: 'settings',
  offer:    'offer',
  topics:   'topics',
  advanced: 'advanced',
});

/* Steps shown in the visible "1/2/3" stepper. `platform` is the Phase
 * 0 pre-step and intentionally absent — same rule as campaign-creative
 * (ContentSizeStep isn't in its WIZARD_STEPS either). */
export const WIZARD_STEPS = Object.freeze([
  { id: STEP_IDS.settings, label: 'הגדרת קמפיין' },
  { id: STEP_IDS.offer,    label: 'מאפייני ההצעה' },
  { id: STEP_IDS.topics,   label: 'נושאים מרכזיים' },
  { id: STEP_IDS.advanced, label: 'מתקדם' },
]);

/* Linear forward order used by `next()`. `advanced` is the terminal
 * step — `next()` on it is a no-op; submission happens via `submit()`. */
const STEP_ORDER = [
  STEP_IDS.platform,
  STEP_IDS.settings,
  STEP_IDS.offer,
  STEP_IDS.topics,
  STEP_IDS.advanced,
];

const EMPTY_DRAFT = Object.freeze({
  /* Platform pre-step */
  platformId: null,
  /* Settings step — same intake as campaign-creative's CampaignSettings */
  name: '',
  goalId: null,
  natureId: null,
  conversionLocationId: null,
  audienceId: null,
  /* Offer step — same intake as campaign-creative's OfferFeatures,
   * minus landingPageUrl (the copywriting form doesn't render it). */
  saleType: 'product',
  audienceType: 'cold',
  itemName: '',
  offerToneIds: [],
  brief: '',
  /* Topics step — list of keywords/themes the AI should focus on.
   * Optional; empty list is a valid state. */
  topics: [],
  /* Advanced step — marketing-copy primitives the LLM anchors on. */
  marketingPromise: '',
  marketingOffer:   '',
  callToAction:     '',
});

const CopywritingContext = createContext(null);

export function CopywritingProvider({ onCancel, onComplete, children }) {
  const [step, setStep] = useState(STEP_IDS.platform);
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

  /* Build the project's draft snapshot. The backend's prompt builder
   * reads `draft.context` for the resolved Hebrew labels plus the
   * advanced fields and topics array directly off the draft root. */
  const buildProjectDraft = useCallback(() => {
    return {
      ...draft,
      context: {
        product_name:     draft.itemName?.trim() ?? '',
        brief:            draft.brief?.trim() ?? '',
        sale_type:        draft.saleType ?? '',
        audience_type:    draft.audienceType ?? '',
        nature_he:        getCampaignNatureLabel(draft.natureId),
        location_he:      getConversionLocationLabel(draft.conversionLocationId),
        purpose_he:       getCampaignGoalLabel(draft.goalId),
        audience_display: getTargetAudienceLabel(draft.audienceId),
        platform:         PLATFORMS_BY_ID[draft.platformId]?.label ?? '',
        primary_tone:     (draft.offerToneIds ?? []).map(getToneLabel).filter(Boolean).join(', '),
      },
    };
  }, [draft]);

  /* Submit terminator.
   *
   * Two phases:
   *   1. INSERT a `projects` row (serviceType: 'copywriting-ads').
   *   2. Synchronously POST to /copywriting-generations/dispatch and
   *      wait for the populated rows.
   *
   * On full failure (zero variants landed): roll back the project row
   * so the user's list doesn't grow an empty card. ON DELETE CASCADE
   * cleans up any pending/failed copywriting_generations.
   *
   * On at least one success: fire onComplete with the project id. The
   * parent (ProjectCreationPage) navigates to /app/projects/<id>; the
   * wizard's lifecycle ends here. */
  const submit = useCallback(
    async ({ brandId }) => {
      setIsSubmitting(true);
      setSubmitError(null);

      if (!brandId) {
        const err = { message: 'לא נבחר מותג פעיל' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }

      /* Phase 1: create the project. No aspectRatio — text-only flow. */
      const projectDraft = buildProjectDraft();
      const { data: project, error: projectError } = await projectsApi.create({
        brandId,
        draft: projectDraft,
        name: draft.name,
        serviceType: 'copywriting-ads',
      });
      if (projectError || !project?.id) {
        const err = projectError ?? { message: 'יצירת הפרויקט נכשלה' };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }

      /* Phase 2: dispatch. Blocks ~10-15s while 3 parallel GPT-4o
       * calls run server-side. */
      const { data: variants, error: dispatchError } =
        await copywritingGenerationsApi.dispatch({ projectId: project.id });

      if (dispatchError) {
        /* Network/server-level failure — roll back the orphan. */
        projectsApi.remove(project.id).catch((err) => {
          console.warn('[copywriting submit] orphan project rollback failed:', err);
        });
        setSubmitError(dispatchError);
        setIsSubmitting(false);
        return { data: null, error: dispatchError };
      }

      const succeeded = (variants ?? []).filter((v) => v.status === 'ready');
      if (succeeded.length === 0) {
        /* Every variant failed individually — roll back, surface the
         * first row's error if we have one. */
        projectsApi.remove(project.id).catch((err) => {
          console.warn('[copywriting submit] orphan project rollback failed:', err);
        });
        const firstReason = variants?.[0]?.errorMessage ?? 'יצירת הקופי נכשלה';
        const err = { message: firstReason };
        setSubmitError(err);
        setIsSubmitting(false);
        return { data: null, error: err };
      }

      setIsSubmitting(false);
      onComplete?.({ draft, projectId: project.id, variants });
      return { data: { projectId: project.id, variants } };
    },
    [draft, buildProjectDraft, onComplete],
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
    <CopywritingContext.Provider value={value}>
      {children}
    </CopywritingContext.Provider>
  );
}

export function useCopywriting() {
  const ctx = useContext(CopywritingContext);
  if (!ctx) {
    throw new Error('useCopywriting must be used inside <CopywritingProvider>');
  }
  return ctx;
}
