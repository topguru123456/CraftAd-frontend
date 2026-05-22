import { apiClient } from '@lib/apiClient';
import { requestQuotaRefresh } from '@/contexts/QuotaContext';

/* Projects API client.
 *
 * Phase 2.1: read paths go through our backend (apiClient injects the JWT).
 * Phase 2.2 will add create + the dispatch fan-out for the wizard.
 *
 * Every method returns { data, error } so existing call sites don't change.
 *
 * Quota plumbing: create() and remove() fire requestQuotaRefresh() on
 * success so QuotaProvider's cached count re-reads from the BE. Wrapping
 * the API client here (instead of touching all five wizard flow contexts
 * that call .create()) keeps the wiring in one place.
 */

const ok = (data) => ({ data, error: null });
const fail = (message) => ({ data: null, error: { message } });

export const projectsApi = {
  /* List the caller's projects, newest first.
   * Optional brandId filter narrows to one brand's projects. */
  async list({ brandId, limit } = {}) {
    const { data, error } = await apiClient.get('/projects', {
      search: { brandId, limit },
    });
    if (error) return { data: null, error };
    return ok(data ?? []);
  },

  async get(id) {
    if (!id) return fail('id is required');
    const { data, error } = await apiClient.get(`/projects/${id}`);
    if (error) return { data: null, error };
    return ok(data);
  },

  /* Hard-delete. CASCADE on creative_generations removes all variants.
   * Storage objects are not touched here — orphan-collection is a future
   * cron job. */
  async remove(id) {
    if (!id) return fail('id is required');
    const { error } = await apiClient.delete(`/projects/${id}`);
    if (error) return { data: null, error };
    requestQuotaRefresh();
    return ok({ id });
  },

  /* Patch a project. Currently only `name` is editable (per backend
   * UpdateProjectDto whitelist). Returns the full updated project
   * row so callers can replace it in local state without a follow-up
   * GET. Trims name client-side too as a defensive guard — the
   * backend trims as well, but trimming here keeps the response
   * shape predictable when the FE compares "is the name different?"
   * to decide whether to fire the PATCH at all. */
  async update(id, patch = {}) {
    if (!id) return fail('id is required');
    const body = {};
    if (typeof patch.name === 'string') {
      const trimmed = patch.name.trim();
      if (!trimmed) return fail('שם הפרויקט לא יכול להיות ריק');
      body.name = trimmed;
    }
    if (Object.keys(body).length === 0) return fail('אין מה לעדכן');

    const { data, error } = await apiClient.patch(`/projects/${id}`, body);
    if (error) return { data: null, error };
    return ok(data);
  },

  /* Create a project from the wizard snapshot. The variant-fan-out is a
   * separate step (creativeGenerationsApi.dispatch) — this just persists
   * the project row that variants reference.
   *
   * Shape: camelCase only. (An earlier version accepted both snake_case
   * and camelCase because the four wizard contexts disagreed on style;
   * the contexts are now unified on camelCase, so the dual-key
   * tolerance has been removed — extra accepted keys hide real bugs at
   * call sites that drift from the convention.) */
  async create({ brandId, draft, aspectRatio, name, serviceType } = {}) {
    if (!brandId) return fail('brandId חסר');
    if (!draft || typeof draft !== 'object') return fail('draft חסר');

    /* aspectRatio is required for image-output flows (campaign-creative,
     * product-images, video-creative). Text-output flows (copywriting)
     * omit it. Per-flow validation happens at the dispatcher, not here
     * — this client just plumbs the shape through. */
    const body = {
      brandId,
      draft,
      ...(aspectRatio && { aspectRatio }),
      ...(name !== undefined && { name }),
      ...(serviceType && { serviceType }),
    };

    const { data, error } = await apiClient.post('/projects', body);
    if (error) return { data: null, error };
    requestQuotaRefresh();
    return ok(data);
  },
};
