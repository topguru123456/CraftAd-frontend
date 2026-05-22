import { useCallback, useState } from 'react';
import { ArrowDown2, SearchNormal1 } from 'iconsax-react';
import { cn } from '@lib/cn';
import { creativeImagesApi } from '@features/projects/flows/campaign-creative/api/creative-images.api';

/* Stock-photos surface — pure search-and-download utility.
 *
 * Differs from the four other project-type flows in a load-bearing
 * way: stock-photos does NOT create a `projects` row. There is no
 * wizard, no draft, no submit. The user types a keyword, sees Pexels
 * results, and downloads any image directly to disk. The Flow is
 * registered in the same `project-flows.registry.js` so the catalogue
 * tile + route stay uniform with the others, but the `onCancel` /
 * `onComplete` props the shared ProjectCreationPage hands in are
 * intentionally unused here — there is nothing to cancel and nothing
 * to navigate to on "complete." Global navigation lives in the sidebar.
 *
 * Data path:
 *   1. searchPexels (existing `/images/pexels/search` endpoint, API
 *      key stays server-side) → returns shaped photo list with src
 *      variants (medium for the grid tile, original for download).
 *   2. On download click: client-side fetch of the original CDN URL →
 *      Blob → object-URL → anchor.download → click. No server
 *      roundtrip for the download itself; we don't save the image
 *      anywhere on our side per product decision (this is a
 *      utility, not a library).
 *
 * Cross-origin download note: Pexels CDN serves with permissive CORS,
 * so the fetch→blob trick works reliably without a server proxy. If
 * Pexels ever tightens CORS, the fix is to add a `/images/pexels/download`
 * backend endpoint that streams the bytes with Content-Disposition:
 * attachment; until then, no need for the extra surface.
 *
 * Attribution: Pexels' API ToS requires a link to pexels.com on any
 * surface using their photos. The Footer carries the site-wide link;
 * per-photo photographer credit shows on the tile (mirrors the
 * PexelsPickerModal pattern in campaign-creative).
 *
 * File-location note: imports creativeImagesApi from
 * campaign-creative/api/. The senior audit flagged that module has
 * drifted into a single-flow folder despite being shared across
 * product-images, video-creative, and now stock-photos. Moving it to
 * `flows/shared/` is tracked as a separate cleanup; adding a 4th
 * consumer here doesn't justify dragging the rename into this turn. */

const PER_PAGE = 24;

