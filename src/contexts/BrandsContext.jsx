import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { brandsApi } from '@features/brands/api/brands.api';
import { requestQuotaRefresh } from '@/contexts/QuotaContext';

/* Brands provider.
 *
 * Owns the brand list and the user's active-brand selection. Mounts inside
 * AppLayout (so /app/* is the only place it runs) and feeds:
 *   - BrandsPage          (list, create, delete)
 *   - Sidebar ActiveBrandCard (read active, switch active)
 *   - Future projects/avatars features (scope queries by activeBrand)
 *
 * Active-brand id is mirrored to localStorage so a reload keeps the user
 * on the same brand. We don't write to user_metadata for that — it would
 * round-trip the auth server on every brand switch for no real benefit.
 *
 * On mount: fetch list, pick the active brand:
 *   1. if localStorage holds an id that still exists → use it
 *   2. otherwise first brand in the list
 *   3. null when there are no brands
 *
 * Mutations refetch instead of patching local state — keeps the source of
 * truth in the API and handles whatever side effects (project counts,
 * timestamps) the real backend will eventually add.
 */
const ACTIVE_KEY = 'craftad.activeBrandId';

const BrandsContext = createContext(null);

export function BrandsProvider({ children }) {
  const [brands, setBrands] = useState([]);
  const [activeBrandId, setActiveBrandIdState] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_KEY);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Why no `mountedRef` guard here:
   *
   * In React 18 + Strict Mode the dev runtime simulates an unmount/remount
   * cycle on every mount. A cleanup like `() => mountedRef.current = false`
   * fires during that simulated unmount, and any in-flight refresh that
   * was awaiting the Supabase call resumes against a `false` ref and
   * silently throws its result away — exactly the "can see the row in
   * the table, page is empty" bug.
   *
   * React 18 also removed the old "can't update state on unmounted
   * component" warning that the pattern was originally for, so the
   * pattern only causes harm now. State updates after unmount are
   * harmless in 18+. */

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await brandsApi.list();
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }
    setBrands(data);
    setError(null);
    setLoading(false);
  }, []);

  /* Initial load. */
  useEffect(() => {
    refresh();
  }, [refresh]);

  /* Reconcile active id once brands resolve — handles the case where the
   * persisted id no longer exists (e.g. brand was deleted on another tab). */
  useEffect(() => {
    if (loading) return;
    if (brands.length === 0) {
      if (activeBrandId !== null) {
        setActiveBrandIdState(null);
        try { localStorage.removeItem(ACTIVE_KEY); } catch { /* ignore */ }
      }
      return;
    }
    const stillExists = brands.some((b) => b.id === activeBrandId);
    if (!stillExists) {
      const fallback = brands[0].id;
      setActiveBrandIdState(fallback);
      try { localStorage.setItem(ACTIVE_KEY, fallback); } catch { /* ignore */ }
    }
  }, [brands, loading, activeBrandId]);

  const setActiveBrand = useCallback((id) => {
    setActiveBrandIdState(id);
    try {
      if (id) localStorage.setItem(ACTIVE_KEY, id);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {
      /* localStorage unavailable — runtime state still works. */
    }
  }, []);

  const createBrand = useCallback(async (input) => {
    const result = await brandsApi.create(input);
    if (!result.error) {
      await refresh();
      /* Quota count changed — nudge QuotaProvider to re-read from the BE.
       * `requestQuotaRefresh` is module-level because QuotaProvider sits
       * BELOW BrandsProvider in the tree; useQuota() here would throw.
       * Calls before QuotaProvider mounts (very early in app boot) are
       * silently dropped — fine, the provider's mount-effect re-fetches. */
      requestQuotaRefresh();
    }
    return result;
  }, [refresh]);

  const updateBrand = useCallback(async (id, patch) => {
    const result = await brandsApi.update(id, patch);
    if (!result.error) await refresh();
    return result;
  }, [refresh]);

  const deleteBrand = useCallback(async (id) => {
    const result = await brandsApi.remove(id);
    if (!result.error) {
      await refresh();
      requestQuotaRefresh();
    }
    return result;
  }, [refresh]);

  /* Compute activeBrand in render so it tracks brands + activeBrandId
   * atomically. If the persisted id no longer exists (deleted on another
   * tab) we fall back to brands[0] right here — no transient render
   * where loading=false but activeBrand=null while waiting for the
   * reconciliation effect to fire. */
  const activeBrand = useMemo(() => {
    if (loading || brands.length === 0) return null;
    return brands.find((b) => b.id === activeBrandId) ?? brands[0];
  }, [loading, brands, activeBrandId]);

  const value = useMemo(
    () => ({
      brands,
      activeBrand,
      activeBrandId,
      loading,
      error,
      setActiveBrand,
      createBrand,
      updateBrand,
      deleteBrand,
      refresh,
    }),
    [brands, activeBrand, activeBrandId, loading, error, setActiveBrand, createBrand, updateBrand, deleteBrand, refresh]
  );

  return <BrandsContext.Provider value={value}>{children}</BrandsContext.Provider>;
}

export function useBrands() {
  const ctx = useContext(BrandsContext);
  if (!ctx) throw new Error('useBrands must be used inside <BrandsProvider>');
  return ctx;
}

/* Selector hook for components that only care about the currently selected
 * brand. Same context underneath — separate name keeps call-sites readable.
 *
 * `loading` is surfaced so consumers can distinguish "brands still fetching"
 * from "user genuinely has no active brand." Otherwise `!activeBrand` is
 * true during the first ~200ms after every refresh and pages flash their
 * NoActiveBrandState screen before the real content lands. */
export function useActiveBrand() {
  const { activeBrand, setActiveBrand, loading } = useBrands();
  return { activeBrand, setActiveBrand, loading };
}
