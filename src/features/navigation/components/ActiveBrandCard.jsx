import { useEffect, useRef, useState } from 'react';
import { useActiveBrand } from '@/contexts/BrandsContext';
import { cn } from '@lib/cn';
import { ChevronDownIcon } from './icons';
import { BrandPickerPopover } from './BrandPickerPopover';

/* Sidebar's "active brand" card.
 *
 * Reads the active brand from BrandsContext. When a brand is active,
 * clicking the card opens BrandPickerPopover so the user can switch
 * between their brands. The popover floats ABOVE the card (so it
 * doesn't get clipped by the user card / sign-out row below) and
 * closes on outside click or ESC.
 *
 * No active brand → render a static "אין מותג" tile. NOT interactive,
 * no chevron, no placeholder logo. Honest "nothing here yet" signal;
 * users go to /app/brands (sidebar item) to create their first brand.
 *
 * RTL DOM order [name, logo+chevron] → name on the right (start),
 * action affordance cluster on the left (end).
 */
export function ActiveBrandCard() {
  const { activeBrand } = useActiveBrand();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  /* Empty state — fully static, no popover, no chevron. Same outer
   * dimensions as the active state so the sidebar layout doesn't
   * jump when a brand becomes active. */
  if (!activeBrand) {
    return (
      <div
        className={cn(
          'w-full rounded-card bg-white border border-line',
          'px-4 py-3 text-right',
        )}
        aria-label="אין מותג פעיל"
      >
        <span className="text-base font-bold text-ink-soft">אין מותג</span>
      </div>
    );
  }

  /* Close on outside click. mousedown beats click → the popover doesn't
   * see "clicked outside" before its own row click fires. */
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (popoverRef.current?.contains(e.target)) return;
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

  /* The empty-brand branch above guarantees activeBrand is non-null
   * here, so the logo fallback and "אין מותג פעיל" fallback name are
   * no longer needed — the card is always rendering a real brand. */
  const { name: displayName, logoUrl } = activeBrand;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between gap-3 rounded-card',
          'bg-white border border-line px-4 py-3 text-right',
          'hover:border-brand-200 transition-colors',
          open && 'border-brand-300'
        )}
      >
        <span className="flex-1 font-bold text-base truncate text-ink">
          {displayName}
        </span>
        <div className="flex gap-2 items-center">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={displayName}
              className="w-9 h-9 shrink-0 rounded-md object-contain border border-line bg-white"
            />
          )}
          <ChevronDownIcon
            className={cn(
              'h-4 w-4 shrink-0 text-brand-500 transition-transform duration-200',
              open && 'rotate-180'
            )}
            variant="Bold"
          />
        </div>
      </button>

      {open && (
        <BrandPickerPopover
          ref={popoverRef}
          onClose={() => setOpen(false)}
          onManage={() => setOpen(false)}
        />
      )}
    </div>
  );
}
