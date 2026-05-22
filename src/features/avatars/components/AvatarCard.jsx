import { ArrowLeft2 } from 'iconsax-react';
import { cn } from '@lib/cn';
import EditIcon from '@assets/icons/edit.svg';

/* One persona tile — landscape layout (width > height).
 *
 * Portrait sits on the visual right (RTL start) as a compact square
 * thumbnail; title + "עריכת אווטאר" link stack on the visual left
 * (RTL end). Reads like a contact card. Smaller overall footprint
 * than the old top-portrait variant so the gallery fits more
 * personas above the fold. Regenerate + delete live inside the
 * edit drawer, not on the card. */

export function AvatarCard({ avatar, onEdit, regenerating }) {
  const title = (avatar.title ?? '').trim() || 'אווטאר';

  return (
    <article
      dir="rtl"
      className={cn(
        'group relative rounded-2xl bg-white border border-line overflow-hidden',
        'shadow-[0_4px_16px_rgba(237,86,153,0.08)]',
        'hover:shadow-[0_14px_32px_rgba(237,86,153,0.18)] hover:-translate-y-1',
        'transition-all duration-200 ease-out',
        'flex items-stretch gap-4 p-3',
      )}
    >
      <Portrait url={avatar.portraitUrl} regenerating={regenerating} alt={title} />

      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <h3 className="text-base sm:text-lg font-extrabold text-ink truncate">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 self-start text-sm font-bold text-brand-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft2 size="14" variant="Linear" color="currentColor" />
          <span>עריכת אווטאר</span>
        </button>
      </div>
    </article>
  );
}

function Portrait({ url, regenerating, alt }) {
  const baseClass = 'shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-surface-muted';

  if (regenerating) {
    return (
      <div className={cn(baseClass, 'flex items-center justify-center')}>
        <span
          aria-hidden="true"
          className="h-7 w-7 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin"
        />
      </div>
    );
  }
  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        className={cn(baseClass, 'object-cover block')}
      />
    );
  }
  return (
    <div className={cn(baseClass, 'bg-surface-muted/50 flex items-center justify-center')}>
      <img src={EditIcon} alt="" className="w-7 h-7 opacity-40" />
    </div>
  );
}
