import { supabase } from '@lib/supabase';

export const TOTAL_STEPS = 5;

export const DEFAULT_ONBOARDING_STATE = Object.freeze({
  step: 1,
  answers: {},
  completed: false,
  completedAt: null,
});

export const onboardingApi = {
  read(user) {
    return user?.user_metadata?.onboarding ?? { ...DEFAULT_ONBOARDING_STATE };
  },

  persist(state) {
    return supabase.auth.updateUser({ data: { onboarding: state } });
  },

  markCompleted(currentState) {
    const next = {
      ...currentState,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    return supabase.auth.updateUser({ data: { onboarding: next } });
  },
};
