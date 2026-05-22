import { Trash } from 'iconsax-react';
import { ChevronDownIcon } from '@features/navigation';
import { cn } from '@lib/cn';
import { formatBrandDate } from '../lib/formatDate';

/* Single brand card.
 *
 * Layout (top → bottom):
 *   - Gradient banner (decorative)
 *   - Square logo, half on banner / half on body, centered
 *   - Brand name (centered)
 *   - Stats rows (label on right / value on left in RTL)
 *   - "פרויקט חדש" outline button at the bottom
 *
 * Interactions:
 *   - The whole card is clickable → opens the brand drawer (TODO, wired later).
 *   - On hover, a delete button surfaces at the top-end (left in RTL).
 *     It stops propagation so deleting doesn't also fire the card click.
 *   - The "פרויקט חדש" footer button likewise stops propagation.
 *
 * The delete button sits at `top-3 end-3`. `end-*` is RTL-aware: it lands
 * on the visual LEFT in dir=rtl (which is what the screenshot shows) and
 * automatically flips to the right in any future LTR context.
 */
export function BrandCard({ brand, onOpen, onDelete, onCreateProject }) {
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
        'cursor-pointer'
      )}
    >
      {/* Decorative banner. The gradient fades from a soft slate to near-black,
          giving the white logo plate something to sit against. */}
      <div className="h-[110px] bg-gradient-to-l from-slate-200 via-slate-500 to-slate-900" />

      {/* Logo plate. Absolutely positioned so the body padding below stays
          calm — the plate juts up into the banner by half its height. */}
      <div className="-mt-12 flex justify-center">
        <BrandLogo brand={brand} />
      </div>

      {/* Hover-only delete control. Hidden by default, fades in on
          group-hover or when focused. End-aligned in RTL = visual left. */}
      <button
        type="button"
        aria-label={`מחיקת המותג ${brand.name}`}
        onClick={handleDeleteClick}
        className={cn(
          'absolute top-3 end-3 inline-flex h-9 w-9 items-center justify-center',
          'rounded-full bg-white/90 backdrop-blur-sm text-danger shadow-soft',
          'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          'transition-opacity duration-150',
          'hover:bg-white hover:text-danger'
        )}
      >
        <Trash size="18" variant="Bold" color="currentColor" />
      </button>

      {/* Body */}
      <div className="px-5 pt-3 pb-5 flex flex-col gap-3" dir="rtl">
        <h3 className="text-center text-lg font-extrabold text-ink">
          {brand.name}
        </h3>

        <dl className="space-y-1.5 text-sm text-ink-muted">
          <Row
            label="כמות פרויקטים"
            value={String(brand.projectCount ?? 0)}
          />
          <Row
            label="תאריך שינוי אחרון"
            value={formatBrandDate(brand.updatedAt)}
          />
        </dl>

        <button
          type="button"
          onClick={handleCreateClick}
          className={cn(
            'mt-1 self-start inline-flex items-center gap-1.5',
            'rounded-xl border border-line bg-white px-3 py-1.5',
            'text-sm font-bold text-ink',
            'hover:border-brand-300 hover:bg-brand-50/50 transition-colors'
          )}
        >
          <span>פרויקט חדש</span>
          {/* Chevron points "forward" in RTL (visual left). Reusing the
              navigation chevron keeps the icon vocabulary consistent. */}
          <ChevronDownIcon className="h-4 w-4 -rotate-90 text-brand-500" />
        </button>
      </div>
    </article>
  );
}

/* Logo plate. Falls back to a colored initial chip when no logoUrl is set
 * — handy until brand creation flows through the real upload pipeline. */
function BrandLogo({ brand }) {
  const initial = brand.name?.trim()?.[0]?.toUpperCase() ?? '?';
  return (
    <div className="h-20 w-20 rounded-2xl bg-white shadow-card border border-line p-2 flex items-center justify-center">
      {brand.logoUrl ? (
        <img
          src={brand.logoUrl}
          alt={brand.name}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="text-2xl font-extrabold text-brand-500">
          {initial}
        </span>
      )}
    </div>
  );
}

function Row({ label, value }) {
  /* DOM order [label, value] → in RTL with justify-between, label lands on
   * the right and value on the left. Reads as label-then-value in Hebrew. */
  return (
    <div className="flex items-center justify-between">
      <dt>{label}</dt>
      <dd className="font-bold text-ink">{value}</dd>
    </div>
  );
}
