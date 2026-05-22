import { supabase } from '@lib/supabase';

async function unwrapFunctionError(error) {
  if (!error) return null;
  try {
    const body = await error.context?.json?.();
    if (body?.error) return body.error;
  } catch {
    /* response wasn't JSON — fall through */
  }
  try {
    const text = await error.context?.text?.();
    if (text) return text;
  } catch {
    /* ignore */
  }
  return error.message || 'Unknown function error';
}

export const trialApi = {
  async createSetupIntent() {
    const { data, error } = await supabase.functions.invoke('create-setup-intent', {
      method: 'POST',
    });

    if (error) {
      const message = await unwrapFunctionError(error);
      return { data: null, error: { message } };
    }

    return { data, error: null };
  },
};
