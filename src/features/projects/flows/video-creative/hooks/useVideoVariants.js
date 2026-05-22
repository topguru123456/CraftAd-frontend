import { useCallback, useEffect, useRef, useState } from 'react';
import { videoGenerationsApi } from '../api/video-generations.api';

/* Owns the video variants for one project detail page.
 *
 * Why a dedicated hook (vs reusing campaign-creative's useVariantSync):
 *   useVariantSync is tightly coupled to creativeGenerationsApi +
 *   Realtime channels on `creative_generations`. Video lives in
 *   `video_generations` with a different shape; threading both flows
 *   through one hook would be a configurable-API+configurable-table
 *   abstraction we don't need yet. Two ~100-line hooks beat one
 *   200-line polymorphic one.
 *
 * Single dispatch per click (no fan-out) — video gen is ~10-20× the
 * cost of image gen per unit, so each click adds exactly ONE new
 * variant. The "create more" button on the page header reuses this
 * hook's `dispatchMore`; clicking N times queues N videos that all
 * poll concurrently. The list surface accumulates them over time.
 *
 * Async lifecycle (~1-3 min from click to ready):
 *   • Dispatch returns immediately with the reserved pending row.
 *   • Backend webhook flips the row to ready (with video_url +
 *     poster_url) or failed (with errorMessage) when Veo finishes.
 *   • This hook polls every POLL_INTERVAL_MS while ANY row is still
 *     pending/dispatched, then settles.
 *
 * Why polling over Supabase Realtime (which campaign-creative uses):
 *   Video has at most a handful of in-flight rows per project — way
 *   under realtime's payoff threshold. Polling is simpler (no channel
 *   subscription lifecycle, no postgres replication assumptions, no
 *   reconnect handling) and the user-perceived latency is fine at
 *   10s when individual operations take 60-180s. If load grows, swap
 *   to a Realtime channel here — the public hook surface won't change.
 */

const POLL_INTERVAL_MS = 10_000;

function hasInflight(variants) {
  return variants.some(
    (v) => v.status === 'pending' || v.status === 'dispatched',
  );
}

export function useVideoVariants({ projectId, enabled }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* `dispatchMore` (page-header "create more" button) lives on its
   * own pair of state slots so it doesn't visually fight with the
   * polling lifecycle — a 1-second click→pending-card transition
   * shouldn't blink the whole grid into a load state. */
  const [isDispatchingMore, setIsDispatchingMore] = useState(false);
  const [dispatchError, setDispatchError] = useState(null);

  /* Stable interval ref so each polling tick can read the latest
   * variants without rebinding the timer. Otherwise we'd thrash
   * setInterval on every state update. */
  const pollRef = useRef(null);

  const fetchOnce = useCallback(
    async (silent = false) => {
      if (!projectId || !enabled) return;
      if (!silent) setLoading(true);
      const { data, error: err } =
        await videoGenerationsApi.listByProject(projectId);
      if (err) {
        if (!silent) setError(err);
      } else {
        setError(null);
        setVariants(data ?? []);
      }
      if (!silent) setLoading(false);
    },
    [projectId, enabled],
  );

  /* Initial fetch + reset when disabled (e.g., service type changes
   * during navigation). */
  useEffect(() => {
    if (!projectId || !enabled) {
      setVariants([]);
      setLoading(false);
      setError(null);
      return;
    }
    fetchOnce(false);
  }, [projectId, enabled, fetchOnce]);

  /* Poll while there's something in flight. Effect re-runs when
   * `variants` changes — when the last in-flight row settles, the
   * condition flips and the interval clears. Silent refetch so the
   * loading spinner doesn't blink on every tick. */
  useEffect(() => {
    if (!projectId || !enabled) return undefined;
    if (!hasInflight(variants)) return undefined;
    pollRef.current = setInterval(() => {
      fetchOnce(true);
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [projectId, enabled, variants, fetchOnce]);

  const refresh = useCallback(() => fetchOnce(false), [fetchOnce]);

  /* Fire one more video against the same project. Backend dispatch
   * returns the new row ref ({uid, projectId, status}); we silently
   * refetch the list to pull the full row in (and any older rows
   * that may have settled mid-roundtrip). The polling effect then
   * auto-starts on the new pending row. */
  const dispatchMore = useCallback(async () => {
    if (!projectId || !enabled || isDispatchingMore) return;
    setIsDispatchingMore(true);
    setDispatchError(null);

    const { error: err } = await videoGenerationsApi.dispatch({ projectId });
    if (err) {
      setDispatchError(err);
      setIsDispatchingMore(false);
      return;
    }
    await fetchOnce(true);
    setIsDispatchingMore(false);
  }, [projectId, enabled, isDispatchingMore, fetchOnce]);

  const remove = useCallback(
    async (id) => {
      /* Optimistic remove; rollback to server truth on failure. */
      setVariants((prev) => prev.filter((v) => v.id !== id));
      const { error: err } = await videoGenerationsApi.remove(id);
      if (err) {
        console.error('[useVideoVariants] delete failed:', err);
        refresh();
      }
    },
    [refresh],
  );

  return {
    variants,
    loading,
    error,
    refresh,
    remove,
    dispatchMore,
    isDispatchingMore,
    dispatchError,
  };
}
