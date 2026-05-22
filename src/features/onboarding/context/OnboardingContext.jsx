import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@config/routes';
import { DEFAULT_ONBOARDING_STATE, TOTAL_STEPS, onboardingApi } from '../api/onboarding.api';

const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const { user, ready } = useAuth();
  const nav = useNavigate();

  const [state, setState] = useState(() => onboardingApi.read(user));
  const [isPersisting, setIsPersisting] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!ready || hydratedRef.current) return;
    setState(onboardingApi.read(user));
    hydratedRef.current = true;
  }, [ready, user]);

  const persist = useCallback(async (next) => {
    setIsPersisting(true);
    try {
      const { error } = await onboardingApi.persist(next);
      if (error) console.error('[onboarding] persist failed:', error.message);
    } finally {
      setIsPersisting(false);
    }
  }, []);

  const setAnswer = useCallback((key, value) => {
    setState((prev) => ({ ...prev, answers: { ...prev.answers, [key]: value } }));
  }, []);

  const advance = useCallback(async () => {
    if (state.step >= TOTAL_STEPS) return;
    const next = { ...state, step: state.step + 1 };
    setState(next);
    await persist(next);
  }, [state, persist]);

  const back = useCallback(async () => {
    if (state.step <= 1) return;
    const next = { ...state, step: state.step - 1 };
    setState(next);
    await persist(next);
  }, [state, persist]);

  const finishQuestionnaire = useCallback(async () => {
    await persist(state);
    nav(ROUTES.trial.root, { replace: true });
  }, [state, persist, nav]);

  const complete = useCallback(async () => {
    const next = { ...state, completed: true, completedAt: new Date().toISOString() };
    setState(next);
    await persist(next);
    nav(ROUTES.app.dashboard, { replace: true });
  }, [state, persist, nav]);

  const value = useMemo(() => ({
    currentStep: state.step,
    answers: state.answers,
    totalSteps: TOTAL_STEPS,
    isFirstStep: state.step <= 1,
    isLastStep: state.step >= TOTAL_STEPS,
    isCompleted: state.completed,
    isPersisting,
    setAnswer,
    advance,
    back,
    finishQuestionnaire,
    complete,
  }), [state, isPersisting, setAnswer, advance, back, finishQuestionnaire, complete]);

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
};
