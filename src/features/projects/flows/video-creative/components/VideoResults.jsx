import { cn } from '@lib/cn';

/* Video result panel — rendered by ProjectDetailPage when the
 * project's serviceType === 'video-creative'.
 *
 * Pure presentational: data + state live in `useVideoVariants`
 * (called by the page).
 *
 * Card layout:
 *   • Aspect-correct video frame (HTML5 <video controls>) — no
 *     autoplay (intrusive on a page that may have multiple cards),
 *     `poster` set to Veo's first-frame jpg so the card isn't
 *     blank before play.
 *   • Pending/dispatched: aspect-correct placeholder with a spinner
 *     and the "ה-AI עובד..." message.
 *   • Failed: aspect-correct error tile with the row's errorMessage.
 *
 * Layout strategy:
 *   • Video is a single-dispatch flow today, so the typical case is
 *     ONE variant. A 3-column grid wastes ~2/3 of the page width
 *     when only one card renders — the original implementation
 *     reused campaign-creative's layout (3 image variants) and the
 *     mismatch shipped as a UI bug.
 *   • Single-variant case → flex-center the card with a per-aspect
 *     max-width so the video reads as the page's hero, not a thumb.
 *   • Multi-variant case (future flows or re-runs) → keep the
 *     responsive grid so cards stay legible side-by-side. */

const ASPECT_CLASS = {
  square: 'aspect-square',
  story: 'aspect-[9/16]',
  portrait: 'aspect-[4/5]',
  '1:1': 'aspect-square',
  '9:16': 'aspect-[9/16]',
  '16:9': 'aspect-video',
};

/* Per-aspect cap for the single-video layout. Picked so the rendered
 * video height stays inside a typical 1080-ish viewport without
 * forcing the user to scroll:
 *   • 9:16 portrait → 448px wide ≈ 796px tall — fits a 1080 viewport
 *     with header room; anything wider becomes too tall.
 *   • 3:4 / 4:5 → 560px wide → 747 / 700 tall — comfortable hero.
 *   • 1:1 → 640px wide → 640 tall — fills the column without
 *     dominating.
 *   • 16:9 → 800px wide → 450 tall — landscape works larger because
 *     its height stays low. */
const SOLO_MAX_W = {
  square: 'max-w-[640px]',
  story: 'max-w-[448px]',
  portrait: 'max-w-[560px]',
  '1:1': 'max-w-[640px]',
  '9:16': 'max-w-[448px]',
  '16:9': 'max-w-[800px]',
};

export function VideoResults({ variants, loading, error, onRetry, aspectRatio }) {
  /* Failed variants are surfaced once via toast at the page level
   * (see useVideoVariants's `onFailure`). They never claim a card
   * slot in the grid — a failed creative shouldn't compress the
   * usable cards into a smaller cell or read as "almost a result". */
  const displayVariants = variants.filter((v) => v.status !== 'failed');

  if (loading) return <SkeletonGrid aspectRatio={aspectRatio} />;

  if (error) {
    return (
      <div className="rounded-card border border-line bg-white p-12 text-center" dir="rtl">
        <p className="text-base text-danger mb-3">{error.message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn-outline inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold"
          >
            נסו שוב
          </button>
        )}
      </div>
    );
  }

  if (displayVariants.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line bg-white p-12 text-center text-ink-muted" dir="rtl">
        <p className="text-base">לפרויקט הזה אין עדיין סרטונים.</p>
      </div>
    );
  }

  /* Single-variant: center it with an aspect-aware cap. Multi: grid
   * — same shape it had before, kept for any future flow that
   * dispatches more than one video per project. */
  if (displayVariants.length === 1) {
    const soloMaxW = SOLO_MAX_W[aspectRatio] ?? SOLO_MAX_W.square;
    return (
      <div className="flex justify-center">
        <div className={cn('w-full', soloMaxW)}>
          <VideoCard variant={displayVariants[0]} aspectRatio={aspectRatio} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayVariants.map((variant) => (
        <VideoCard
          key={variant.id}
          variant={variant}
          aspectRatio={aspectRatio}
        />
      ))}
    </div>
  );
}

function VideoCard({ variant, aspectRatio }) {
  /* Caller (VideoResults) already filtered out failed variants, so
   * this component only renders the ready or in-flight states. The
   * failed state lives entirely as a one-shot toast at the page
   * level via useVideoVariants's onFailure callback. */
  const aspectClass = ASPECT_CLASS[aspectRatio] ?? ASPECT_CLASS.square;
  const isReady = variant.status === 'ready' && variant.videoUrl;

  return (
    <article
      className="rounded-2xl p-3 border bg-white border-line overflow-hidden relative transition-shadow hover:shadow-soft"
      dir="rtl"
    >
      <div className={cn('relative rounded-xl overflow-hidden bg-surface-muted/30', aspectClass)}>
        {isReady ? (
          // `preload="metadata"` so we get the poster + duration without
          // downloading the full mp4 until the user presses play.
          // `object-cover` (not `object-contain`) crops away the edge
          // padding Veo tends to bake into its outputs. The image
          // path uses `object-contain` because images suffer from
          // requested-vs-returned ratio drift; Veo videos don't have
          // that pattern — they almost always come back at the
          // requested ratio but with a centered subject inside
          // their own internal margin, so cropping fills the frame
          // without losing meaningful pixels.
          <video
            src={variant.videoUrl}
            poster={variant.posterUrl ?? undefined}
            controls
            preload="metadata"
            playsInline
            className="absolute inset-0 w-full h-full object-cover bg-black"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 px-4">
            <span
              aria-hidden="true"
              className="h-10 w-10 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin"
            />
            <p className="text-xs sm:text-sm text-ink-muted">
              ה-AI עובד על הסרטון... (1-3 דקות)
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

// Skeleton matches the post-load layout exactly — same flex-center +
// aspect-aware max-width — so the card doesn't pop from "1/3 column"
// to "centered hero" when the variant lands. Video is single-dispatch.
function SkeletonGrid({ aspectRatio }) {
  const aspectClass = ASPECT_CLASS[aspectRatio] ?? ASPECT_CLASS.square;
  const soloMaxW = SOLO_MAX_W[aspectRatio] ?? SOLO_MAX_W.square;
  return (
    <div className="flex justify-center">
      <div className={cn('w-full', soloMaxW)}>
        <div className="rounded-2xl border border-line bg-white p-3">
          <div className={cn('rounded-xl bg-surface-muted animate-pulse', aspectClass)} />
        </div>
      </div>
    </div>
  );
}
