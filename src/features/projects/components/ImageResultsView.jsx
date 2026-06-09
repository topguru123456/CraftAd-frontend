import { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { ArrowDown2, ArrowCircleDown2 } from 'iconsax-react';
import { cn } from '@lib/cn';
import {
  downloadCreative,
  mintCreativeDownloadUrl,
} from '@features/projects/flows/campaign-creative/api/creative-generations.api';
import { BookmarkAction, EditAction } from './CardActions';

/* Shared image-output detail surface.
 *
 * Used by every project type whose detail page renders image
 * variants: campaign-creative, product-images, and the image tab of
 * advertising-package.
 *
 * Three public exports — call them together at the page level so
 * the toolbar (which lives on the page's top row alongside the
 * project-delete button and any tab switcher) and the grid (which
 * lives below) share the same selection / sort / download state:
 *
 *   const imageResults = useImageResults({ variants, projectName });
 *   <ImageResultsToolbar {...imageResults} />
 *   <ImageResultsGrid    {...imageResults} aspectRatio={...} ... />
 *
 * Why split this way (instead of one self-contained view):
 *   The original single component owned its own top toolbar, which
 *   forced a stacked layout: project-delete on its own row, tabs on
 *   another row, toolbar on a third. Three rows of unrelated chrome
 *   above the cards reads as broken layout. Splitting the hook from
 *   the rendering pieces lets the page compose toolbar + tabs +
 *   delete into ONE flex row above the cards, while the grid sits
 *   below the cards with the same state powering it. Same data, one
 *   row of chrome — the right shape for the screen.
 *
 *
 * Selection model:
 *   • Per-card checkbox pinned to the top-RIGHT of each tile (RTL
 *     `start-3`). Hidden by default, revealed on card hover OR
 *     always-visible when the card is already selected.
 *   • Click toggles selection. Cards have no top-level click action,
 *     so no stopPropagation gymnastics.
 *
 * Multi-download (client-side ZIP via JSZip):
 *   1. Fetch each selected variant's cleanImageUrl (fall back to
 *      imageUrl) as a blob, in parallel via Promise.all.
 *   2. Add each successful blob under `<projectName>-<n>.<ext>`.
 *   3. Generate the ZIP blob, one anchor download.
 *   4. Per-file fetch failures are tolerated — the ZIP still
 *      downloads with whatever succeeded; the failure count surfaces
 *      inline. Only a 100% failure rate blocks the download.
 *
 * Sort axes (default 'date'):
 *   'date'   createdAt desc.
 *   'score'  conversionScore desc; nulls last.
 *   Selection ids are stable across sort changes. */

const ASPECT_CLASS = {
  square:   'aspect-square',
  story:    'aspect-[9/16]',
  // `portrait` ships as 3:4 — matches the wire value the dispatcher
  // now sends to Imagen (see ratios.config.jsx for the rationale).
  portrait: 'aspect-[3/4]',
  '1:1':    'aspect-square',
  '9:16':   'aspect-[9/16]',
  '16:9':   'aspect-[16/9]',
  '3:4':    'aspect-[3/4]',
};

const SORT_OPTIONS = [
  { id: 'score', label: 'מיון לפי ציון' },
  { id: 'date',  label: 'מיון לפי תאריך יצירה' },
];

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function useImageResults({ variants, projectName }) {
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [sortBy, setSortBy] = useState('date');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  /* Filter out failed-without-image variants. Failed-WITH-image rows
   * are kept so users can still inspect them. */
  const renderableVariants = useMemo(
    () => variants.filter((v) => v.status !== 'failed' || v.imageUrl),
    [variants],
  );

  /* Sort. Both axes are desc. 'score' puts nulls at the bottom via a
   * two-pass guard; 'date' treats missing createdAt as epoch-0 so
   * legacy rows don't accidentally float to the top. */
  const sortedVariants = useMemo(() => {
    const arr = [...renderableVariants];
    if (sortBy === 'date') {
      arr.sort((a, b) => {
        const ta = new Date(a.createdAt ?? 0).getTime();
        const tb = new Date(b.createdAt ?? 0).getTime();
        return tb - ta;
      });
    } else {
      arr.sort((a, b) => {
        const sa = a.conversionScore;
        const sb = b.conversionScore;
        if (sa == null && sb == null) return 0;
        if (sa == null) return 1;
        if (sb == null) return -1;
        return sb - sa;
      });
    }
    return arr;
  }, [renderableVariants, sortBy]);

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const selectedCount = selectedIds.size;

  const handleMultiDownload = async () => {
    if (selectedCount === 0 || isDownloading) return;
    setIsDownloading(true);
    setDownloadError(null);

    /* Use sortedVariants (not raw `variants`) so the ZIP order
     * matches what the user sees on screen — index 1 = top tile. */
    const picked = sortedVariants.filter(
      (v) => selectedIds.has(v.id) && (v.cleanImageUrl || v.imageUrl),
    );
    if (picked.length === 0) {
      setIsDownloading(false);
      return;
    }

    const zip = new JSZip();
    const baseName = sanitizeForFilename(projectName) || 'craftad';
    let failures = 0;

    /* Per-variant: mint a signed URL via the BE, fetch the clean bytes,
     * add to the archive. Each mint will count against the user's plan
     * once Subscription enforcement lands — same semantics as the single-
     * download path so users can't game the quota by ZIP-ing instead. */
    await Promise.all(
      picked.map(async (variant, idx) => {
        try {
          const { data: ticket, error: mintError } = await mintCreativeDownloadUrl(variant.id);
          if (mintError || !ticket?.url) {
            throw new Error(mintError?.message ?? 'mint failed');
          }
          const res = await fetch(ticket.url, { credentials: 'omit' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          const ext = inferExt(blob.type ?? 'image/jpeg', ticket.url);
          zip.file(`${baseName}-${idx + 1}.${ext}`, blob);
        } catch (err) {
          console.warn('[useImageResults] zip mint/fetch failed:', variant.id, err);
          failures += 1;
        }
      }),
    );

    if (failures === picked.length) {
      setDownloadError('ההורדה נכשלה לכל הוריאציות שנבחרו. נסו שוב.');
      setIsDownloading(false);
      return;
    }

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerBlobDownload(zipBlob, `${baseName}.zip`);
    } catch (err) {
      console.warn('[useImageResults] zip generate failed:', err);
      setDownloadError('יצירת הקובץ הדחוס נכשלה. נסו שוב.');
      setIsDownloading(false);
      return;
    }

    setIsDownloading(false);
    if (failures > 0) {
      setDownloadError(
        `${failures} מתוך ${picked.length} וריאציות נכשלו בהורדה — הקובץ הדחוס כולל את היתר.`,
      );
    }
  };

  return {
    sortedVariants,
    selectedIds,
    toggleSelection,
    clearSelection,
    selectedCount,
    sortBy,
    setSortBy,
    isDownloading,
    downloadError,
    handleMultiDownload,
  };
}

/* ------------------------------------------------------------------ */
/* Toolbar (renders in the page's top row, next to tabs + delete)      */
/* ------------------------------------------------------------------ */

export function ImageResultsToolbar({
  sortBy,
  setSortBy,
  selectedCount,
  isDownloading,
  handleMultiDownload,
}) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full"
      dir="rtl"
    >
      <MultiDownloadButton
        selectedCount={selectedCount}
        isDownloading={isDownloading}
        onClick={handleMultiDownload}
        className="w-full sm:w-auto"
      />
      <SortDropdown
        value={sortBy}
        onChange={setSortBy}
        options={SORT_OPTIONS}
        className="w-full sm:w-auto sm:min-w-[200px]"
      />
      {/* No "clear selection" affordance: per design review, a plain
        * text link read as decoration, not control. Users clear by
        * un-clicking the per-card checkbox (which they already know
        * how to do). If a clear-all becomes needed we'll surface it
        * as a small × button next to the selected-count, not as a
        * naked text link. `clearSelection` stays on the hook return
        * for that future use. */}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Grid (renders where the cards go)                                   */
/* ------------------------------------------------------------------ */

export function ImageResultsGrid({
  sortedVariants,
  selectedIds,
  toggleSelection,
  downloadError,
  loading,
  error,
  appendError,
  variants,
  aspectRatio,
  onRetry,
  onEdit,
  onToggleBookmark,
}) {
  return (
    <div className="space-y-6">
      {(downloadError || appendError) && (
        <p className="text-sm text-danger text-right">
          {downloadError ?? appendError}
        </p>
      )}

      {loading && <SkeletonGrid />}

      {!loading && error && (
        <div className="rounded-card border border-line bg-white p-12 text-center">
          <p className="text-base text-danger mb-3">{error.message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="btn-outline inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold"
          >
            נסו שוב
          </button>
        </div>
      )}

      {!loading && !error && variants.length === 0 && (
        <div className="rounded-card border border-dashed border-line bg-white p-12 text-center text-ink-muted">
          <p className="text-base">לפרויקט הזה אין עדיין וריאציות.</p>
        </div>
      )}

      {!loading && !error && sortedVariants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedVariants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              aspectRatio={aspectRatio}
              selected={selectedIds.has(variant.id)}
              onToggleSelect={() => toggleSelection(variant.id)}
              onEdit={() => onEdit(variant.id)}
              onToggleBookmark={() => onToggleBookmark?.(variant.id, !variant.bookmarked)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Toolbar sub-components                                              */
/* ------------------------------------------------------------------ */

// Shared button primitive for the toolbar row. Responsive heights +
// padding + text so the controls feel comfortable on desktop without
// being oversized on mobile. AdPackageTabs uses the same h-11/md:h-12
// pair on its outer container so tabs and buttons sit on one baseline.
const TOOLBAR_BUTTON_BASE =
  'h-11 md:h-12 inline-flex items-center gap-2 rounded-xl px-4 md:px-5 text-sm md:text-base font-bold transition-colors';

function MultiDownloadButton({ selectedCount, isDownloading, onClick, className }) {
  const disabled = selectedCount === 0 || isDownloading;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        TOOLBAR_BUTTON_BASE,
        className,
        disabled
          ? 'bg-brand-100 text-brand-300 cursor-not-allowed'
          : 'bg-brand-gradient text-white shadow-brand hover:opacity-95',
        isDownloading && 'cursor-wait',
      )}
    >
      {isDownloading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 md:h-5 md:w-5 rounded-full border-2 border-white/40 border-t-white animate-spin"
        />
      ) : (
        <ArrowCircleDown2 size="20" variant="Bold" color="currentColor" />
      )}
      <span>
        {isDownloading
          ? 'מכין הורדה...'
          : selectedCount > 0
            ? `הורדה מרובה (${selectedCount})`
            : 'הורדה מרובה'}
      </span>
    </button>
  );
}

/* Compact sort dropdown — the shared <Dropdown> from @components/ui
 * uses text-md + py-2.5 which renders ~44px tall, breaking alignment
 * with the h-10 (40px) toolbar buttons. This local variant keeps the
 * same accessibility shape (role=listbox, ESC/outside-click close,
 * aria) but locks to h-10 + text-sm so every button in the toolbar
 * row sits on the same baseline. */
function SortDropdown({ value, onChange, options, className }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onMouseDown = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.id === value);

  return (
    <div ref={wrapRef} className={cn('relative min-w-0', className)} dir="rtl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          TOOLBAR_BUTTON_BASE,
          'w-full justify-between',
          'md:min-w-[220px]',
          'bg-white border text-ink',
          open ? 'border-brand-300' : 'border-line hover:border-brand-200',
        )}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <ArrowDown2
          size="18"
          color="currentColor"
          className={cn('shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={cn(
            'absolute z-20 inset-x-0 top-full mt-1.5',
            'rounded-xl border border-line bg-white shadow-card py-1',
          )}
        >
          {options.map((opt) => {
            const isSelected = opt.id === value;
            return (
              <li key={opt.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-2.5 text-right text-sm md:text-base transition-colors',
                    isSelected
                      ? 'bg-brand-50/60 text-brand-500 font-bold'
                      : 'text-ink hover:bg-surface-muted/70',
                  )}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Grid sub-components                                                 */
/* ------------------------------------------------------------------ */

function VariantCard({ variant, aspectRatio, selected, onToggleSelect, onEdit, onToggleBookmark }) {
  const aspectClass = ASPECT_CLASS[aspectRatio] ?? ASPECT_CLASS.square;
  const isReady = variant.status === 'ready' && variant.imageUrl;
  const isFailed = variant.status === 'failed';
  const isPending = variant.status === 'pending';

  const [busy, setBusy] = useState(false);
  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      /* Hits POST /downloads/creative/:id under the hood — the BE mints
       * a 60s signed URL into the private creatives-clean bucket and the
       * anchor click downloads with the server's Content-Disposition. */
      await downloadCreative({ variantId: variant.id });
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className={cn(
        'group rounded-2xl p-6 border bg-white border-line bg-surface-muted/30 overflow-hidden',
        'relative transition-shadow hover:shadow-soft',
        aspectClass,
      )}
    >
      {isReady ? (
        <>
          {/* `object-contain` keeps the full image visible if the
              returned creative's aspect ratio drifts from the
              container's. Imagen sometimes ships a slightly different
              shape than requested (or older 1:1-buggy projects still
              live in the DB); `object-cover` cropped those, which read
              to QA as "image cut off". The `bg-surface-muted` fills any
              letterbox gap so the bars look intentional rather than
              broken. */}
          <img
            src={variant.imageUrl}
            alt="וריאציה של הקריאייטיב"
            className="rounded-2xl inset-0 w-full h-full object-contain bg-surface-muted"
          />

          <SelectCheckbox
            selected={selected}
            onToggle={onToggleSelect}
          />

          <ConversionScorePill score={variant.conversionScore} />

          <div
            className={cn(
              'absolute bottom-0 inset-x-0 px-3 py-2.5',
              'bg-white/80 backdrop-blur-md border-t border-line/60',
              'translate-y-full group-hover:translate-y-0',
              'transition-transform duration-200 ease-out',
              'flex items-center justify-between gap-2',
            )}
          >
            {/* RTL start = visual right: primary actions (download + edit) */}
            <div className="flex items-center gap-2">
              <DownloadAction busy={busy} onClick={handleDownload} />
              <EditAction onClick={onEdit} />
            </div>
            {/* RTL end = visual left: bookmark on its own */}
            <BookmarkAction
              bookmarked={Boolean(variant.bookmarked)}
              onClick={onToggleBookmark}
            />
          </div>
        </>
      ) : isFailed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <p className="text-xs text-ink-muted line-clamp-3">
            {variant.errorMessage ?? 'יצירה נכשלה'}
          </p>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 px-4 py-6">
          <span
            aria-hidden="true"
            className="h-10 w-10 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin"
          />
          <p className="text-xs sm:text-sm text-ink-muted">
            {isPending ? 'שולח לשרת היצירה…' : 'ה-AI יוצר את התמונה…'}
          </p>
        </div>
      )}
    </article>
  );
}

// Selection checkbox in the card's top-RIGHT corner (RTL start).
// Hidden until hover, always visible when selected so the user can
// see their picks without hovering each tile.
function SelectCheckbox({ selected, onToggle }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={selected ? 'הסר מהבחירה' : 'הוסף לבחירה'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'absolute top-3 start-3 z-10',
        'inline-flex items-center justify-center w-9 h-9 rounded-lg',
        'transition-all duration-150',
        selected
          ? 'opacity-100 bg-brand-gradient text-white shadow-brand'
          : 'opacity-0 group-hover:opacity-100 bg-white/95 backdrop-blur border border-line hover:border-brand-300',
      )}
    >
      {selected && <CheckmarkIcon />}
    </button>
  );
}

// Plain checkmark SVG — cleaner inside a colored button than the
// iconsax TickSquare (square-in-square).
function CheckmarkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Primary action on image cards — pink gradient with file-download
// semantics. BookmarkAction + EditAction live in ./CardActions and
// are shared with the copywriting card.
function DownloadAction({ busy, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-label="הורידו את התמונה"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3.5 h-9',
        'text-sm font-bold bg-brand-gradient text-white shadow-brand transition-opacity',
        busy ? 'opacity-70 cursor-wait' : 'hover:opacity-95',
      )}
    >
      {busy ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
        />
      ) : (
        <ArrowCircleDown2 size="18" variant="Bold" color="currentColor" />
      )}
      <span>{busy ? 'מוריד...' : 'הורדה'}</span>
    </button>
  );
}

