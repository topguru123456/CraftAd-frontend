import { useCallback, useEffect, useRef, useState } from 'react';
import { SearchNormal1 } from 'iconsax-react';
import { Modal } from '@components/ui';
import { cn } from '@lib/cn';
import { creativeImagesApi } from '../api/creative-images.api';

/* Pexels library picker.
 *
 * Two-step UX in one modal:
 *   1. User types a search; results appear in a responsive grid.
 *   2. User clicks a result; we mirror it server-side to our
 *      campaign-uploads bucket and hand back the public URL via
 *      `onSelect({ url, path, pexelsId })`. Modal closes.
 *
 * State machine (`status`):
 *   'idle'      — picker just opened, no query yet
 *   'searching' — request in flight; show skeleton
 *   'results'   — got photos; show grid (could be empty)
 *   'importing' — user clicked a result; pexels-import is mirroring
 *                 the bytes to our bucket; freeze the grid + spinner
 *                 the picked tile
 *   'error'     — search or import failed; show message
 *
 * Why we don't auto-search on a debounce: the Pexels quota is finite
 * and Hebrew users especially type slow / consider word order, so a
 * keystroke debounce would burn calls without helping. Explicit
 * Enter / button-click is cheaper and more predictable.
 *
 * Search seed: per product decision, the picker opens empty. Users
 * type their own query rather than us guessing from draft.itemName.
 *
 * Pagination: simple "load more" button at the bottom. Pexels
 * returns `next_page` (URL) when there's more; we just track our
 * own page counter and append the new photos to the existing list.
 */
const PER_PAGE = 24;

export function PexelsPickerModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);
  const [importingId, setImportingId] = useState(null);

  /* Reset all state when the modal closes so the next open starts
   * clean. Tying this to `open` (not unmount) means we don't lose
   * results during a temporary focus shift, but a deliberate close
   * + reopen presents a blank picker as expected. */
  useEffect(() => {
    if (!open) {
      setQuery('');
      setPhotos([]);
      setPage(1);
      setHasMore(false);
      setStatus('idle');
      setErrorMessage(null);
      setImportingId(null);
    }
  }, [open]);

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

      const nextPhotos = data?.photos ?? [];
      // Pexels pagination occasionally returns the same photo across
      // pages — dedupe by id to keep React keys unique.
      setPhotos((prev) => {
        if (nextPage === 1) return nextPhotos;
        const seen = new Set(prev.map((p) => p.id));
        return prev.concat(nextPhotos.filter((p) => !seen.has(p.id)));
      });
      setPage(data?.page ?? nextPage);
      setHasMore(Boolean(data?.nextPage));
      setStatus('results');
    },
    [query]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    runSearch(1);
  };

  const handleLoadMore = () => {
    if (status === 'searching') return;
    runSearch(page + 1);
  };

  const handlePick = async (photo) => {
    if (status === 'importing') return;
    const url = photo.src?.large ?? photo.src?.medium ?? photo.src?.original;
    if (!url) return;

    setImportingId(photo.id);
    setStatus('importing');
    setErrorMessage(null);

    const { data, error } = await creativeImagesApi.importPexels({
      url,
      id: photo.id,
    });

    if (error) {
      setStatus('results');
      setImportingId(null);
      setErrorMessage(error.message ?? 'העתקת התמונה נכשלה. נסו שוב.');
      return;
    }

    onSelect?.({ url: data.url, path: data.path, pexelsId: photo.id });
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      ariaLabel="בחירה ממאגר התמונות"
      panelClassName="bg-white"
    >
      <div dir="rtl" className="flex flex-col max-h-[85vh]">
        <Header />

        <SearchBar
          query={query}
          onQueryChange={setQuery}
          onSubmit={handleSubmit}
          disabled={status === 'searching' || status === 'importing'}
        />

        <div className="flex-1 overflow-y-auto scrollbar-brand px-5 sm:px-7 pb-6">
          {errorMessage && (
            <p className="mb-3 text-sm text-danger text-right">
              {errorMessage}
            </p>
          )}

          {status === 'idle' && (
            <EmptyHint message="חפשו תמונה לפי מילת מפתח באנגלית או בעברית, למשל ״coffee״ או ״רהיט מודרני״." />
          )}

          {status === 'searching' && photos.length === 0 && <SkeletonGrid />}

          {(status === 'results' || status === 'searching' || status === 'importing' || status === 'error') &&
            photos.length > 0 && (
              <ResultsGrid
                photos={photos}
                onPick={handlePick}
                importingId={importingId}
                disabled={status === 'importing'}
              />
            )}

          {status === 'results' && photos.length === 0 && (
            <EmptyHint message="לא נמצאו תוצאות. נסו מילת חיפוש אחרת." />
          )}

          {status === 'results' && hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className={cn(
                  'inline-flex items-center justify-center rounded-xl px-5 py-2.5',
                  'text-sm font-bold border border-brand-200 text-brand-500 bg-white',
                  'hover:bg-brand-50 transition-colors'
                )}
              >
                טען עוד תוצאות
              </button>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </Modal>
  );
}

