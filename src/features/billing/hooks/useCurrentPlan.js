import { useAuth } from '@features/auth/hooks/useAuth';

/* Resolves the user's current subscription tuple (planId + cycle).
 *
 * Source of truth: `user.user_metadata.subscription_plan_id` and
 * `subscription_cycle`. Defaults to monthly Starter — that's the plan
 * onboarding signs everyone up on, so a freshly-onboarded user sees the
 * right active card before any plan-change webhook has written metadata.
 *
 * When the Stripe webhook is wired in to update user_metadata after a
 * successful subscription change, this hook needs no change — it'll
 * surface the new tuple automatically through Supabase's session refresh.
 */
export function useCurrentPlan() {
  const { user } = useAuth();
  const meta = user?.user_metadata ?? {};

  return {
    planId: meta.subscription_plan_id ?? 'starter',
    cycle: meta.subscription_cycle ?? 'monthly',
  };
}
