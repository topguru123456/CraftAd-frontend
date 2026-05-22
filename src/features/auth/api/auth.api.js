import { supabase } from '@lib/supabase';
import { ROUTES } from '@config/routes';

const origin = () => (typeof window !== 'undefined' ? window.location.origin : '');

export const authApi = {
  signIn: ({ email, password }) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: ({ email, password }) =>
    supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin()}${ROUTES.app.dashboard}` },
    }),

  signInWithGoogle: () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin()}${ROUTES.app.dashboard}` },
    }),

  signOut: () => supabase.auth.signOut(),

  forgotPassword: (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin()}${ROUTES.auth.resetPassword}`,
    }),

  updatePassword: (password) =>
    supabase.auth.updateUser({ password }),

  getSession: () => supabase.auth.getSession(),
};