function Header() {
  return (
    <header className="px-5 sm:px-7 pt-6 pb-3 border-b border-line">
      <h2 className="text-xl sm:text-2xl font-extrabold text-ink text-right">
        בחירה ממאגר התמונות
      </h2>
      <p className="mt-1 text-sm text-ink-muted text-right">
        תמונות מתוך מאגר Pexels. בחירת תמונה תעתיק אותה לחשבון שלכם
        ותחזיר אתכם לאשף.
      </p>
    </header>
  );
}

function SearchBar({ query, onQueryChange, onSubmit, disabled }) {
  /* The icon is on the visual RIGHT inside an RTL form group (DOM[0]).
   * Inputs get a right-padding inset so user-typed text doesn't
   * collide with the icon. */
  const inputRef = useRef(null);
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus({ preventScroll: true });
  }, []);

  return (
    <form
      onSubmit={onSubmit}
      className="px-5 sm:px-7 py-4 border-b border-line flex items-center gap-3"
    >
      <div className="relative flex-1">
        <SearchNormal1
          size="18"
          color="#94A3B8"
          variant="Linear"
          className="absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none"
        />
        <input
          ref={inputRef}
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
            disabled && 'opacity-70 cursor-not-allowed'
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
            : 'bg-brand-100 text-brand-300 cursor-not-allowed'
        )}
      >
        חיפוש
      </button>
    </form>
  );
}

function ResultsGrid({ photos, onPick, importingId, disabled }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-5">
      {photos.map((photo) => {
        const src = photo.src?.medium ?? photo.src?.small;
        const isImporting = photo.id === importingId;
        return (
          <button
            key={photo.id}
            type="button"
            onClick={() => onPick(photo)}
            disabled={disabled}
            className={cn(
              'group relative overflow-hidden rounded-xl border border-line bg-surface-muted',
              'aspect-square focus:outline-none focus:ring-2 focus:ring-brand-300',
              'transition-transform',
              disabled && !isImporting && 'opacity-60 cursor-not-allowed',
              !disabled && 'hover:border-brand-300 hover:scale-[1.01]'
            )}
            aria-label={photo.alt || `Pexels photo by ${photo.photographer}`}
          >
            {src && (
              <img
                src={src}
                alt={photo.alt || ''}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {isImporting && (
              <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center">
                <span
                  aria-hidden="true"
                  className="h-8 w-8 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
                />
              </div>
            )}
            {photo.photographer && (
              <span
                className={cn(
                  'absolute bottom-0 inset-x-0 px-2 py-1 text-[10px] truncate text-right',
                  'bg-gradient-to-t from-black/60 to-transparent text-white',
                  'opacity-0 group-hover:opacity-100 transition-opacity'
                )}
              >
                {photo.photographer}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-xl bg-surface-muted animate-pulse"
        />
      ))}
    </div>
  );
}

function EmptyHint({ message }) {
  return (
    <div className="py-16 text-center text-ink-soft text-sm">
      {message}
    </div>
  );
}

function Footer() {
  /* Pexels' API ToS requires an attribution link to pexels.com on any
   * surface that uses their photos. The footer link satisfies that
   * for the picker; we'll add per-photo photographer credit on the
   * preview once the image is selected (handled in ImagesStep). */
  return (
    <footer className="px-5 sm:px-7 py-3 border-t border-line">
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
