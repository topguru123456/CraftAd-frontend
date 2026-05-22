import { apiClient } from '@lib/apiClient';

/* Quota usage API.
 *
 * One endpoint: GET /quota/usage. Returns the caller's current counts
 * for brand/project/avatar AND the limits that apply under their resolved
 * plan. The BE is the source of truth for both — the FE plans.config.js
 * keeps its `limits` map for the upgrade modal's marketing copy, but the
 * runtime gate reads BE-served limits so the two never drift.
 *
 * The BE projects Infinity → null over the wire (JSON has no Infinity
 * literal). Caller-side helper `coerceLimit` maps null → Infinity so the
 * gate's "current < limit" check stays a single arithmetic comparison. */

const ok = (data) => ({ data, error: null });
const fail = (message) => ({ data: null, error: { message } });

export const usageApi = {
  async getUsage() {
    const { data, error } = await apiClient.get('/quota/usage');
    if (error) return { data: null, error };
    if (!data || typeof data !== 'object') {
      return fail('תגובה לא תקינה מהשרת');
    }
    const usage = data.usage ?? {};
    const limits = data.limits ?? {};
    return ok({
      planId: typeof data.planId === 'string' ? data.planId : 'starter',
      usage: {
        brands:    Number(usage.brands ?? 0),
        projects:  Number(usage.projects ?? 0),
        avatars:   Number(usage.avatars ?? 0),
        downloads: Number(usage.downloads ?? 0),
      },
      limits: {
        brands:    coerceLimit(limits.brands),
        projects:  coerceLimit(limits.projects),
        avatars:   coerceLimit(limits.avatars),
        downloads: coerceLimit(limits.downloads),
      },
    });
  },
};

/* JSON had `null` (BE sent Infinity → null). Map back to Infinity so the
 * in-app gate's `current < limit` arithmetic works without per-call
 * "is this unlimited?" branching. */
function coerceLimit(value) {
  if (value === null || value === undefined) return Number.POSITIVE_INFINITY;
  const n = Number(value);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}
