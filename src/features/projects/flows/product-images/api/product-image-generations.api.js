import { apiClient } from '@lib/apiClient';

/* Product-image-generations API client.
 *
 * One method: dispatch. The backend fans out N parallel calls to the
 * existing GCF and returns the reserved row refs (id/projectId/status).
 * Results land asynchronously via the same webhook campaign-creative
 * uses — the rows are in the `creative_generations` table, so the
 * existing useVariantSync hook + listByProject endpoint already render
 * them.
 *
 * No list / get / delete here — those live in the shared
 * `creativeGenerationsApi` (same table). Co-locating them would
 * duplicate code without semantic gain. */

const ok = (data) => ({ data, error: null });
const fail = (message) => ({ data: null, error: { message } });

export const productImageGenerationsApi = {
  /* Kick off the parallel fan-out. Returns the array of row refs
   * immediately — backend has already reserved their uids and POSTed
   * to GCF; webhooks will flip each row from `dispatched` to
   * `ready`/`failed` as Gemini results land (~30–60s per variant).
   *
   * The caller (CopywritingContext-style submit) only needs to know:
   *   • At least one row was reserved → success (navigate to detail)
   *   • Zero rows → full failure (roll back the parent project) */
  async dispatch({ projectId } = {}) {
    if (!projectId) return fail('projectId is required');
    const { data, error } = await apiClient.post(
      '/product-image-generations/dispatch',
      { projectId },
    );
    if (error) return { data: null, error };
    if (!Array.isArray(data)) return fail('שגיאה בהפעלת היצירה');
    return ok(data);
  },
};
