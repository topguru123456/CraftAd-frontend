import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BillingToggle,
  ManageSubscriptionButton,
  PlansGrid,
  PLANS,
  SubscribeConfirmModal,
  billingApi,
  useCurrentPlan,
} from '@features/billing';
import { requestQuotaRefresh } from '@/contexts/QuotaContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@lib/supabase';
import HeroBg from '@assets/images/pricing/hero.png';

/* /app/settings/payment
 *
 * Two-stage subscribe flow:
 *
 *   1. Click plan → POST /billing/checkout — BE checks if user has a
 *      saved payment method.
 *        kind=confirm  → open in-app SubscribeConfirmModal (saved-card
 *                        path; no second card collection)
 *        kind=redirect → window.location.assign(stripeCheckoutUrl)
 *                        (no PM on file; Stripe collects card)
 *
 *   2. From the confirm modal: user clicks "אישור" → POST /billing/subscribe
 *      creates the Subscription via API using the saved card. Webhook
 *      writes user_metadata.subscription_* a moment later. We show a
 *      success toast and close the modal — the UI reflects the new plan
 *      automatically on the next render (useCurrentPlan picks up the
 *      metadata change via Supabase's session refresh).
 *
 * The real source of truth for "did the subscribe land" is the user's
 * subscription_plan_id metadata, written by the Stripe webhook — never
 * the Checkout query param or the modal close. */
