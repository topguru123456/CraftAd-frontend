import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@features/auth/hooks/useAuth';
import { useCurrentPlanLimits } from '@features/billing';
import { usageApi } from '@features/billing/api/usage.api';
import { QuotaLimitModal } from '@features/billing/components/QuotaLimitModal';

/* Quota guard.
 *
 * Three responsibilities, all behind a single context so the upgrade
 * modal stays a singleton:
 *
 *   1. Source-of-truth for current usage. Fetches GET /quota/usage on
 *      mount and after any mutation that changes a tracked count
 *      (via the exposed refresh()). BE-served counts are authoritative
 *      — local guesses ("we just created a brand, increment by 1") are
 *      avoided because they get out of sync with delete flows, race
 *      conditions, and admin operations.
 *
 *   2. Imperative guard for in-app actions. `runWithQuota('brands', fn)`
 *      compares the cached count to the limit and either fires the
 *      action or opens the upgrade modal. This is the FAST path —
 *      no network call before the user clicks. The BE @PlanLimit guard
 *      is the security backstop for direct-API abuse and FE-count race
 *      conditions; when both are healthy the BE check is invisible.
 *
 *   3. Owner of the singleton QuotaLimitModal. Local hook state would
 *      create one modal per call-site with its own open/close state —
 *      a context keeps "open the wall" centralized.
 *
 * The plan limits are read from useCurrentPlanLimits (user_metadata →
 * plans.config.js lookup) so the local check matches the same plan the
 * BE will use. After the Stripe webhook updates user_metadata, both
 * useCurrentPlanLimits AND a follow-up refresh() will see the new plan.
 *
 * Usage:
 *   const { runWithQuota, check, refresh } = useQuota();
 *   <button onClick={() => runWithQuota('brands', openCreateBrand)} />
 *   // After a successful create on the BE, call refresh() so the next
 *   // gate check sees the new count.
 */

const QuotaContext = createContext(null);

const ZERO_USAGE = Object.freeze({
  brands: 0,
  projects: 0,
  avatars: 0,
  downloads: 0,
});

export function QuotaProvider({ children }) {
  const plan = useCurrentPlanLimits();
  const { user } = useAuth();

  /* Authoritative counts from the BE. Stays at ZERO_USAGE while the
   * user is unauthenticated or the first fetch is in flight — that
   * means the gate is permissive during boot, which is the right
   * default: a guard that fires false-positives during the loading
   * flash would be much worse than one that fires false-negatives
   * for a few hundred milliseconds. */
  const [usage, setUsage] = useState(ZERO_USAGE);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState(null);

  /* Modal state lives here so a single instance serves the whole app.
   * `blockedResource` is kept around because a future iteration of the
   * modal might tailor copy ("you've hit the brand limit on Starter") —
   * the current modal copy is generic, but the data is already plumbed. */
  const [blockedResource, setBlockedResource] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setUsage(ZERO_USAGE);
      return;
    }
    setUsageLoading(true);
    const { data, error } = await usageApi.getUsage();
    setUsageLoading(false);
    if (error) {
      setUsageError(error);
      return;
    }
    setUsageError(null);
    setUsage(data.usage);
  }, [user]);

  /* Initial load + refetch whenever the user identity changes. Sign-out
   * resets usage to zero (no logged-in user = no quota to check). */
  useEffect(() => {
    refresh();
  }, [refresh]);

  const check = useCallback(
    (resource) => {
      const limit = plan.limits[resource];
      const current = usage[resource] ?? 0;
      const unlimited = limit === Infinity;
      return {
        allowed: unlimited || current < limit,
        current,
        limit,
        unlimited,
      };
    },
    [plan, usage]
  );

  const runWithQuota = useCallback(
    (resource, action) => {
      const result = check(resource);
      if (result.allowed) {
        action();
        return result;
      }
      setBlockedResource(resource);
      return result;
    },
    [check]
  );

  const closeModal = useCallback(() => setBlockedResource(null), []);

  /* Module-level triggers let non-React (or higher-in-tree React)
   * modules talk to this provider:
   *   - registerWallTrigger lets apiClient pop the modal on a 403
   *     plan_limit_reached.
   *   - registerRefreshTrigger lets BrandsContext / project flows /
   *     avatar flow nudge a usage refresh after a successful mutation,
   *     even though they sit ABOVE QuotaProvider in the tree. */
  useEffect(() => {
    registerWallTrigger((resource) => setBlockedResource(resource));
    registerRefreshTrigger(() => refresh());
    return () => {
      registerWallTrigger(null);
      registerRefreshTrigger(null);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      plan,
      usage,
      usageLoading,
      usageError,
      check,
      runWithQuota,
      refresh,
    }),
    [plan, usage, usageLoading, usageError, check, runWithQuota, refresh]
  );

  return (
    <QuotaContext.Provider value={value}>
      {children}
      <QuotaLimitModal
        open={blockedResource !== null}
        onClose={closeModal}
      />
    </QuotaContext.Provider>
  );
}

export function useQuota() {
  const ctx = useContext(QuotaContext);
  if (!ctx) throw new Error('useQuota must be used inside <QuotaProvider>');
  return ctx;
}

/* ---- Module-level bridges ----------------------------------------- */
/* Two narrow setters that let non-React modules — or React modules that
 * sit ABOVE QuotaProvider in the tree — interact with the provider
 * without coupling through useQuota().
 *
 * registerWallTrigger: apiClient calls triggerQuotaWall() when the BE
 *   returns 403 plan_limit_reached, so a BE-rejected create lands on
 *   the same upgrade wall as an in-app gate-blocked one.
 *
 * registerRefreshTrigger: contexts/services that perform mutations call
 *   requestQuotaRefresh() so the cached usage count re-reads from the
 *   BE. Used by BrandsContext (above QuotaProvider) and project/avatar
 *   create flows.
 *
 * QuotaProvider registers on mount + unregisters on unmount. Calls
 * before mount (very early boot) are silently dropped — the provider's
 * mount effect does an initial fetch anyway. */
let registeredWallTrigger = null;
let registeredRefreshTrigger = null;

function registerWallTrigger(fn) {
  registeredWallTrigger = fn;
}

function registerRefreshTrigger(fn) {
  registeredRefreshTrigger = fn;
}

export function triggerQuotaWall(resource) {
  registeredWallTrigger?.(resource);
}

export function requestQuotaRefresh() {
  registeredRefreshTrigger?.();
}