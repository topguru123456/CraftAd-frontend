import { supabase } from '@lib/supabase';
import { apiClient } from '@lib/apiClient';

/** Variants API — REST via Nest; realtime via Supabase (`fromRealtime` → camelCase). */

const TABLE = 'creative_generations';

const ok = (data) => ({ data, error: null });
const fail = (message) => ({ data: null, error: { message } });

export const creativeGenerationsApi = {
  /** POST dispatch — row updates via realtime when the webhook completes. */
  async dispatch({ projectId } = {}) {
    if (!projectId) return fail('projectId is required');
    const { data, error } = await apiClient.post('/generations/dispatch', { projectId });
    if (error) return { data: null, error };
    if (!data?.uid) return fail('שגיאה בהפעלת היצירה');
    return ok({
      uid:       data.uid,
      projectId: data.projectId ?? projectId,
      status:    data.status ?? 'dispatched',
    });
  },

  async get(uid) {
    if (!uid) return fail('uid is required');
    const { data, error } = await apiClient.get(`/generations/${uid}`);
    if (error) return { data: null, error };
    return ok(withDerived(data));
  },

  async listByProject(projectId) {
    if (!projectId) return fail('projectId is required');
    const { data, error } = await apiClient.get(`/projects/${projectId}/generations`);
    if (error) return { data: null, error };
    return ok((data ?? []).map(withDerived));
  },

  async remove(uid) {
    if (!uid) return fail('uid is required');
    const { error } = await apiClient.delete(`/generations/${uid}`);
    if (error) return { data: null, error };
    return ok({ id: uid });
  },

  async setBookmarked(uid, bookmarked) {
    if (!uid) return fail('uid is required');
    const { data, error } = await apiClient.patch(
      `/generations/${uid}/bookmark`,
      { bookmarked: Boolean(bookmarked) },
    );
    if (error) return { data: null, error };
    return ok(data);
  },

  subscribeToRow(uid, { onChange, onError } = {}) {
    if (!uid) return () => {};
    return openChannel(
      `cg:row:${uid}`,
      { table: TABLE, filter: `id=eq.${uid}`, events: ['UPDATE'] },
      onChange,
      onError,
    );
  },

  subscribeToProject(projectId, { onInsert, onChange, onError } = {}) {
    if (!projectId) return () => {};
    return openChannel(
      `cg:project:${projectId}`,
      { table: TABLE, filter: `project_id=eq.${projectId}`, events: ['INSERT', 'UPDATE'] },
      (row, event) => {
        if (event === 'INSERT') onInsert?.(row);
        else onChange?.(row);
      },
      onError,
    );
  },

  async dispatchEdit({ variantId, prompt } = {}) {
    if (!variantId) return fail('variantId is required');
    if (!prompt || !prompt.trim()) return fail('prompt is required');
    const { data, error } = await apiClient.post(
      `/generations/${variantId}/edit`,
      { prompt: prompt.trim() },
    );
    if (error) return { data: null, error };
    return ok({ uid: variantId, status: data?.status ?? 'dispatched' });
  },

  async commitEdit({ variantId } = {}) {
    if (!variantId) return fail('variantId is required');
    const { data, error } = await apiClient.post(
      `/generations/${variantId}/edit/commit`,
    );
    if (error) return { data: null, error };
    return ok({ imageUrl: data?.imageUrl ?? null });
  },

  async clearEdit({ variantId } = {}) {
    if (!variantId) return fail('variantId is required');
    const { data, error } = await apiClient.post(
      `/generations/${variantId}/edit/clear`,
    );
    if (error) return { data: null, error };
    return ok({ cleared: data?.cleared === true });
  },
};

