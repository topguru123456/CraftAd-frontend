import { env } from '@config/env';
import { supabase } from '@lib/supabase';
import { triggerQuotaWall } from '@/contexts/QuotaContext';

// HTTP client for the NestJS backend.
//
// Every call attaches the current Supabase JWT as `Authorization: Bearer`.
// Returns the same { data, error } envelope as the old Supabase-based
// clients so consumers don't change shape.
//
// On 4xx/5xx: surfaces the backend's `{ error: { message } }` body as the
// error.message field. On 204: data is null. On network failure: a generic
// message.
//
// Special case: a 403 from the BE PlanLimitGuard arrives as
//   { error: 'plan_limit_reached', resource, planId, current, limit, message }
// We detect this shape and pop the QuotaLimitModal — same UX the in-app
// `runWithQuota` gate produces — so BE-rejected creates land on the same
// upgrade wall as in-app-blocked creates. The error envelope is still
// returned to the caller (so they can avoid surfacing a duplicate toast),
// but the user already sees the modal by the time they read it.

const ok = (data) => ({ data, error: null });
const fail = (message) => ({ data: null, error: { message } });

/** ngrok free tier serves an HTML interstitial to browsers (200, no CORS).
 * The `ngrok-skip-browser-warning` header bypasses it. Match `ngrok`
 * anywhere in the hostname rather than a fixed suffix list — ngrok has
 * churned free domains (ngrok.io → ngrok-free.dev → ngrok-free.app) and
 * a stale suffix list silently drops the skip header, which surfaces as
 * a confusing CORS error (the interstitial page has no ACAO header). */
function isNgrokApi(url) {
  try {
    return new URL(url).hostname.includes('ngrok');
  } catch {
    return false;
  }
}

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

async function request(method, path, { body, search } = {}) {
  const url = new URL(`${env.apiUrl}${path}`);
  if (search) {
    for (const [key, value] of Object.entries(search)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers = {
    ...(await getAuthHeader()),
    ...(body !== undefined && { 'Content-Type': 'application/json' }),
    ...(isNgrokApi(url.origin) && { 'ngrok-skip-browser-warning': 'true' }),
  };

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    return fail(err?.message ?? 'Network error');
  }

  if (response.status === 204) return ok(null);

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* non-JSON response — leave payload null */
  }

  if (!response.ok) {
    /* Nest's ForbiddenException with a structured body comes through as
     * { statusCode, error: {...the body...} } when the body is an object.
     * Detect the plan_limit_reached envelope and pop the wall through the
     * same QuotaProvider singleton the in-app gate uses. */
    const errBody = payload?.error;
    if (response.status === 403 && errBody?.error === 'plan_limit_reached') {
      const resource = typeof errBody.resource === 'string' ? errBody.resource : null;
      if (resource) triggerQuotaWall(resource);
      return fail(errBody.message ?? 'הגעת למכסת החבילה.');
    }
    const message =
      payload?.error?.message ?? `Request failed (${response.status})`;
    return fail(message);
  }

  return ok(payload);
}

export const apiClient = {
  get:    (path, options) => request('GET',    path, options),
  post:   (path, body, options) => request('POST',   path, { body, ...options }),
  patch:  (path, body, options) => request('PATCH',  path, { body, ...options }),
  delete: (path, options) => request('DELETE', path, options),
};
