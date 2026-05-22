import axios from 'axios';
import { env } from '@config/env';
import { supabase } from '@lib/supabase';
import { ROUTES } from '@config/routes';

export const http = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') window.location.href = ROUTES.auth.signIn;
    }
    return Promise.reject(error);
  }
);