/** One Supabase channel per event — avoids `.on()` binding collisions in supabase-js. */
function openChannel(channelKey, { table, filter, events }, onEvent, onError) {
  const channels = events.map((event) => {
    const channelName = `${channelKey}:${event.toLowerCase()}:${Math.random().toString(36).slice(2, 8)}`;
    return supabase
      .channel(channelName)
      .on('postgres_changes', { event, schema: 'public', table, filter }, (payload) => {
        try {
          if (payload?.new) onEvent(fromRealtime(payload.new), event);
        } catch (err) {
          console.error('[creativeGenerationsApi] channel handler threw:', err);
          onError?.(err);
        }
      })
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[creativeGenerationsApi] ${event} channel issue:`, status, err);
          onError?.(err ?? new Error(`Realtime ${status}`));
        }
      });
  });

  return () => {
    channels.forEach((ch) => {
      try { supabase.removeChannel(ch); } catch { /* idempotent */ }
    });
  };
}

function fromRealtime(row) {
  if (!row) return null;
  return withDerived({
    id: row.id,
    projectId: row.project_id,
    userId: row.user_id,
    status: row.status,
    prompt: row.prompt ?? null,
    imageUrl: row.image_url ?? null,
    cleanImageUrl: row.clean_image_url ?? null,
    errorMessage: row.error_message ?? null,
    creativeScore: row.creative_score ?? null,
    performanceScore: row.performance_score ?? null,
    recommendations: row.recommendations ?? [],
    scoredAt: row.scored_at ?? null,
    editStatus: row.edit_status ?? null,
    editImageUrl: row.edit_image_url ?? null,
    editPrompt: row.edit_prompt ?? null,
    editErrorMessage: row.edit_error_message ?? null,
    bookmarked: Boolean(row.bookmarked),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function withDerived(row) {
  if (!row) return null;
  const imageUrl = row.imageUrl ?? null;
  const cleanImageUrl = row.cleanImageUrl ?? imageUrl;

  const creativeScore = typeof row.creativeScore === 'number' ? row.creativeScore : null;
  const performanceScore = typeof row.performanceScore === 'number' ? row.performanceScore : null;
  const conversionScore =
    creativeScore != null && performanceScore != null
      ? Math.round((creativeScore + performanceScore) / 2)
      : null;

  return {
    ...row,
    imageUrl,
    cleanImageUrl,
    creativeScore,
    performanceScore,
    conversionScore,
    bookmarked: Boolean(row.bookmarked),
    recommendations: Array.isArray(row.recommendations) ? row.recommendations : [],
  };
}

/** Signed clean-creative URL (~60s, attachment disposition). */
export async function mintCreativeDownloadUrl(variantId) {
  if (!variantId) return { data: null, error: { message: 'variantId is required' } };
  const { data, error } = await apiClient.post(
    `/downloads/creative/${variantId}`,
    {},
  );
  if (error) return { data: null, error };
  if (!data?.url) {
    return { data: null, error: { message: 'התקבלה תשובה לא תקינה מהשרת' } };
  }
  return { data, error: null };
}

export async function downloadCreative({ variantId } = {}) {
  const { data, error } = await mintCreativeDownloadUrl(variantId);
  if (error) return { ok: false, error: error.message ?? 'הורדה נכשלה' };

  const a = document.createElement('a');
  a.href = data.url;
  a.download = ''; // Safari fallback if Content-Disposition is stripped
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  return { ok: true };
}

/** Merge by id (partial patches safe); append when new. */
export function upsertVariantInList(prev, row) {
  if (!row?.id) return prev;
  const idx = prev.findIndex((v) => v.id === row.id);
  if (idx === -1) return [...prev, withDerived(row)];
  const next = [...prev];
  next[idx] = withDerived({ ...prev[idx], ...row });
  return next;
}

export function mergeVariantPatch(prev, patch) {
  if (!patch) return prev;
  if (!prev) return withDerived(patch);
  return withDerived({ ...prev, ...patch });
}

export function variantPlaceholderFromDispatch({ uid, id, projectId, status }) {
  const variantId = uid ?? id;
  return withDerived({
    id: variantId,
    projectId,
    status: status ?? 'dispatched',
    imageUrl: null,
    cleanImageUrl: null,
    errorMessage: null,
    editStatus: null,
    editImageUrl: null,
    editPrompt: null,
    editErrorMessage: null,
    creativeScore: null,
    performanceScore: null,
    recommendations: [],
    scoredAt: null,
  });
}

export function needsGenerationPoll(variant) {
  return variant?.status === 'pending' || variant?.status === 'dispatched';
}

export function needsScorePoll(variant) {
  return variant?.status === 'ready' && variant.conversionScore == null;
}

export function needsEditPoll(variant) {
  return variant?.editStatus === 'pending' || variant?.editStatus === 'dispatched';
}

export function projectNeedsPoll(variants) {
  return variants.some(
    (v) => needsGenerationPoll(v) || needsScorePoll(v) || needsEditPoll(v),
  );
}
