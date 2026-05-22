import { useCallback, useEffect, useState } from 'react';
import { copywritingGenerationsApi } from '../api/copywriting-generations.api';

/* Owns the copywriting variants for one project detail page.
 *
 * Why a dedicated hook (vs inlining state in ProjectDetailPage):
 *   The page needs to (1) render the variants in CopywritingResults
 *   and (2) hand a dispatchMore callback to the page Header — same
 *   visual pattern as campaign-creative. Lifting the state above both
 *   consumers via a hook keeps the state in one place and lets the
 *   page stay thin.
 *
 * `enabled` lets ProjectDetailPage call this hook unconditionally
 * (Rules of Hooks) but skip the network for non-copywriting projects.
 * We still allocate state — that's cheap; the win is skipping the
 * fetch and the bookkeeping for projects that don't need it.
 *
 * dispatchMore semantics: synchronous against the backend (one POST
 * returns N populated variants ~10–15s later). On success, we append
 * the new rows to the existing list — the result page reads as
 * "append-only" which matches the user's mental model of "I keep
 * generating more variants on top of what I already have." Failures
 * surface via `dispatchError` for the page to render. */
export function useCopywritingVariants({ projectId, enabled }) {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isDispatchingMore, setIsDispatchingMore] = useState(false);
  const [dispatchError, setDispatchError] = useState(null);

  const refresh = useCallback(async () => {
    if (!projectId || !enabled) return;
    setLoading(true);
    const { data, error: err } = await copywritingGenerationsApi.listByProject(projectId);
    if (err) {
      setError(err);
      setVariants([]);
    } else {
      setError(null);
      setVariants(data ?? []);
    }
    setLoading(false);
  }, [projectId, enabled]);

  useEffect(() => {
    if (!projectId || !enabled) {
      /* Reset when the hook gets disabled (eg. service type changes
       * during navigation). Otherwise stale variants would briefly
       * render for the wrong project type. */
      setVariants([]);
      setLoading(false);
      setError(null);
      return;
    }
    refresh();
  }, [projectId, enabled, refresh]);

  const dispatchMore = useCallback(async () => {
    if (!projectId || !enabled || isDispatchingMore) return;
    setIsDispatchingMore(true);
    setDispatchError(null);

    const { data, error: err } =
      await copywritingGenerationsApi.dispatch({ projectId });

    if (err) {
      setDispatchError(err);
      setIsDispatchingMore(false);
      return;
    }

    const newRows = data ?? [];
    if (newRows.length === 0) {
      setDispatchError({ message: 'לא נוצרו וריאציות חדשות' });
    } else {
      setVariants((prev) => [...prev, ...newRows]);
    }
    setIsDispatchingMore(false);
  }, [projectId, enabled, isDispatchingMore]);

  /* Optimistic bookmark — server returns canonical state so we settle
   * to whatever it says. On error we roll back to the prior value. */
  const toggleBookmark = useCallback(async (id, nextValue) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, bookmarked: nextValue } : v)),
    );
    const { data, error: err } = await copywritingGenerationsApi.setBookmarked(id, nextValue);
    if (err) {
      setVariants((prev) =>
        prev.map((v) => (v.id === id ? { ...v, bookmarked: !nextValue } : v)),
      );
      return;
    }
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, bookmarked: data.bookmarked } : v)),
    );
  }, []);

  const remove = useCallback(async (id) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
    const { error: err } = await copywritingGenerationsApi.remove(id);
    if (err) {
      console.error('[useCopywritingVariants] delete failed:', err);
      refresh();
    }
  }, [refresh]);

  /* Replace a variant's adText in local state with the server's echo
   * (caller passes the row returned by the PATCH endpoint so we settle
   * to the canonical shape). */
  const replaceVariant = useCallback((updated) => {
    if (!updated?.id) return;
    setVariants((prev) =>
      prev.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)),
    );
  }, []);

  return {
    variants,
    loading,
    error,
    refresh,
    dispatchMore,
    isDispatchingMore,
    dispatchError,
    toggleBookmark,
    remove,
    replaceVariant,
  };
}
