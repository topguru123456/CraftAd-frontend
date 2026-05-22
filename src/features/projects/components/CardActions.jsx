import { Archive, ArchiveTick } from 'iconsax-react';
import { cn } from '@lib/cn';
import EditIcon from '@assets/icons/edit.svg';

/* Shared action primitives used by every variant card's bottom bar
 * — image cards (ImageResultsView) and copywriting cards
 * (CopywritingResults) both render BookmarkAction + EditAction so
 * the action row looks identical across project types. The primary
 * action on the right (download for images, copy for text) is
 * flow-specific and stays local to each card. */

export function BookmarkAction({ bookmarked, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={bookmarked ? 'הסר מהשמורים' : 'שמור'}
      aria-pressed={bookmarked}
      className={cn(
        'inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors',
        bookmarked
          ? 'bg-brand-50 text-brand-500 border border-brand-200'
          : 'bg-white text-brand-400 border border-brand-100 hover:text-brand-500 hover:border-brand-300',
      )}
    >
      {bookmarked ? (
        <ArchiveTick size="18" variant="Bold" color="currentColor" />
      ) : (
        <Archive size="18" variant="Linear" color="currentColor" />
      )}
    </button>
  );
}

export function EditAction({ onClick, label = 'עריכה' }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3.5 h-9',
        'text-sm font-bold bg-white border border-brand-200 text-brand-500',
        'hover:border-brand-300 hover:bg-brand-50/40 transition-colors',
      )}
    >
      <img src={EditIcon} alt="" className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}
