import { useCallback, useEffect, useState } from 'react';
import { Add } from 'iconsax-react';
import { ConfirmDialog, PageContainer } from '@components/ui';
import { cn } from '@lib/cn';
import { useActiveBrand } from '@/contexts/BrandsContext';
import { requestQuotaRefresh } from '@/contexts/QuotaContext';
import { avatarsApi } from '@features/avatars/api/avatars.api';
import { AvatarCard } from '@features/avatars/components/AvatarCard';
import { AvatarEditModal } from '@features/avatars/components/AvatarEditModal';

/* /app/avatars — list + create the active brand's persona avatars.
 *
 * Create flow: click "צרו אווטאר חדש" → backend orchestrates
 * GPT-4o (persona text) + Gemini (portrait), ~20-40s total → row
 * lands → card appears at the top of the grid. The creating card
 * renders inline at the top with a spinner so the user has
 * something to watch while the AI works.
 *
 * Auto-create catch-up:
 *   New brands kick off an automatic avatar pipeline server-side
 *   (BrandsService.create). If the user navigates here BEFORE that
 *   pipeline lands, we poll the list silently every POLL_INTERVAL_MS
 *   so the row + portrait appear without a manual refresh. The poll
 *   self-terminates as soon as the list has at least one avatar and
 *   every avatar has a non-null portraitUrl, OR we hit the attempt
 *   cap (so a permanently-failed portrait doesn't poll forever).
 *
 * Edit flow: click עריכה on a card → modal opens with all fields
 * → save PATCHes the row.
 *
 * Regenerate portrait: re-rolls Gemini only (reuses persona text).
 * Card shows the spinner state until the new URL lands.
 *
 * Delete flow: trash → confirm → DELETE.
 *
 * Quota note: enforced client-side via QuotaContext today (the
 * Subscription model isn't in Prisma yet). When server-side
 * enforcement lands, the backend will reject and the page surfaces
 * the error inline; no FE change needed here. */

/* Poll cadence for the auto-create catch-up loop. 5s × 16 = 80s
 * total — covers worst-case GPT-4o (~10s) + Gemini (~30s) + a
 * safety margin without hammering the API. */
const POLL_INTERVAL_MS = 5000;
const POLL_MAX_ATTEMPTS = 16;

