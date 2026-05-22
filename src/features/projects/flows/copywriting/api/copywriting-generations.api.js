import { apiClient } from '@lib/apiClient';

/* Copywriting-generations API client.
 *
 * Mirrors creative-generations.api shape so consumers (CopywritingContext,
 * the result page) read the same — but with a key behavioral difference:
 * `dispatch` is SYNCHRONOUS. It blocks for ~10-15s while the backend fans
 * out 3 parallel GPT-4o calls and returns the populated rows (status
 * ready / failed). No Realtime listener needed for v1 — the response
 * carries everything the result page needs to render. We can layer in
 * Realtime later if "create more" lands or latency becomes a UX concern.
 *
 * Every method returns { data, error } so call sites match the existing
 * api-client convention. */

const ok = (data) => ({ data, error: null });
const fail = (message) => ({ data: null, error: { message } });

export const copywritingGenerationsApi = {
  /* Dispatch N variants (count fixed server-side at VARIANTS_PER_DISPATCH).
   * Returns the populated rows — ready ones carry adText/framework/etc.,
   * failed ones carry errorMessage. The FE renders both. */
  async dispatch({ projectId } = {}) {
    if (!projectId) return fail('projectId is required');
    const { data, error } = await apiClient.post('/copywriting-generations/dispatch', { projectId });
    if (error) return { data: null, error };
    if (!Array.isArray(data)) return fail('שגיאה בהפעלת היצירה');
    return ok(data);
  },

  async get(id) {
    if (!id) return fail('id is required');
    const { data, error } = await apiClient.get(`/copywriting-generations/${id}`);
    if (error) return { data: null, error };
    return ok(data);
  },

  async listByProject(projectId) {
    if (!projectId) return fail('projectId is required');
    const { data, error } = await apiClient.get(`/projects/${projectId}/copywriting-generations`);
    if (error) return { data: null, error };
    return ok(data ?? []);
  },

  async remove(id) {
    if (!id) return fail('id is required');
    const { error } = await apiClient.delete(`/copywriting-generations/${id}`);
    if (error) return { data: null, error };
    return ok({ id });
  },

  /* Idempotent: caller sends the desired state. Server returns the new
   * value so the FE settles on the server's response rather than guessing. */
  async setBookmarked(id, bookmarked) {
    if (!id) return fail('id is required');
    const { data, error } = await apiClient.patch(`/copywriting-generations/${id}/bookmark`, {
      bookmarked,
    });
    if (error) return { data: null, error };
    return ok(data);
  },

  /* Manual edit of the ad text. Returns the full updated row so the
   * caller can swap it into local state without a re-fetch. */
  async updateAdText(id, adText) {
    if (!id) return fail('id is required');
    if (typeof adText !== 'string' || !adText.trim()) {
      return fail('הטקסט לא יכול להיות ריק');
    }
    const { data, error } = await apiClient.patch(`/copywriting-generations/${id}`, {
      adText,
    });
    if (error) return { data: null, error };
    return ok(data);
  },

  /* AI-refine the text in the editor. Does NOT persist — the response
   * is a preview the caller drops into local state, optionally
   * undoable, then committed via updateAdText when the user clicks
   * the modal's outer Save. Variant id is required for server-side
   * ownership scoping (so a non-owner can't burn quota on the brand's
   * OpenAI key). */
  async refine(id, currentText, instruction) {
    if (!id) return fail('id is required');
    if (typeof currentText !== 'string' || !currentText.trim()) {
      return fail('אין טקסט לעבד');
    }
    if (typeof instruction !== 'string' || !instruction.trim()) {
      return fail('הוסיפו הוראה לפני יצירה');
    }
    const { data, error } = await apiClient.post(`/copywriting-generations/${id}/refine`, {
      currentText,
      instruction,
    });
    if (error) return { data: null, error };
    if (typeof data?.refinedText !== 'string' || !data.refinedText.trim()) {
      return fail('שיפור הטקסט נכשל');
    }
    return ok(data);
  },
};

/* Variants per "create more" click. Mirrors the backend's
 * VARIANTS_PER_DISPATCH constant — kept in sync by hand because there's
 * no transport for it. If you change one, change both. */
export const VARIANTS_PER_DISPATCH = 3;
