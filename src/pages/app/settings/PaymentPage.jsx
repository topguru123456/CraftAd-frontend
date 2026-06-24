import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BillingToggle,
  ManageSubscriptionButton,
  PlansGrid,
  PLANS,
  ChangePlanConfirmModal,
  TestModeBanner,
  billingApi,
  useCurrentPlan,
} from '@features/billing';
import { useSubscriptionInfo } from '@features/settings/hooks/useSubscriptionInfo';
import { requestQuotaRefresh } from '@/contexts/QuotaContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@components/ui';
import { supabase } from '@lib/supabase';
import { ROUTES } from '@config/routes';
import HeroBg from '@assets/images/pricing/hero.png';

/* /app/settings/payment — Tranzila plan picker.
 *
 * Flow (Tranzila):
 *   1. Click plan → ChangePlanConfirmModal (no Stripe Checkout, no
 *      redirect to a portal). Same plan + cycle while active is a no-op.
 *   2. Confirm → if user is canceled-pending, POST /billing/tranzila/resume
 *      first (atomic resume+change), then POST /billing/tranzila/change-plan.
 *   3. Refresh session + quota; show toast. No charge today — the next
 *      renewal at the existing period_end uses the new amount.
 *
 * Tokenless empty state: users who reached this page without going
 * through the trial flow (no tranzila_token on user_metadata) see a
 * "complete trial first" CTA. In practice OnboardingGuard routes them
 * elsewhere, but this is the defensive UI for the edge case.
 *
 * NOT in this page (vs the prior Stripe version):
 *   - ?checkout=success return handling — no external redirect now.
 *   - SubscribeConfirmModal (saved-card path) — replaced by
 *     ChangePlanConfirmModal which handles change-plan + resume.
 *   - Stripe-specific sync polling — Tranzila state is server-owned
 *     and visible after refreshSession() completes synchronously.
 */
export default function PaymentPage() {
  const nav = useNavigate();
  const toast = useToast();
  const currentPlan = useCurrentPlan();
  const info = useSubscriptionInfo();
  const [billingCycle, setBillingCycle] = useState(currentPlan.cycle);
  const [selecting, setSelecting] = useState(null); // plan.id while change-plan is in flight
  const [confirmState, setConfirmState] = useState(null);

  if (!info.hasTranzilaToken) {
    return <NoTokenEmpty onGoToTrial={() => nav(ROUTES.trial.root)} />;
  }

  const onSelectPlan = (plan) => {
    if (selecting || confirmState) return;
    /* Same plan + cycle while active = no-op. A canceled-pending user
     * picking their current plan still opens the modal — that flow
     * resumes the subscription. */
    const isSameSelection =
      plan.id === currentPlan.planId &&
      billingCycle === currentPlan.cycle &&
      !info.cancelAtPeriodEnd;
    if (isSameSelection) {
      toast.info('זהו המסלול הנוכחי שלך');
      return;
    }
    setConfirmState({
      planId: plan.id,
      cycle: billingCycle,
      needsResume: info.cancelAtPeriodEnd,
    });
  };

  const onCancelConfirm = () => {
    if (selecting) return;
    setConfirmState(null);
  };

  const onConfirmChange = async () => {
    if (!confirmState) return { error: { message: 'no plan selected' } };
    setSelecting(confirmState.planId);

    /* Resume first if needed. Two server round-trips rather than a single
     * combined endpoint — keeps each operation single-responsibility and
     * matches the BE's existing /cancel + /change-plan symmetry. The
     * window between resume and change-plan is small; if change-plan
     * fails after a successful resume, the user ends up resumed but on
     * their old plan — acceptable (they can retry the change). */
    if (confirmState.needsResume) {
      const { error: resumeErr } = await billingApi.resumeSubscription();
      if (resumeErr) {
        setSelecting(null);
        return { error: resumeErr };
      }
    }

    const { error } = await billingApi.changePlan({
      planId: confirmState.planId,
      cycle: confirmState.cycle,
    });
    if (error) {
      setSelecting(null);
      return { error };
    }

    /* Pull fresh JWT so useCurrentPlan + useSubscriptionInfo see the
     * new plan_id/cycle/cancel_at_period_end values. Refresh quota
     * cache so any limit changes (Scale → Pro etc) apply immediately. */
    await supabase.auth.refreshSession();
    requestQuotaRefresh();

    const newPlan = PLANS.find((p) => p.id === confirmState.planId);
    toast.success(
      confirmState.needsResume
        ? `המנוי הומשך והוגדר ל-${newPlan?.name ?? confirmState.planId}.`
        : `המסלול עודכן ל-${newPlan?.name ?? confirmState.planId}. החיוב הבא לפי המחיר החדש.`,
    );
    setConfirmState(null);
    setSelecting(null);
    return { data: { ok: true } };
  };

  return (
    <div
      dir="rtl"
      className="flex-1 relative bg-cover bg-center bg-no-repeat md:overflow-hidden"
      style={{ backgroundImage: `url(${HeroBg})` }}
    >
      <div className="relative mx-auto w-full max-w-[1500px] px-4 sm:px-8 lg:px-10 py-6 sm:py-8 flex flex-col gap-6 sm:gap-7 md:h-full">
        <TestModeBanner />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <ManageSubscriptionButton />
          <div className="flex-1 flex justify-center">
            <BillingToggle value={billingCycle} onChange={setBillingCycle} />
          </div>
          {/* Spacer so the toggle stays centered when the button is present. */}
          <div className="w-[140px] hidden sm:block" />
        </div>

        <PlansGrid
          billingCycle={billingCycle}
          currentPlan={currentPlan}
          cancelAtPeriodEnd={info.cancelAtPeriodEnd}
          periodEndUnix={info.periodEndUnix}
          onSelect={onSelectPlan}
          selecting={selecting}
        />
      </div>

      <ChangePlanConfirmModal
        open={confirmState !== null}
        onClose={onCancelConfirm}
        onConfirm={onConfirmChange}
        plan={confirmState ? PLANS.find((p) => p.id === confirmState.planId) : null}
        cycle={confirmState?.cycle}
        currentPlanId={currentPlan.planId}
        currentCycle={currentPlan.cycle}
        periodEndUnix={info.periodEndUnix}
        needsResume={confirmState?.needsResume}
      />
    </div>
  );
}

function NoTokenEmpty({ onGoToTrial }) {
  return (
    <div
      dir="rtl"
      className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-muted/30"
    >
      <div className="text-center max-w-md space-y-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink">
          השלמת רישום נדרשת
        </h2>
        <p className="text-base text-ink-muted leading-relaxed">
          כדי לבחור מסלול יש להזין אמצעי תשלום בתהליך הניסיון. הוספת הכרטיס
          לאימות בלבד — לא יבוצע חיוב במשך 7 ימי הניסיון.
        </p>
        <Button onClick={onGoToTrial}>התחלת ניסיון</Button>
      </div>
    </div>
  );
}
