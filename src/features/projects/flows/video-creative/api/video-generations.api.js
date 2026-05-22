import { apiClient } from '@lib/apiClient';

/* Video-generations API client.
 *
 * Single-dispatch shape (not 3-parallel like the image/copywriting
 * flows). The backend reserves one pending row, POSTs to the Veo
 * GCF, and returns the row ref. The actual mp4 lands later via the
 * /webhooks/video callback — the FE polls / Realtime-subscribes for
 * the status flip.
 *
 * No bookmark / edit / refine methods today — video v1 is "generate
 * → view → keep or delete". Edit/regenerate can land here later
 * without changing this surface. */

const ok = (data) => ({ data, error: null });
const fail = (message) => ({ data: null, error: { message } });

export const videoGenerationsApi = {
  /* Kick off the single video generation. Returns immediately after
   * the backend POSTs to the GCF — the row is `dispatched` and the
   * mp4 lands later. Caller (VideoCreativeContext.submit) treats a
   * `dispatched` response as success and navigates to the detail
   * page where the user watches the row flip to `ready`. */
  async dispatch({ projectId } = {}) {
    if (!projectId) return fail('projectId is required');
    const { data, error } = await apiClient.post('/video-generations/dispatch', {
      projectId,
    });
    if (error) return { data: null, error };
    if (!data?.uid) return fail('שגיאה בהפעלת היצירה');
    return ok({
      uid: data.uid,
      projectId: data.projectId ?? projectId,
      status: data.status ?? 'dispatched',
    });
  },

  async get(id) {
    if (!id) return fail('id is required');
    const { data, error } = await apiClient.get(`/video-generations/${id}`);
    if (error) return { data: null, error };
    return ok(data);
  },

  async listByProject(projectId) {
    if (!projectId) return fail('projectId is required');
    const { data, error } = await apiClient.get(
      `/projects/${projectId}/video-generations`,
    );
    if (error) return { data: null, error };
    return ok(data ?? []);
  },

  async remove(id) {
    if (!id) return fail('id is required');
    const { error } = await apiClient.delete(`/video-generations/${id}`);
    if (error) return { data: null, error };
    return ok({ id });
  },
};
