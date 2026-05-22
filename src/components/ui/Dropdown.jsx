import { useEffect, useRef, useState } from 'react';
import { ArrowDown2 } from 'iconsax-react';
import { cn } from '@lib/cn';

/* Single-select dropdown.
 *
 * Use this for "pick exactly one from a frozen taxonomy" form fields
 * (campaign goal, conversion location, project type, …). Pairs with
 * any taxonomy whose entries have `{ id, label }`.
 *
 * Differs from `TaxonomySelect` (in features/brands): no pill row
 * underneath — the trigger itself shows the selected label, like a
 * native `<select>`. That's the right shape for form fields where the
 * value lives inside the field rather than as a removable chip.
 *
 * Auto-flips above the trigger when there isn't enough space below
 * (matches the same pattern used by TaxonomySelect — important inside
 * scrollable containers like drawers / page wrappers).
 */
const MENU_DESIRED_HEIGHT = 280;

export function Dropdown({
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
  invalid = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState('bottom');
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);

  /* Outside-click + ESC. Mousedown beats click → row click on the menu
   * still fires before the outside check resolves. */
  useEffect(() => {
    if (!open) return;
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

  /* Re-evaluate placement on scroll/resize. Capture-phase scroll catches
   * scrolls on any ancestor (page-level or panel). */
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (!trigger) return;

    const updatePlacement = () => {
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow >= MENU_DESIRED_HEIGHT || spaceBelow >= spaceAbove) {
        setPlacement('bottom');
      } else {
        setPlacement('top');
      }
    };

    updatePlacement();
    window.addEventListener('scroll', updatePlacement, true);
    window.addEventListener('resize', updatePlacement);
    return () => {
      window.removeEventListener('scroll', updatePlacement, true);
      window.removeEventListener('resize', updatePlacement);
    };
  }, [open]);

  const selected = options.find((o) => o.id === value);

  return (
    <div ref={wrapRef} className="relative" dir="rtl">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-2.5',
          'text-md text-right transition-colors',
          selected ? 'text-ink' : 'text-ink-soft',
          invalid
            ? 'border-danger'
            : open
              ? 'border-brand-300'
              : 'border-line hover:border-brand-200',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ArrowDown2
          size="16"
          color="currentColor"
          className={cn(
            'shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            'absolute z-20 inset-x-0',
            placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            'max-h-64 overflow-y-auto scrollbar-brand',
            'rounded-xl border border-line bg-white shadow-card',
            'animate-fade-in py-1'
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
                    'w-full px-4 py-2 text-right text-md transition-colors',
                    isSelected
                      ? 'bg-brand-50/60 text-brand-500 font-bold'
                      : 'text-ink hover:bg-surface-muted/70'
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
