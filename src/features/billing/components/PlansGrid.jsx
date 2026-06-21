import { PlanCard } from './PlanCard';
import { PLANS } from '../config/plans.config';

/* Three-card grid. RTL grid puts PLANS[0] (Pro) on the right, PLANS[2]
 * (Starter) on the left — matches the screenshot's right-to-left tier
 * ordering. On mobile collapses to a single column.
 *
 * `currentPlan` = { planId, cycle } from useCurrentPlan. A card is
 * marked current only when both fields match — toggling cycle
 * re-evaluates.
 *
 * `cancelAtPeriodEnd` + `periodEndUnix` come from useSubscriptionInfo
 * and flow only to the card that matches the current tuple. Without
 * them, a cancelled-but-still-in-grace user saw their plan marked
 * "current" with no visible indication of the pending cancellation,
 * and couldn't click to resume because the current-plan card disables
 * its CTA. The card uses them to render a grace-end banner + a
 * clickable "המשך מנוי" resume CTA in that exact case.
 */
export function PlansGrid({
  billingCycle,
  currentPlan,
  cancelAtPeriodEnd,
  periodEndUnix,
  onSelect,
  selecting,
}) {
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
            isCanceled={isCurrent && Boolean(cancelAtPeriodEnd)}
            periodEndUnix={isCurrent ? periodEndUnix : null}
            isSelecting={isSelecting}
            isLocked={isLocked && !isSelecting}
            onSelect={() => onSelect?.(plan)}
          />
        );
      })}
    </div>
  );
}
