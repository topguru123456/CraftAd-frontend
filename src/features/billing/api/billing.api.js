import { apiClient } from '@lib/apiClient';

/* Billing API client.
 *
 * Three server-side endpoints:
 *
 *   POST /billing/checkout  — returns a discriminated preview:
 *                              { kind: 'confirm', card }  (saved-card path)
 *                              { kind: 'redirect', url } (no PM on file)
 *                              The FE branches: confirm → show in-app
 *                              modal then call subscribe(); redirect →
 *                              window.location.assign(url) to Stripe.
 *
 *   POST /billing/subscribe — only called after the FE confirms the
 *                              modal. Creates the Subscription via the
 *                              Stripe API using the saved card.
 *
 *   POST /billing/portal    — opens the Stripe Customer Portal (manage
 *                              subscription, change card, cancel, etc).
 *
 * All return `{ data, error }` so callers don't fork on shape. The two
 * `redirectTo*` helpers are convenience wrappers that perform window.
 * location.assign on success (so they never resolve with data when the
 * redirect succeeds — the navigation kicks in first). */

const ok = (data) => ({ data, error: null });

export const billingApi = {
  /* Preview a subscribe action. Returns either a confirm payload (with
   * the saved card so the FE can show the in-app modal) or a redirect
   * URL (for the no-PM path that falls back to Stripe Checkout). */
  async previewCheckout({ planId, cycle }) {
    if (!planId) return { data: null, error: { message: 'planId is required' } };
    if (!cycle) return { data: null, error: { message: 'cycle is required' } };
    const { data, error } = await apiClient.post('/billing/checkout', { planId, cycle });
    if (error) return { data: null, error };
    if (!data?.kind) {
      return { data: null, error: { message: 'התקבלה תשובה לא תקינה מהשרת' } };
    }
    return ok(data);
  },

  /* Confirm-and-subscribe with the saved card. Should be called after
   * previewCheckout returned kind=confirm and the user accepted in the
   * SubscribeConfirmModal. */
  async subscribe({ planId, cycle }) {
    if (!planId) return { data: null, error: { message: 'planId is required' } };
    if (!cycle) return { data: null, error: { message: 'cycle is required' } };
    const { data, error } = await apiClient.post('/billing/subscribe', { planId, cycle });
    if (error) return { data: null, error };
    if (!data?.subscriptionId) {
      return { data: null, error: { message: 'התקבלה תשובה לא תקינה מהשרת' } };
    }
    return ok(data);
  },

  /* POST /billing/sync — refresh user_metadata.subscription_* from Stripe.
   *
   * The webhook is the natural primary writer, but Stripe drops events
   * sometimes and dev environments often don't have the webhook wired
   * up at all. Calling sync after a Checkout return (or as a "refresh
   * subscription" button) guarantees the FE sees current state without
   * depending on webhook delivery.
   *
   * Returns `{ found, planId, cycle, status, subscriptionId }`. found=false
   * means no Stripe subscription exists for this customer — metadata was
   * cleared accordingly. */
  async finalizePaymentMethod({ paymentMethodId } = {}) {
    const { data, error } = await apiClient.post('/billing/finalize-payment-method', {
      ...(paymentMethodId ? { paymentMethodId } : {}),
    });
    if (error) return { data: null, error };
    return ok(data);
  },

  async sync() {
    const { data, error } = await apiClient.post('/billing/sync', {});
    if (error) return { data: null, error };
    return ok(data);
  },

  async listInvoices() {
    const { data, error } = await apiClient.get('/billing/invoices');
    if (error) return { data: null, error };
    return ok(Array.isArray(data) ? data : []);
  },

  /* POST /billing/portal — Stripe-hosted upgrade/downgrade/cancel UI. */
  async createPortal() {
    const { data, error } = await apiClient.post('/billing/portal', {});
    if (error) return { data: null, error };
    if (!data?.url) {
      return { data: null, error: { message: 'התקבלה תשובה לא תקינה מהשרת' } };
    }
    return ok(data);
  },

  async redirectToPortal() {
    const { data, error } = await this.createPortal();
    if (error) return { error };
    window.location.assign(data.url);
    return { error: null };
  },

  /* --- Tranzila classic flow -------------------------------------
   *
   * POST /billing/tranzila/handshake — mint an iframe session. Returns
   * { iframeUrl, fields, expiresAt }. The FE renders a hidden form
   * with action=iframeUrl + target="<iframe-name>" + the fields as
   * hidden inputs, then auto-submits. See TranzilaIframe component. */
  async initIframeSession({ planId, cycle, kind }) {
    if (!planId) return { data: null, error: { message: 'planId is required' } };
    if (!cycle)  return { data: null, error: { message: 'cycle is required' } };
    if (!kind)   return { data: null, error: { message: 'kind is required' } };
    const { data, error } = await apiClient.post('/billing/tranzila/handshake', {
      planId,
      cycle,
      kind,
    });
    if (error) return { data: null, error };
    if (!data?.iframeUrl || !data?.fields) {
      return { data: null, error: { message: 'התקבלה תשובה לא תקינה מהשרת' } };
    }
    return ok(data);
  },

  /* POST /billing/tranzila/cancel — grace-cancel until period end. */
  async cancelSubscription() {
    const { data, error } = await apiClient.post('/billing/tranzila/cancel', {});
    if (error) return { data: null, error };
    return ok(data);
  },

  /* POST /billing/tranzila/resume — undo a pending cancellation. */
  async resumeSubscription() {
    const { data, error } = await apiClient.post('/billing/tranzila/resume', {});
    if (error) return { data: null, error };
    return ok(data);
  },

  /* POST /billing/tranzila/change-plan — applies on next renewal. */
  async changePlan({ planId, cycle }) {
    if (!planId) return { data: null, error: { message: 'planId is required' } };
    if (!cycle)  return { data: null, error: { message: 'cycle is required' } };
    const { data, error } = await apiClient.post('/billing/tranzila/change-plan', {
      planId,
      cycle,
    });
    if (error) return { data: null, error };
    return ok(data);
  },
};
