import { useMemo } from 'react';
import { useAuth } from '@features/auth/hooks/useAuth';
import { getPlanById } from '@features/billing/config/plans.config';

function formatPeriodEnd(unixSeconds) {
  if (!unixSeconds) return null;
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date);
}

/* Subscription summary derived from user_metadata. Used by the settings
 * page section + the in-app management modal.
 *
 * Provider-agnostic — both Stripe and Tranzila write the same
 * subscription_* keys via SubscriptionSyncService. Tranzila-specific
 * fields (tranzila_card_last4, cancel_at_period_end) are surfaced for
 * the management modal; the settings section ignores them when they
 * aren't relevant. */
export function useSubscriptionInfo() {
  const { user } = useAuth();
  const meta = user?.user_metadata ?? {};

  return useMemo(() => {
    const planId = meta.subscription_plan_id ?? 'starter';
    const plan = getPlanById(planId);
    const periodEndUnix =
      typeof meta.subscription_current_period_end === 'number' &&
      Number.isFinite(meta.subscription_current_period_end)
        ? meta.subscription_current_period_end
        : null;
    const periodEnd = formatPeriodEnd(periodEndUnix);
    const status = meta.subscription_status ?? null;
    const cancelAtPeriodEnd = meta.cancel_at_period_end === true;
    const cardLast4 =
      typeof meta.tranzila_card_last4 === 'string' ? meta.tranzila_card_last4 : null;

    return {
      planId,
      planName: plan?.name ?? 'Starter',
      periodEndUnix,
      periodEndLabel: periodEnd ?? '—',
      status,
      isCanceled: status === 'canceled',
      cancelAtPeriodEnd,
      cardLast4,
    };
  }, [user]);
}
