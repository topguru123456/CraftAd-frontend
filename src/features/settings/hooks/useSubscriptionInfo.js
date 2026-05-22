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

export function useSubscriptionInfo() {
  const { user } = useAuth();
  const meta = user?.user_metadata ?? {};

  return useMemo(() => {
    const planId = meta.subscription_plan_id ?? 'starter';
    const plan = getPlanById(planId);
    const periodEnd = formatPeriodEnd(meta.subscription_current_period_end);
    const status = meta.subscription_status ?? null;

    return {
      planId,
      planName: plan?.name ?? 'Starter',
      periodEndLabel: periodEnd ?? '—',
      status,
      isCanceled: status === 'canceled',
    };
  }, [user]);
}
