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
 *   • Failed: aspect-correct error tile with the row's errorMessage. */

const ASPECT_CLASS = {
  square: 'aspect-square',
  story: 'aspect-[9/16]',
  portrait: 'aspect-[4/5]',
  '1:1': 'aspect-square',
  '9:16': 'aspect-[9/16]',
  '16:9': 'aspect-video',
};

export function VideoResults({ variants, loading, error, onRetry, aspectRatio }) {
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

  if (variants.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line bg-white p-12 text-center text-ink-muted" dir="rtl">
        <p className="text-base">לפרויקט הזה אין עדיין סרטונים.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {variants.map((variant) => (
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
  const aspectClass = ASPECT_CLASS[aspectRatio] ?? ASPECT_CLASS.square;
  const isReady = variant.status === 'ready' && variant.videoUrl;
  const isFailed = variant.status === 'failed';

  return (
    <article
      className="rounded-2xl p-3 border bg-white border-line overflow-hidden relative transition-shadow hover:shadow-soft"
      dir="rtl"
    >
      <div className={cn('relative rounded-xl overflow-hidden bg-surface-muted/30', aspectClass)}>
        {isReady ? (
          // `preload="metadata"` so we get the poster + duration without
          // downloading the full mp4 until the user presses play.
          <video
            src={variant.videoUrl}
            poster={variant.posterUrl ?? undefined}
            controls
            preload="metadata"
            playsInline
            className="absolute inset-0 w-full h-full object-cover bg-black"
          />
        ) : isFailed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <p className="text-xs text-danger line-clamp-3">
              {variant.errorMessage ?? 'יצירת הסרטון נכשלה'}
            </p>
          </div>
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

// Single skeleton card sized to the project's aspect ratio so the
// loading shape matches what's about to render (no square-skeleton-
// then-portrait-card layout shift). Video is single-dispatch so one
// card is honest about what to expect.
function SkeletonGrid({ aspectRatio }) {
  const aspectClass = ASPECT_CLASS[aspectRatio] ?? ASPECT_CLASS.square;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-line bg-white p-3">
        <div className={cn('rounded-xl bg-surface-muted animate-pulse', aspectClass)} />
      </div>
    </div>
  );
}