export function StockPhotosFlow() {
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  /* status state machine:
   *   'idle'      — first paint, no search yet
   *   'searching' — request in flight
   *   'results'   — got photos (may be empty list)
   *   'error'     — search failed (download errors live in errorMessage but don't change status) */
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);
  /* Set of photo ids currently being downloaded. Per-card, NOT a
   * single id — downloads are independent fetches against the Pexels
   * CDN, so there's no reason one in-flight download should block
   * another (an earlier version did this as a "spam-click guard"
   * but it created the wrong UX signal: "this app can only download
   * one at a time" rather than "this card is busy"). Each tile reads
   * `downloadingIds.has(photo.id)` to render its own spinner; siblings
   * stay clickable. */
  const [downloadingIds, setDownloadingIds] = useState(() => new Set());

  const runSearch = useCallback(
    async (nextPage = 1) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setStatus('searching');
      setErrorMessage(null);

      const { data, error } = await creativeImagesApi.searchPexels({
        query: trimmed,
        page: nextPage,
        perPage: PER_PAGE,
      });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message ?? 'החיפוש נכשל. נסו שוב.');
        return;
      }

      const next = data?.photos ?? [];
      /* Pexels pagination occasionally returns the same photo across
       * pages — dedupe by id so React keys stay unique and the user
       * doesn't see the same tile twice on "load more". */
      setPhotos((prev) => {
        if (nextPage === 1) return next;
        const seen = new Set(prev.map((p) => p.id));
        return prev.concat(next.filter((p) => !seen.has(p.id)));
      });
      setPage(data?.page ?? nextPage);
      setHasMore(Boolean(data?.nextPage));
      setStatus('results');
    },
    [query],
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(1);
  };

  const handleLoadMore = () => {
    if (status === 'searching') return;
    runSearch(page + 1);
  };

  /* Download flow: fetch the Pexels CDN bytes client-side, wrap in a
   * blob, trigger an anchor.download click, revoke the object URL.
   *
   * Why fetch→blob instead of a plain `<a href download>`: the
   * `download` attribute is ignored for cross-origin URLs unless the
   * server sends Content-Disposition: attachment, which Pexels does
   * NOT — so a direct anchor would just navigate to the image. The
   * fetch→blob path keeps everything client-side and gives us a
   * proper file save dialog.
   *
   * Concurrency: multiple downloads can run in parallel. The same-id
   * guard below (Set.has on entry) prevents a single card's button
   * from firing twice if the user double-clicks before the first
   * resolves — but DIFFERENT cards never block each other. */
  const handleDownload = useCallback(async (photo) => {
    const url = photo.src?.original ?? photo.src?.large ?? photo.src?.medium;
    if (!url) return;

    let alreadyInFlight = false;
    setDownloadingIds((prev) => {
      if (prev.has(photo.id)) {
        alreadyInFlight = true;
        return prev;
      }
      const next = new Set(prev);
      next.add(photo.id);
      return next;
    });
    if (alreadyInFlight) return;

    setErrorMessage(null);
    try {
      const response = await fetch(url, { credentials: 'omit' });
      if (!response.ok) {
        throw new Error(`download failed (${response.status})`);
      }
      const blob = await response.blob();

      const objectUrl = URL.createObjectURL(blob);
      const ext = inferExt(blob.type ?? 'image/jpeg', url);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `pexels-${photo.id}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.warn('[StockPhotosFlow] download failed:', err);
      setErrorMessage('ההורדה נכשלה. נסו שוב או בחרו תמונה אחרת.');
    } finally {
      setDownloadingIds((prev) => {
        if (!prev.has(photo.id)) return prev;
        const next = new Set(prev);
        next.delete(photo.id);
        return next;
      });
    }
  }, []);

  /* "Paginating" = a search request is in flight AND we already have
   * results showing. Used to give the load-more button its own loading
   * state without affecting the initial-search empty/skeleton path
   * above (which keys off `searching && photos.length === 0`). */
  const isPaginating = status === 'searching' && photos.length > 0;

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <Header />

      <SearchBar
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSubmit}
        disabled={status === 'searching'}
      />

      {errorMessage && (
        <p className="text-sm text-danger text-right">{errorMessage}</p>
      )}

      {status === 'idle' && photos.length === 0 && (
        <EmptyHint message='חפשו תמונה לפי מילת מפתח באנגלית או בעברית, למשל "coffee" או "רהיט מודרני".' />
      )}

      {status === 'searching' && photos.length === 0 && <SkeletonGrid />}

      {photos.length > 0 && (
        <ResultsGrid
          photos={photos}
          onDownload={handleDownload}
          downloadingIds={downloadingIds}
        />
      )}

      {status === 'results' && photos.length === 0 && (
        <EmptyHint message="לא נמצאו תוצאות. נסו מילת חיפוש אחרת." />
      )}

      {/* Pagination: button stays in the same spot but switches to a
        * spinner+text loading state during the in-flight fetch. The
        * derived `isPaginating` (searching AND we already have results)
        * distinguishes a "load more" round-trip from the initial
        * search — the initial search has its own SkeletonGrid above
        * since there's nothing to anchor the spinner to yet. */}
      {hasMore && (status === 'results' || isPaginating) && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPaginating}
            aria-busy={isPaginating}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5',
              'text-sm font-bold border transition-colors',
              isPaginating
                ? 'border-brand-100 text-brand-300 bg-white cursor-wait'
                : 'border-brand-200 text-brand-500 bg-white hover:bg-brand-50',
            )}
          >
            {isPaginating ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin"
                />
                <span>טוען...</span>
              </>
            ) : (
              <span>טען עוד תוצאות</span>
            )}
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="text-right space-y-2">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
        תמונות מאגר מקצועיות
      </h1>
      <p className="text-sm sm:text-base text-ink-muted leading-relaxed max-w-3xl ms-auto">
        גלו מגוון רחב של תמונות איכותיות לשימוש חופשי בפרויקטים שלכם.
        בחרו את התמונות שמתאימות למותג שלכם והוסיפו אותן בקלות לעיצוב.
      </p>
    </header>
  );
}

function SearchBar({ query, onQueryChange, onSubmit, disabled }) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-3">
      <div className="relative flex-1">
        <SearchNormal1
          size="18"
          color="#94A3B8"
          variant="Linear"
          className="absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="חפשו תמונה..."
          dir="rtl"
          disabled={disabled}
          className={cn(
            'w-full rounded-xl border border-line bg-white',
            'pe-10 ps-4 py-2.5 text-md text-ink placeholder:text-ink-soft text-right',
            'focus:border-brand-300 focus:outline-none focus:shadow-focus',
            disabled && 'opacity-70 cursor-not-allowed',
          )}
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !query.trim()}
        className={cn(
          'inline-flex items-center justify-center rounded-xl px-5 py-2.5',
          'text-sm font-bold transition-colors',
          query.trim() && !disabled
            ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
            : 'bg-brand-100 text-brand-300 cursor-not-allowed',
        )}
      >
        חיפוש
      </button>
    </form>
  );
}

function ResultsGrid({ photos, onDownload, downloadingIds }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onDownload={() => onDownload(photo)}
          isDownloading={downloadingIds.has(photo.id)}
        />
      ))}
    </div>
  );
}

function PhotoCard({ photo, onDownload, isDownloading }) {
  const src = photo.src?.medium ?? photo.src?.small;
  return (
    <article className="rounded-2xl border border-line bg-white overflow-hidden shadow-soft">
      <div className="relative aspect-[4/3] bg-surface-muted">
        {src && (
          <img
            src={src}
            alt={photo.alt || ''}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {photo.photographer && (
          <span
            className={cn(
              'absolute bottom-0 inset-x-0 px-2 py-1 text-[11px] truncate text-right',
              'bg-gradient-to-t from-black/60 to-transparent text-white',
            )}
          >
            {photo.photographer}
          </span>
        )}
      </div>
      <div className="p-3">
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          aria-busy={isDownloading}
          aria-label={`הורדת תמונה מאת ${photo.photographer || 'Pexels'}`}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2',
            'rounded-xl py-2.5 text-sm font-bold transition-opacity',
            isDownloading
              ? 'bg-brand-300 text-white cursor-wait'
              : 'bg-brand-gradient text-white shadow-brand hover:opacity-95',
          )}
        >
          {isDownloading ? (
            <>
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
              />
              <span>מוריד...</span>
            </>
          ) : (
            <>
              <ArrowDown2 size="16" color="currentColor" variant="Bold" />
              <span>הורדה</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-line bg-white shadow-soft overflow-hidden"
        >
          <div className="aspect-[4/3] bg-surface-muted animate-pulse" />
          <div className="p-3">
            <div className="h-10 rounded-xl bg-brand-50 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyHint({ message }) {
  return (
    <div className="py-16 text-center text-ink-soft text-sm">{message}</div>
  );
}

function Footer() {
  return (
    <footer className="pt-4 border-t border-line">
      <p className="text-xs text-ink-soft text-right">
        תמונות באדיבות{' '}
        <a
          href="https://www.pexels.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-500 hover:underline"
        >
          Pexels
        </a>
      </p>
    </footer>
  );
}

/* MIME → file extension. Pexels CDN URLs often carry query params
 * (?auto=compress&...) so a URL-path sniff can lie about the real
 * type; trust the blob's MIME first, then fall back to a known-good
 * extension in the URL path, then a final 'jpg' default that matches
 * Pexels' overwhelming format. */
function inferExt(mime, url) {
  const m = mime.toLowerCase();
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('gif')) return 'gif';
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';

  const path = url.split('?')[0];
  const dot = path.lastIndexOf('.');
  if (dot >= 0) {
    const ext = path.slice(dot + 1).toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
  }
  return 'jpg';
}