export default function PaymentPage() {
  const currentPlan = useCurrentPlan();
  const [billingCycle, setBillingCycle] = useState(currentPlan.cycle);
  const [selecting, setSelecting] = useState(null); // plan.id while preview is in flight
  const [selectError, setSelectError] = useState(null);
  const [confirmState, setConfirmState] = useState(null); // { plan, cycle, card } when modal is open
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Stripe Checkout redirected back. Three things have to happen for the
  // UI to reflect the new plan, in this exact order:
  //   1. POST /billing/sync — BE queries Stripe for the customer's current
  //      sub and writes user_metadata.subscription_*. The webhook IS the
  //      eventual writer, but webhooks may be missing/unwired/delayed, so
  //      sync gives us a deterministic "land it now" path.
  //   2. supabase.auth.refreshSession() — the FE's cached JWT carries
  //      user_metadata; without refreshing, useCurrentPlan keeps reading
  //      the pre-subscribe values for up to an hour. This pulls a fresh
  //      JWT so the new metadata becomes visible.
  //   3. requestQuotaRefresh() — usage counts may shift (limits changed
  //      → already-existing rows might now be over/under, ManageSubscription
  //      shows accurate state).
  //
  // We do this regardless of whether the webhook is configured. If both
  // paths fire, the inline sync wins and the webhook is a no-op overwrite
  // with identical values.
  useEffect(() => {
    const checkoutResult = searchParams.get('checkout');
    if (!checkoutResult) return;

    if (checkoutResult === 'success') {
      (async () => {
        let syncResult = null;
        let syncError = null;
        for (let attempt = 0; attempt < 4; attempt += 1) {
          const { data, error } = await billingApi.sync();
          if (error) {
            syncError = error;
            break;
          }
          syncResult = data;
          if (data?.found) break;
          await new Promise((r) => setTimeout(r, 1500));
        }

        if (syncError) {
          toast.error(
            'הרכישה הושלמה ב-Stripe, אך סנכרון המסלול נכשל. נסו לרענן את העמוד.',
          );
          return;
        }

        await supabase.auth.refreshSession();
        requestQuotaRefresh();

        if (!syncResult?.found) {
          toast.warning(
            'התשלום התקבל. המסלול עדיין מתעדכן — רעננו את העמוד בעוד כמה שניות.',
          );
          return;
        }

        toast.success(
          `המסלול ${syncResult.planId} פעיל! הניסיון של 7 ימים החל — לא יבוצע חיוב היום.`,
        );
      })();
    } else if (checkoutResult === 'cancelled') {
      toast.info('הרכישה בוטלה. ניתן לחזור ולנסות שוב בכל עת.');
    }

    const next = new URLSearchParams(searchParams);
    next.delete('checkout');
    next.delete('session_id');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, toast]);

  const onSelectPlan = async (plan) => {
    if (selecting) return;
    setSelecting(plan.id);
    setSelectError(null);

    const { data, error } = await billingApi.previewCheckout({
      planId: plan.id,
      cycle: billingCycle,
    });

    if (error) {
      setSelectError(error.message ?? 'פתיחת התשלום נכשלה. נסו שוב.');
      setSelecting(null);
      return;
    }

    if (data.kind === 'confirm') {
      // Saved-card path — open in-app confirmation modal. selecting stays
      // set to keep the card visually locked while the modal is open.
      setConfirmState({ plan, cycle: billingCycle, card: data.card });
      return;
    }

    if (data.kind === 'redirect') {
      // No PM on file — let Stripe Checkout collect a card. The redirect
      // navigates away before this function returns.
      window.location.assign(data.url);
      return;
    }

    setSelectError('תגובה לא צפויה מהשרת.');
    setSelecting(null);
  };

  const onCancelConfirm = () => {
    setConfirmState(null);
    setSelecting(null);
  };

  // Called from inside the modal. The modal awaits the result so it can
  // surface an error inline without us re-opening it; on success it
  // shows its spinner until we close it via setConfirmState(null).
  //
  // The BE's subscribeWithSavedCard already wrote user_metadata inline
  // (no webhook dependency), so we only need to refresh the cached JWT
  // and the quota counts here — no extra sync call.
  const onConfirmSubscribe = async () => {
    if (!confirmState) return { error: { message: 'no plan selected' } };
    const { data, error } = await billingApi.subscribe({
      planId: confirmState.plan.id,
      cycle: confirmState.cycle,
    });
    if (error) return { error };

    /* Pull a fresh JWT so user_metadata.subscription_plan_id (just
     * written by the BE) becomes visible to useCurrentPlan. Without
     * this the cached JWT keeps showing the pre-subscribe plan for up
     * to an hour. Quota refresh recomputes the gate against the new
     * limits. */
    await supabase.auth.refreshSession();
    requestQuotaRefresh();

    toast.success(
      `המסלול ${confirmState.plan.name} פעיל! הניסיון של 7 ימים החל — לא יבוצע חיוב היום.`,
    );
    setConfirmState(null);
    setSelecting(null);
    return { data };
  };

  return (
    /* Full-bleed pricing hero — see component history for the rationale
       on the mobile-vs-desktop overflow behaviour below. */
    <div
      dir="rtl"
      className="flex-1 relative bg-cover bg-center bg-no-repeat md:overflow-hidden"
      style={{ backgroundImage: `url(${HeroBg})` }}
    >
      <div className="relative mx-auto w-full max-w-[1500px] px-4 sm:px-8 lg:px-10 py-6 sm:py-8 flex flex-col gap-6 sm:gap-7 md:h-full">
        {/* Top row: cycle toggle centered, "manage subscription" on the
            RTL end (visual left) for users who already have a plan. */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <ManageSubscriptionButton />
          <div className="flex-1 flex justify-center">
            <BillingToggle value={billingCycle} onChange={setBillingCycle} />
          </div>
          {/* Spacer so the toggle stays centered when the button is present. */}
          <div className="w-[140px] hidden sm:block" />
        </div>

        {selectError && (
          <p className="text-sm text-danger text-center">{selectError}</p>
        )}

        <PlansGrid
          billingCycle={billingCycle}
          currentPlan={currentPlan}
          onSelect={onSelectPlan}
          selecting={selecting}
        />
      </div>

      {/* Pull the latest PLANS entry by id so the modal always renders
          against the canonical plan config (rather than a stale prop). */}
      <SubscribeConfirmModal
        open={confirmState !== null}
        onClose={onCancelConfirm}
        onConfirm={onConfirmSubscribe}
        card={confirmState?.card ?? null}
        plan={confirmState ? PLANS.find((p) => p.id === confirmState.plan.id) : null}
        cycle={confirmState?.cycle}
      />
    </div>
  );
}
