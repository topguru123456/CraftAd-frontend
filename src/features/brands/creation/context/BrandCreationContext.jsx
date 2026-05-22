import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useBrands } from '@/contexts/BrandsContext';
import { brandsApi } from '../../api/brands.api';

/* Brand-creation wizard state.
 *
 * Modeled after OnboardingContext: one provider owns the wizard's "where
 * am I, what have I collected, where can I go next" — step components
 * just render their UI and call `next()` / `back()` / `goTo()`.
 *
 * Step IDs are namespaced strings rather than ordinals because the
 * wizard branches (manual vs auto). Once the auto fetch resolves, both
 * paths converge on the same shared step sequence:
 *
 *   chooseMethod → [auto-fetch modal] → identity → visuals → character → submit
 *   chooseMethod →                       identity → visuals → character → submit
 *
 * The auto fetch is *not* a step — it's a modal driven by `isFetching`
 * that overlays whichever step is current. Once it resolves, the wizard
 * advances to `identity` with the draft pre-filled.
 *
 * Submission is centralized in `submit()` — final brand goes through
 * BrandsContext.createBrand so the list refreshes automatically.
 */

export const STEP_IDS = Object.freeze({
  chooseMethod: 'choose-method',
  identity:     'identity',
  visuals:      'visuals',
  character:    'character',
});

/* The shared step sequence (post choose-method). Index here drives the
 * stepper UI as well as `next()`. */
export const WIZARD_STEPS = [
  { id: STEP_IDS.identity,  label: 'פרטי המותג' },
  { id: STEP_IDS.visuals,   label: 'לוגו וצבעים' },
  { id: STEP_IDS.character, label: 'אופי המותג' },
];

/* Wizard draft shape.
 *
 * Auto-fetched fields (name/description/logos/colors/...) are populated
 * by `startAuto` from the context.dev brand-retrieve payload (see
 * `brandsApi.fetchFromUrl`'s normalizer). Manual flow leaves them empty
 * for the user to fill step by step.
 *
 * `logos` and `colors` arrive as ARRAYS even though the brand record
 * eventually keeps a single `logoUrl` and (later) a small palette —
 * keeping the full upstream catalogue lets the visuals step show the
 * user every option to pick from. */
const EMPTY_DRAFT = Object.freeze({
  /* Identity step */
  name: '',
  description: '',
  slogan: '',
  /* Visuals step (next turn) */
  logoUrl: null,
  logos: [],
  colors: [],
  /* Provenance / future use */
  websiteUrl: '',
  domain: null,
  socials: [],
  industries: [],
  primaryLanguage: null,
  /* Character step — values is multi-select (string[] of ids from
   * BRAND_VALUES), tone is single-select (string id from BRAND_TONES). */
  values: [],
  tone: null,
});

const BrandCreationContext = createContext(null);

export function BrandCreationProvider({ onCancel, onComplete, children }) {
  const { createBrand } = useBrands();

  const [step, setStep] = useState(STEP_IDS.chooseMethod);
  const [flow, setFlow] = useState(null);            // 'manual' | 'auto' | null
  const [draft, setDraft] = useState(() => ({ ...EMPTY_DRAFT }));
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  /* Back-stack: any time we leave a step, push the leaving step onto the
   * stack so `back()` can return there. Branches (manual/auto) push and
   * pop along the same stack so the user always lands where they came
   * from. */
  const historyRef = useRef([]);

  const goTo = useCallback((nextStep) => {
    setStep((current) => {
      if (current !== nextStep) historyRef.current.push(current);
      return nextStep;
    });
  }, []);

  const next = useCallback(() => {
    setStep((current) => {
      const idx = WIZARD_STEPS.findIndex((s) => s.id === current);
      if (idx === -1 || idx >= WIZARD_STEPS.length - 1) return current;
      historyRef.current.push(current);
      return WIZARD_STEPS[idx + 1].id;
    });
  }, []);

  const back = useCallback(() => {
    const previous = historyRef.current.pop();
    if (previous) {
      setStep(previous);
      return;
    }
    /* No history → user is at the entry step; back exits the wizard. */
    onCancel?.();
  }, [onCancel]);

  const cancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const updateDraft = useCallback((patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  /* Manual path: skip directly to identity, leave draft empty for the
   * user to fill. */
  const startManual = useCallback(() => {
    setFlow('manual');
    historyRef.current.push(step);
    setStep(STEP_IDS.identity);
  }, [step]);

  /* Auto path: pop the loading modal, run the fetch, prefill the draft,
   * then advance to identity. On error we leave the user on whatever
   * step they were on — they can retry or pivot to manual.
   *
   * The normalized payload from `brandsApi.fetchFromUrl` already matches
   * the draft shape, so we spread it wholesale. The user's typed URL is
   * preserved separately as `websiteUrl` (the API's `domain` is the bare
   * canonical form, not necessarily what the user pasted). */
  const startAuto = useCallback(
    async (url) => {
      setFlow('auto');
      setFetchError(null);
      setIsFetching(true);
      updateDraft({ websiteUrl: url });

      const { data, error } = await brandsApi.fetchFromUrl(url);
      setIsFetching(false);

      if (error) {
        setFetchError(error);
        return { error };
      }

      updateDraft({ ...data, websiteUrl: url });
      historyRef.current.push(step);
      setStep(STEP_IDS.identity);
      return { data };
    },
    [step, updateDraft]
  );

  const dismissFetchError = useCallback(() => setFetchError(null), []);

  /* Final commit. Pass through every field the brand record cares about
   * — name, description, logo, colors, plus provenance/ industry data
   * collected along the way. The API's whitelist drops anything it
   * doesn't recognize, so adding a new draft field here is safe. */
  const submit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    const { data, error } = await createBrand({
      name: draft.name,
      description: draft.description,
      slogan: draft.slogan,
      logoUrl: draft.logoUrl,
      colors: draft.colors,
      values: draft.values,
      tone: draft.tone,
      websiteUrl: draft.websiteUrl,
      domain: draft.domain,
      socials: draft.socials,
      industries: draft.industries,
      primaryLanguage: draft.primaryLanguage,
    });
    setIsSubmitting(false);
    if (error) {
      setSubmitError(error);
      return { error };
    }
    onComplete?.(data);
    return { data };
  }, [createBrand, draft, onComplete]);

  const value = useMemo(
    () => ({
      step,
      flow,
      draft,
      isFetching,
      fetchError,
      isSubmitting,
      submitError,
      wizardSteps: WIZARD_STEPS,
      startManual,
      startAuto,
      dismissFetchError,
      goTo,
      next,
      back,
      cancel,
      updateDraft,
      submit,
    }),
    [
      step,
      flow,
      draft,
      isFetching,
      fetchError,
      isSubmitting,
      submitError,
      startManual,
      startAuto,
      dismissFetchError,
      goTo,
      next,
      back,
      cancel,
      updateDraft,
      submit,
    ]
  );

  return (
    <BrandCreationContext.Provider value={value}>
      {children}
    </BrandCreationContext.Provider>
  );
}

export function useBrandCreation() {
  const ctx = useContext(BrandCreationContext);
  if (!ctx) {
    throw new Error('useBrandCreation must be used inside <BrandCreationProvider>');
  }
  return ctx;
}