export default function AvatarsPage() {
  const { activeBrand } = useActiveBrand();
  const brandId = activeBrand?.id;

  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [isCreating, setIsCreating] = useState(false);
  /* `isAutoPolling` is true while the catch-up loop is actively
   * waiting for the auto-created avatar (post-brand-creation) to
   * appear. Drives the "creating..." placeholder card when the list
   * is empty — without it, users see the empty state during the
   * ~5-10s window between OpenAI returning and the avatar row
   * landing in the DB, and conclude nothing's happening. */
  const [isAutoPolling, setIsAutoPolling] = useState(false);
  const [actionError, setActionError] = useState(null);

  const [editingAvatar, setEditingAvatar] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [regeneratingIds, setRegeneratingIds] = useState(() => new Set());

  useEffect(() => {
    if (!brandId) {
      setAvatars([]);
      setLoading(false);
      setIsAutoPolling(false);
      return undefined;
    }

    let cancelled = false;
    let pollTimer;
    let pollAttempts = 0;

    setLoading(true);
    setLoadError(null);
    setIsAutoPolling(false);

    /* Re-fetch one more time. Used by the auto-create catch-up loop
     * — we don't flip `loading` because the gallery is already
     * rendered (empty state or a portrait-pending card). Re-renders
     * only when the data actually changes. */
    const pollOnce = async () => {
      if (cancelled) return;
      pollAttempts += 1;
      const { data, error } = await avatarsApi.listByBrand(brandId);
      if (cancelled) return;
      if (error || !Array.isArray(data)) {
        setIsAutoPolling(false);
        return;
      }
      setAvatars(data);
      if (shouldKeepPolling(data) && pollAttempts < POLL_MAX_ATTEMPTS) {
        pollTimer = setTimeout(pollOnce, POLL_INTERVAL_MS);
      } else {
        /* Either the list settled (row + portrait both present) or
         * we hit the attempt cap. Either way the "creating..."
         * affordance no longer reflects reality. */
        setIsAutoPolling(false);
      }
    };

    avatarsApi.listByBrand(brandId).then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setLoadError(error.message ?? 'שגיאה בטעינת האווטארים');
        setAvatars([]);
        setLoading(false);
        return;
      }
      const list = data ?? [];
      setAvatars(list);
      setLoading(false);
      /* Brand-create auto-fires an avatar pipeline server-side. If we
       * land here before it finishes, poll silently so the avatar
       * appears without the user having to refresh. The placeholder
       * card only shows while polling is genuinely active — it
       * clears the moment polling stops, so we don't leave a stuck
       * spinner around if the avatar arrives or the cap is hit. */
      if (shouldKeepPolling(list)) {
        setIsAutoPolling(true);
        pollTimer = setTimeout(pollOnce, POLL_INTERVAL_MS);
      }
    });

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [brandId, reloadToken]);

  const handleCreate = useCallback(async () => {
    if (!brandId || isCreating) return;
    setIsCreating(true);
    setActionError(null);
    const { data, error } = await avatarsApi.create(brandId);
    setIsCreating(false);
    if (error) {
      /* BE may reject with 403 plan_limit_reached; the apiClient already
       * popped the upgrade modal in that case, so we just surface the
       * BE-provided Hebrew message inline as a secondary signal. */
      setActionError(error.message ?? 'יצירת האווטאר נכשלה. נסו שוב.');
      return;
    }
    setAvatars((prev) => [data, ...prev]);
    requestQuotaRefresh();
  }, [brandId, isCreating]);

  const handleSaveEdit = useCallback(async (id, patch) => {
    const { data, error } = await avatarsApi.update(id, patch);
    if (error) return { error };
    setAvatars((prev) => prev.map((a) => (a.id === id ? data : a)));
    return { data };
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    setAvatars((prev) => prev.filter((a) => a.id !== id));
    const { error } = await avatarsApi.remove(id);
    if (error) {
      console.error('[AvatarsPage] delete failed:', error);
      setReloadToken((t) => t + 1);
      return;
    }
    requestQuotaRefresh();
  }, [pendingDelete]);

  const handleRegeneratePortrait = useCallback(async (id) => {
    setRegeneratingIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const { data, error } = await avatarsApi.regeneratePortrait(id);
    setRegeneratingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (error) {
      setActionError(error.message ?? 'ייצור הדיוקן מחדש נכשל.');
      return;
    }
    setAvatars((prev) => prev.map((a) => (a.id === id ? data : a)));
  }, []);

  if (!activeBrand) {
    return (
      <PageContainer>
        <EmptyState message="בחרו מותג פעיל מהסרגל כדי לראות את האווטארים שלו." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6" dir="rtl">
        <Header
          name={activeBrand.name}
          onCreate={handleCreate}
          isCreating={isCreating}
          canCreate={!isCreating && !loading}
        />

        {actionError && (
          <p className="text-sm text-danger text-right">{actionError}</p>
        )}

        {loading && <SkeletonGrid />}

        {!loading && loadError && (
          <ErrorPanel message={loadError} onRetry={() => setReloadToken((t) => t + 1)} />
        )}

        {/* Empty state shows ONLY when nothing's brewing — no
            avatars, no manual create in flight, AND no background
            auto-poll waiting for a freshly-triggered creation.
            Otherwise the user sees a placeholder card so the page
            feels responsive even when the row hasn't landed yet. */}
        {!loading && !loadError && avatars.length === 0
          && !isCreating && !isAutoPolling && (
          <EmptyState message='אין עדיין אווטארים למותג הזה. לחצו על "צרו אווטאר חדש" כדי לייצר אחד.' />
        )}

        {!loading && !loadError
          && (avatars.length > 0 || isCreating || isAutoPolling) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Manual create: CreatingCard at the top. */}
            {isCreating && <CreatingCard />}
            {/* Auto-poll, no row yet: CreatingCard placeholder. */}
            {isAutoPolling && avatars.length === 0 && <CreatingCard />}
            {avatars.map((avatar) => {
              /* While the auto-poll is active, a row with no
                 portrait is mid-generation — render it as a
                 CreatingCard (spinner + "ה-AI יוצר את הפרסונה
                 והדיוקן" copy), matching the visual the manual-
                 create path uses. AvatarCard's built-in pencil
                 placeholder looks idle and reads as "this avatar
                 has no portrait, click to fix it," which is
                 wrong during the auto-create window.

                 Once polling stops (success or 80s cap), the same
                 row falls through to AvatarCard so the user can
                 regenerate manually if Gemini never delivered. */
              if (isAutoPolling && !avatar.portraitUrl) {
                return <CreatingCard key={avatar.id} />;
              }
              return (
                <AvatarCard
                  key={avatar.id}
                  avatar={avatar}
                  regenerating={regeneratingIds.has(avatar.id)}
                  onEdit={() => setEditingAvatar(avatar)}
                />
              );
            })}
          </div>
        )}
      </div>

      <AvatarEditModal
        open={editingAvatar !== null}
        avatar={editingAvatar}
        brandName={activeBrand?.name}
        onClose={() => setEditingAvatar(null)}
        onSave={handleSaveEdit}
        onRegeneratePortrait={
          editingAvatar
            ? () => handleRegeneratePortrait(editingAvatar.id)
            : undefined
        }
        onDelete={
          editingAvatar
            ? () => {
                setPendingDelete(editingAvatar);
                setEditingAvatar(null);
              }
            : undefined
        }
        regenerating={
          editingAvatar ? regeneratingIds.has(editingAvatar.id) : false
        }
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="מחיקת אווטאר"
        description={
          pendingDelete?.title
            ? `האווטאר "${pendingDelete.title}" יימחק לצמיתות. הפעולה אינה ניתנת לביטול.`
            : 'האווטאר יימחק לצמיתות. הפעולה אינה ניתנת לביטול.'
        }
        confirmLabel="מחק אווטאר"
        variant="danger"
      />
    </PageContainer>
  );
}