function ConversionScorePill({ score }) {
  if (score == null) return null;
  return (
    <div
      className={cn(
        'absolute top-3 end-3 z-10',
        'inline-flex items-center gap-1.5 rounded-lg',
        'bg-emerald-50 backdrop-blur px-2.5 py-1.5',
        'shadow-soft',
      )}
      dir="rtl"
    >
      <div className="text-center leading-tight">
        <div className="text-[12px] text-black">ציון המרה:</div>
        <div className="text-[21px] font-medium text-emerald-600" dir="ltr">
          {score}%
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-line bg-surface-muted/30 overflow-hidden"
        >
          <div className="aspect-square bg-surface-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function triggerBlobDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

/* Strip non-filesystem-safe characters from the project name so it
 * can ride as the ZIP/file prefix. Keeps Hebrew letters (֐-׿
 * is the Hebrew Unicode block) and ASCII alphanumerics + hyphens;
 * everything else collapses to a single hyphen. Capped at 40 chars
 * so the filename stays readable on Windows + macOS. */
function sanitizeForFilename(name) {
  if (typeof name !== 'string') return '';
  return name
    .trim()
    .replace(/[^a-z0-9֐-׿-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/* MIME → extension, with a URL-path fallback for cases where the
 * Content-Type is generic. 'jpg' is the final fallback — overwhelmingly
 * the format the image dispatchers produce. */
function inferExt(mime, url) {
  const m = (mime || '').toLowerCase();
  if (m.includes('png'))  return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('gif'))  return 'gif';
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';

  const path = (url || '').split('?')[0];
  const dot = path.lastIndexOf('.');
  if (dot >= 0) {
    const ext = path.slice(dot + 1).toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }
  return 'jpg';
}
