import { useCallback, useEffect, useRef, useState } from 'react';
import {
  creativeGenerationsApi,
  mergeVariantPatch,
  needsEditPoll,
  projectNeedsPoll,
  upsertVariantInList,
} from '@features/projects/flows/campaign-creative/api/creative-generations.api';

const POLL_MS = 3500;

/**
 * Keeps creative_generation row(s) in sync via realtime + targeted polling.
 *
 * Modes:
 *   - project: list all variants for a project (ProjectDetailPage)
 *   - row:     single variant (CreativeEditPage)
 *
 * Never sets loading=true on poll or silent refetch — only on initial mount.
 */
export function useVariantSync({ mode, projectId, variantId }) {
  const isProject = mode === 'project';
  const scopeId = isProject ? projectId : variantId;

  const [variants, setVariants] = useState([]);
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const variantsRef = useRef(variants);
  const variantRef = useRef(variant);
  variantsRef.current = variants;
  variantRef.current = variant;

  const loadInitial = useCallback(async () => {
    if (!scopeId) {
      setVariants([]);
      setVariant(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    if (isProject) {
      const { data, error: err } = await creativeGenerationsApi.listByProject(scopeId);
      if (err) {
        setError(err);
        setVariants([]);
        setLoading(false);
        return;
      }
      setVariants(data ?? []);
    } else {
      const { data, error: err } = await creativeGenerationsApi.get(scopeId);
      if (err || !data) {
        setError(err ?? { message: 'וריאציה לא נמצאה' });
        setVariant(null);
        setLoading(false);
        return;
      }
      setVariant(data);
    }
    setLoading(false);
  }, [isProject, scopeId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const refetchSilent = useCallback(async () => {
    if (!scopeId) return;
    if (isProject) {
      const { data, error: err } = await creativeGenerationsApi.listByProject(scopeId);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setVariants(data ?? []);
    } else {
      const { data, error: err } = await creativeGenerationsApi.get(scopeId);
      if (err || !data) {
        setError(err ?? { message: 'וריאציה לא נמצאה' });
        return;
      }
      setError(null);
      setVariant(data);
    }
  }, [isProject, scopeId]);

  /** Optimistic / local merge — project mode upserts into list, row mode patches one. */
  const mergeVariant = useCallback(
    (rowOrPatch) => {
      if (isProject) {
        setVariants((prev) => upsertVariantInList(prev, rowOrPatch));
      } else {
        setVariant((prev) => mergeVariantPatch(prev, rowOrPatch));
      }
    },
    [isProject],
  );

  const removeVariant = useCallback(
    (id) => {
      if (isProject) {
        setVariants((prev) => prev.filter((v) => v.id !== id));
      }
    },
    [isProject],
  );

  /* Realtime.
   *
   * Subscribes on (scopeId, isProject) change — NOT on `loading`.
   * Earlier this effect also depended on `loading`, which meant every
   * subsequent refresh (loadInitial flipping loading true → false)
   * tore the Supabase channel down and re-opened it. With ~3s of
   * setup/teardown latency per channel that was real wasted work for
   * zero benefit.
   *
   * Race the removal introduces: an event arriving between subscribe
   * (t=0) and the initial fetch resolving (t≈100-500ms) could be
   * overwritten when the fetch's snapshot lands. In practice the
   * snapshot usually includes the event (Postgres → Realtime
   * pipeline replays committed rows), and the 3.5s polling safety
   * net below picks up anything missed. The previous code "fixed"
   * this by NEVER subscribing during loading — which papered over
   * the race at the cost of churning channels on every refresh.
   * The race is the better trade. */
  useEffect(() => {
    if (!scopeId) return undefined;

    if (isProject) {
      return creativeGenerationsApi.subscribeToProject(scopeId, {
        onInsert: (row) => setVariants((prev) => upsertVariantInList(prev, row)),
        onChange: (row) => setVariants((prev) => upsertVariantInList(prev, row)),
        onError: (err) => {
          console.warn('[useVariantSync] realtime issue:', err);
        },
      });
    }

    return creativeGenerationsApi.subscribeToRow(scopeId, {
      onChange: (row) => setVariant(row),
      onError: (err) => {
        console.warn('[useVariantSync] realtime issue:', err);
      },
    });
  }, [isProject, scopeId]);

  /* Polling safety net — generation, scoring, and edit in-flight states.
   * Interval stays mounted across (scopeId, isProject); each tick
   * no-ops when nothing needs polling. Like the realtime effect above,
   * `loading` is deliberately NOT a dep — the tick reads from the
   * variants/variant refs which update independently, so a transient
   * loading=true during refresh doesn't need to reset the interval. */
  useEffect(() => {
    if (!scopeId) return undefined;

    const tick = async () => {
      const active = isProject
        ? projectNeedsPoll(variantsRef.current)
        : needsEditPoll(variantRef.current);
      if (!active) return;
      await refetchSilent();
    };

    const interval = setInterval(tick, POLL_MS);
    return () => clearInterval(interval);
  }, [isProject, scopeId, refetchSilent]);

  return {
    variants,
    variant,
    loading,
    error,
    mergeVariant,
    removeVariant,
    refetchSilent,
    refresh: loadInitial,
  };
}