function Header({ name, onCreate, isCreating, canCreate }) {
  return (
    <header className="flex items-start justify-between flex-wrap gap-4">
      <div className="text-right space-y-1">
        <h1 className="text-[28px] sm:text-[32px] font-extrabold text-ink">אווטארים</h1>
        <p className="text-base text-ink-muted">
          פרסונות קהל היעד של {name}.
        </p>
      </div>

      <button
        type="button"
        onClick={onCreate}
        disabled={!canCreate}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-5 h-11 md:h-12 md:px-6',
          'text-sm md:text-base font-bold transition-opacity',
          canCreate
            ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
            : 'bg-brand-100 text-brand-300 cursor-not-allowed',
          isCreating && 'cursor-wait',
        )}
      >
        {isCreating ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 md:h-5 md:w-5 rounded-full border-2 border-white/40 border-t-white animate-spin"
          />
        ) : (
          <Add size="20" variant="Bold" color="currentColor" />
        )}
        <span>{isCreating ? 'יוצר אווטאר...' : 'צרו אווטאר חדש'}</span>
      </button>
    </header>
  );
}

// Placeholder card while the backend orchestrates GPT + Gemini.
// Shape matches AvatarCard's landscape layout so the gallery doesn't
// reflow when the real card lands.
function CreatingCard() {
  return (
    <article
      dir="rtl"
      className="flex items-stretch gap-4 p-3 rounded-2xl bg-white border border-line shadow-[0_4px_16px_rgba(237,86,153,0.08)]"
    >
      <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-surface-muted flex items-center justify-center">
        <span
          aria-hidden="true"
          className="h-7 w-7 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
        <div className="h-4 w-3/4 bg-surface-muted rounded animate-pulse" />
        <p className="text-xs text-ink-muted">
          ה-AI יוצר את הפרסונה והדיוקן (כדקה)...
        </p>
      </div>
    </article>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-stretch gap-4 p-3 rounded-2xl bg-white border border-line shadow-[0_4px_16px_rgba(237,86,153,0.08)]"
        >
          <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-surface-muted animate-pulse" />
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
            <div className="h-5 w-3/4 bg-surface-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-surface-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-card border border-dashed border-line bg-white p-12 text-center text-ink-muted" dir="rtl">
      <p className="text-base">{message}</p>
    </div>
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="rounded-card border border-line bg-white p-12 text-center" dir="rtl">
      <p className="text-base text-danger mb-3">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-outline inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold"
      >
        נסו שוב
      </button>
    </div>
  );
}

/* True while the list isn't in a "settled" state we can stop polling
 * for. Two cases keep us polling:
 *   - empty list  → the auto-create pipeline hasn't produced a row yet
 *                   (GPT-4o stage still running).
 *   - any avatar with a null portraitUrl → row landed but Gemini is
 *                   still processing (or failed silently — the cap
 *                   on POLL_MAX_ATTEMPTS prevents that from polling
 *                   forever). */
function shouldKeepPolling(list) {
  if (!Array.isArray(list)) return false;
  if (list.length === 0) return true;
  return list.some((avatar) => !avatar?.portraitUrl);
}
