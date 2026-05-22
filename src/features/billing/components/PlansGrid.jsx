import { PlanCard } from './PlanCard';
import { PLANS } from '../config/plans.config';

/* Three-card grid. RTL grid puts PLANS[0] (Pro) on the right, PLANS[2]
 * (Starter) on the left — matches the screenshot's right-to-left tier
 * ordering. On mobile collapses to a single column.
 *
 * `currentPlan` = { planId, cycle } from useCurrentPlan. A card is marked
 * current only when both fields match — toggling cycle re-evaluates.
 */
export function PlansGrid({ billingCycle, currentPlan, onSelect, selecting }) {
  return (
    <div
      dir="rtl"
      className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch"
    >
      {PLANS.map((plan) => {
        const isCurrent =
          plan.id === currentPlan?.planId && billingCycle === currentPlan?.cycle;
        // While ANY card is minting the checkout URL, disable all cards
        // (not just the clicked one) so a frantic user can't fire multiple
        // checkout sessions in parallel. The clicked one shows the spinner.
        const isSelecting = selecting === plan.id;
        const isLocked = selecting !== null && selecting !== undefined;

        return (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            isCurrent={isCurrent}
            isSelecting={isSelecting}
            isLocked={isLocked && !isSelecting}
            onSelect={() => onSelect?.(plan)}
          />
        );
      })}
    </div>
  );
}
