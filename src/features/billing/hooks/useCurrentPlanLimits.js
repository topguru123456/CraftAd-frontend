import { useMemo } from 'react';
import { useCurrentPlan } from './useCurrentPlan';
import { getPlanById } from '../config/plans.config';

/* Returns the resolved Plan object for the user's current subscription —
 * including its `limits` map. The QuotaContext is the only intended caller
 * today, but this is the right cut-point for any future "show user their
 * cap" UI (e.g. progress bars under their brand list). */
export function useCurrentPlanLimits() {
  const { planId } = useCurrentPlan();
  return useMemo(() => getPlanById(planId), [planId]);
}
