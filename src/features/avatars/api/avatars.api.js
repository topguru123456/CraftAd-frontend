import { apiClient } from '@lib/apiClient';

/* Avatars API client.
 *
 * Sub-resource of brand: list + create are nested under
 * /brands/:brandId/avatars. Get / patch / delete / regenerate are
 * flat under /avatars/:id since avatar ids are globally unique.
 *
 * Every method returns `{ data, error }` so callers don't fork on
 * shape. Avatar create is a slow request — backend orchestrates
 * GPT-4o (~5-10s) then Gemini (~15-30s) — so callers should expect
 * up to ~40s wall-clock and show loading state for the duration. */

const ok = (data) => ({ data, error: null });
const fail = (message) => ({ data: null, error: { message } });

export const avatarsApi = {
  async listByBrand(brandId) {
    if (!brandId) return fail('brandId is required');
    const { data, error } = await apiClient.get(`/brands/${brandId}/avatars`);
    if (error) return { data: null, error };
    return ok(Array.isArray(data) ? data : []);
  },

  async create(brandId) {
    if (!brandId) return fail('brandId is required');
    const { data, error } = await apiClient.post(
      `/brands/${brandId}/avatars`,
      {},
    );
    if (error) return { data: null, error };
    if (!data?.id) return fail('יצירת האווטאר נכשלה');
    return ok(data);
  },

  async get(id) {
    if (!id) return fail('id is required');
    const { data, error } = await apiClient.get(`/avatars/${id}`);
    if (error) return { data: null, error };
    return ok(data);
  },

  async update(id, patch = {}) {
    if (!id) return fail('id is required');
    const { data, error } = await apiClient.patch(`/avatars/${id}`, patch);
    if (error) return { data: null, error };
    return ok(data);
  },

  async regeneratePortrait(id) {
    if (!id) return fail('id is required');
    const { data, error } = await apiClient.post(
      `/avatars/${id}/regenerate-portrait`,
      {},
    );
    if (error) return { data: null, error };
    return ok(data);
  },

  async remove(id) {
    if (!id) return fail('id is required');
    const { error } = await apiClient.delete(`/avatars/${id}`);
    if (error) return { data: null, error };
    return ok({ id });
  },
};
