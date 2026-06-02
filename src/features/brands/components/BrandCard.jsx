import { Trash } from 'iconsax-react';
import { ChevronDownIcon } from '@features/navigation';
import { cn } from '@lib/cn';
import { formatBrandDate } from '../lib/formatDate';

const FALLBACK_BANNER = 'linear-gradient(to right, rgb(241, 245, 249), rgb(203, 213, 225))';

/* `1A` is 10% opacity in 8-digit hex — soft fade from a tinted light
 * shade on the left to the full brand color on the right (where the
 * logo plate sits). */
function bannerStyle(brand) {
  const hex = brand?.colors?.[0]?.hex;
  if (typeof hex !== 'string' || !/^#[0-9a-f]{6}$/i.test(hex)) return FALLBACK_BANNER;
  return `linear-gradient(to right, ${hex}1A, ${hex})`;
}

export function BrandCard({ brand, onOpen, onDelete, onCreateProject }) {
  const needsAvatarSetup = !brand.avatarCount;

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    onDelete?.(brand);
  };

  const handleCreateClick = (event) => {
    event.stopPropagation();
    onCreateProject?.(brand);
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(brand)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen?.(brand);
        }
      }}
      className={cn(
        'group relative flex flex-col bg-white border border-line rounded-2xl overflow-hidden',
        'shadow-soft transition-shadow duration-200',
        'hover:shadow-card focus-visible:shadow-card focus-visible:outline-none',
        'cursor-pointer',
      )}
    >
      <div className="h-[70px]" style={{ background: bannerStyle(brand) }} />

      <div className="-mt-10 flex">
        <div className="ms-6 flex flex-col items-center">
          <BrandLogo brand={brand} />
          <h3 className="mt-3 text-xl font-extrabold text-ink whitespace-nowrap">
            {brand.name}
          </h3>
        </div>
      </div>

      <button
        type="button"
        aria-label={`מחיקת המותג ${brand.name}`}
        onClick={handleDeleteClick}
        className={cn(
          'absolute top-3 end-3 inline-flex h-9 w-9 items-center justify-center',
          'rounded-full bg-white/90 backdrop-blur-sm text-danger shadow-soft',
          'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          'transition-opacity duration-150',
          'hover:bg-white hover:text-danger',
        )}
      >
        <Trash size="18" variant="Bold" color="currentColor" />
      </button>

      <div className="px-5 pt-3 pb-5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-sm text-ink-muted">
          <span>
            כמות פרויקטים{' '}
            <span className="font-bold text-ink">{brand.projectCount ?? 0}</span>
          </span>
          {needsAvatarSetup && (
            <span className="inline-flex items-center rounded-full bg-brand-100 text-brand-500 text-xs font-medium px-3 py-1 whitespace-nowrap">
              מומלץ להגדיר אווטארים
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-ink-muted">
            תאריך שינוי אחרון:{' '}
            <span className="font-bold text-ink">{formatBrandDate(brand.updatedAt)}</span>
          </div>
          <button
            type="button"
            onClick={handleCreateClick}
            className={cn(
              'inline-flex items-center gap-1.5',
              'rounded-xl border border-line bg-white px-3 py-1.5',
              'text-sm font-bold text-ink',
              'hover:border-brand-300 hover:bg-brand-50/50 transition-colors',
            )}
          >
            <span>פרויקט חדש</span>
            <ChevronDownIcon className="h-4 w-4 rotate-90 text-ink" />
          </button>
        </div>
      </div>
    </article>
  );
}

function BrandLogo({ brand }) {
  const initial = brand.name?.trim()?.[0]?.toUpperCase() ?? '?';
  return (
    <div className="h-20 w-20 rounded-2xl bg-white shadow-card border border-line p-2 flex items-center justify-center">
      {brand.logoUrl ? (
        <img src={brand.logoUrl} alt={brand.name} className="h-full w-full object-contain" />
      ) : (
        <span className="text-2xl font-extrabold text-brand-500">{initial}</span>
      )}
    </div>
  );
}
