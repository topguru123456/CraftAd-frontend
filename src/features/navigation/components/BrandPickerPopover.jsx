import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useBrands, useActiveBrand } from '@/contexts/BrandsContext';
import { ROUTES } from '@config/routes';
import { cn } from '@lib/cn';
import { DeployBrandPlaceholder } from './icons';

/* Brand picker dropdown anchored under ActiveBrandCard.
 *
 * Lists every brand the user has, with their logo + name. Clicking a row
 * sets it active and closes the popover; the active brand cascades to:
 *   - the sidebar's ActiveBrandCard (re-renders with the new brand)
 *   - AppHeader's logo
 *   - any feature reading useActiveBrand (projects, avatars, creative-
 *     score, inspired-creation)
 *
 * The "ניהול מותגים" link at the bottom navigates to /app/brands so the
 * user can create / delete brands.
 *
 * `forwardRef` so the parent (ActiveBrandCard) can attach a ref for its
 * outside-click handler. */
export const BrandPickerPopover = forwardRef(function BrandPickerPopover(
  { onClose, onManage },
  ref
) {
  const { brands, loading } = useBrands();
  const { activeBrand, setActiveBrand } = useActiveBrand();

  const handlePick = (brand) => {
    setActiveBrand(brand.id);
    onClose?.();
  };

  return (
    <div
      ref={ref}
      role="menu"
      dir="rtl"
      className={cn(
        /* Anchored above the trigger so it doesn't get clipped by the
         * card lower in the sidebar. `bottom-full` + `mb-2` keeps a
         * small gap so the popover visibly floats. */
        'absolute bottom-full left-0 right-0 mb-2 z-30',
        'rounded-card bg-white border border-line shadow-card',
        'overflow-hidden animate-fade-in'
      )}
    >
      <p className="px-4 pt-3 pb-2 text-xs font-bold text-ink-muted">
        החליפו מותג
      </p>

      {loading && brands.length === 0 ? (
        <div className="px-4 pb-3 text-sm text-ink-muted">טוען מותגים…</div>
      ) : brands.length === 0 ? (
        <div className="px-4 pb-3 text-sm text-ink-muted">
          עדיין אין מותגים. צרו אחד כדי להתחיל.
        </div>
      ) : (
        <ul className="max-h-72 overflow-y-auto scrollbar-brand">
          {brands.map((brand) => {
            const isActive = activeBrand?.id === brand.id;
            return (
              <li key={brand.id}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => handlePick(brand)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-right',
                    'transition-colors',
                    isActive
                      ? 'bg-brand-50/60'
                      : 'hover:bg-surface-muted/70'
                  )}
                >
                  {/* RTL DOM: name on right (start), logo + check on left. */}
                  <span
                    className={cn(
                      'flex-1 truncate text-sm',
                      isActive ? 'font-bold text-ink' : 'text-ink'
                    )}
                  >
                    {brand.name}
                  </span>
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-md object-contain border border-line bg-white"
                    />
                  ) : (
                    <DeployBrandPlaceholder className="h-7 w-7 shrink-0" />
                  )}
                  {isActive && (
                    <CheckGlyph className="h-4 w-4 shrink-0 text-brand-500" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-line">
        <Link
          to={ROUTES.app.brands}
          onClick={onManage}
          className={cn(
            'flex items-center justify-end gap-2 px-4 py-2.5',
            'text-sm font-bold text-brand-500 hover:bg-brand-50/40 transition-colors'
          )}
        >
          ניהול מותגים
        </Link>
      </div>
    </div>
  );
});

function CheckGlyph({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5L10 17.5L19 7.5" />
    </svg>
  );
}
