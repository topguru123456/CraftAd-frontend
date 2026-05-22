import { useState } from 'react';
import { Copy } from 'iconsax-react';
import { cn } from '@lib/cn';
import { BookmarkAction, EditAction } from '@features/projects/components/CardActions';

/* Copywriting result panel — rendered by ProjectDetailPage when the
 * project's serviceType === 'copywriting-ads'.
 *
 * Data + state live in useCopywritingVariants (called by the page).
 * This component owns only the per-card "just copied" flash.
 *
 * Bottom action bar matches the image-variant cards visually: bookmark
 * pinned to the visual left, edit + primary-action grouped on the
 * visual right. Primary action is flow-specific — image cards use
 * "הורדה" (download), copy cards use "העתקת טקסט" (clipboard). */

const COPIED_FLASH_MS = 1500;

export function CopywritingResults({
  variants,
  loading,
  error,
  onRetry,
  onToggleBookmark,
  onEdit,
}) {
  if (loading) return <SkeletonGrid />;

  if (error) {
    return (
      <div className="rounded-card border border-line bg-white p-12 text-center">
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
      <div className="rounded-card border border-dashed border-line bg-white p-12 text-center text-ink-muted">
        <p className="text-base">לפרויקט הזה אין עדיין וריאציות.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {variants.map((variant) => (
        <CopywritingCard
          key={variant.id}
          variant={variant}
          onToggleBookmark={onToggleBookmark}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

function CopywritingCard({ variant, onToggleBookmark, onEdit }) {
  const isReady = variant.status === 'ready' && variant.adText;
  const isFailed = variant.status === 'failed';

  return (
    <article
      dir="rtl"
      className="rounded-2xl border bg-white border-line p-4 sm:p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-8 border border-slate-300 rounded-xl p-2">
        {variant.conversionScore != null && (
          <ConversionScorePill score={variant.conversionScore} />
        )}
        <MetaStrip
          frameworkHe={variant.frameworkHe}
          keywords={variant.keywords ?? []}
          tones={variant.tonesUsed ?? []}
        />
      </div>

      {isReady ? (
        <>
          {/* line-clamp-6 keeps cards a consistent compact height —
           * the full text lives in the edit modal. */}
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink text-right line-clamp-6">
            {variant.adText}
          </p>

          <CopyCardActions
            variant={variant}
            onToggleBookmark={onToggleBookmark}
            onEdit={onEdit}
          />
        </>
      ) : isFailed ? (
        <div className="rounded-xl border border-dashed border-danger/30 bg-rose-50/40 p-4 text-center">
          <p className="text-sm text-danger">
            יצירת הוריאציה נכשלה{variant.errorMessage ? ` (${variant.errorMessage})` : ''}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-line bg-surface-muted/30 p-6 text-center">
          <p className="text-sm text-ink-muted">הוריאציה עוד בעיבוד...</p>
        </div>
      )}
    </article>
  );
}

// Bottom action bar — matches the image-variant layout: bookmark
// alone on the visual left, edit + primary clustered on the right.
function CopyCardActions({ variant, onToggleBookmark, onEdit }) {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopy = async () => {
    if (!variant.adText) return;
    try {
      await navigator.clipboard.writeText(variant.adText);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), COPIED_FLASH_MS);
    } catch (err) {
      console.warn('[CopywritingCard] clipboard write failed:', err);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 pt-2 border-t border-line">
      <div className="flex items-center gap-2">
        <CopyAction justCopied={justCopied} onClick={handleCopy} />
        <EditAction onClick={() => onEdit?.(variant)} />
      </div>
      <BookmarkAction
        bookmarked={Boolean(variant.bookmarked)}
        onClick={() => onToggleBookmark?.(variant.id, !variant.bookmarked)}
      />
    </div>
  );
}

// Primary action on copy cards — same dimensions/styling as
// DownloadAction in ImageResultsView so the bottom bars line up
// visually across card types. Different action (clipboard vs file
// download); same shape.
function CopyAction({ justCopied, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="העתק טקסט"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3.5 h-9',
        'text-sm font-bold text-white shadow-brand transition-opacity',
        justCopied ? 'bg-success' : 'bg-brand-gradient hover:opacity-95',
      )}
    >
      <Copy size="18" variant="Bold" color="currentColor" />
      <span>{justCopied ? 'הועתק' : 'העתקת טקסט'}</span>
    </button>
  );
}

/* Metadata strip — three labeled rows (אסטרטגיה / מילות מפתח / סגנון).
 * Empty values still render the label so the visual rhythm is stable
 * across cards (an empty keywords row reads as "none picked" rather
 * than a layout shift). */
function MetaStrip({ frameworkHe, keywords, tones }) {
  return (
    <div className="text-right space-y-1 flex-1 min-w-0">
      <MetaRow label="אסטרטגיה" value={frameworkHe} />
      <MetaRow label="מילות מפתח" value={keywords.length ? keywords.join(', ') : '—'} />
      <MetaRow label="סגנון" value={tones.length ? tones.join(', ') : '—'} />
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <p className="text-[14px] leading-snug">
      <span className="text-ink-muted font-bold">{label}: </span>
      <span className="text-ink">{value ?? '—'}</span>
    </p>
  );
}

function ConversionScorePill({ score }) {
  return (
    <div
      className={cn(
        'inline-flex flex-col items-center justify-center shrink-0',
        'rounded-lg bg-emerald-50 px-3 py-1.5 shadow-soft min-w-[80px]'
      )}
      dir="rtl"
    >
      <span className="text-[16px] text-slate-500 leading-tight">...Conversion</span>
      <span className="text-[21px] font-medium text-emerald-600 leading-tight" dir="ltr">
        {score}%
      </span>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-line bg-white p-5 sm:p-6 space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 bg-surface-muted rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-surface-muted rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-surface-muted rounded animate-pulse" />
            </div>
            <div className="h-12 w-20 bg-emerald-50 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full bg-surface-muted rounded animate-pulse" />
            <div className="h-3 w-full bg-surface-muted rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-surface-muted rounded animate-pulse" />
            <div className="h-3 w-4/6 bg-surface-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
