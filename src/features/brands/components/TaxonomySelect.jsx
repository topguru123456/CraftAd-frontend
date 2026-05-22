import { useEffect, useRef, useState } from 'react';
import { ArrowDown2 } from 'iconsax-react';
import { cn } from '@lib/cn';

/* Dropdown for picking values from a frozen taxonomy
 * (BRAND_VALUES, BRAND_TONES, etc.). Two modes from the same component:
 *
 *   mode="single"  → `value` is a string id (or null). Picking an option
 *                    sets it; picking it again clears it. The selected
 *                    item also renders as a single removable pill below
 *                    the trigger.
 *   mode="multi"   → `value` is an array of string ids. Picking toggles
 *                    membership; selected items render as pills.
 *
 * Both modes share the same trigger (placeholder + chevron), the same
 * pill row, and the same "click outside / ESC to close" behavior. The
 * surface keeps the data model clean: parents always pass full
 * `options` (the frozen taxonomy) plus a `value` matching mode shape;
 * the component never holds taxonomy state itself.
 *
 * Keyboard:
 *   - ESC closes the menu when open
 *   - clicks outside trigger + menu close
 *   - menu items are focusable buttons so tab-order is intuitive
 */
/* How tall the menu wants to be when fully expanded — used to decide
 * whether to drop down or flip up. Matches the `max-h-64` on the <ul>
 * with a small padding fudge. If you change one, change the other. */
const MENU_DESIRED_HEIGHT = 280;

export function TaxonomySelect({
  mode = 'single',
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState('bottom');
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);

  /* Close on outside click / ESC. The whole component (trigger + menu)
   * lives inside `wrapRef`, so a single contains check covers both. */
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

  /* Pick the menu side based on available space. The select sits inside
   * a scrollable container (e.g. drawer); when the trigger is near the
   * bottom, the natural drop-down would be clipped. We re-evaluate on
   * scroll/resize so a long list stays visible while the user scrolls
   * the drawer. The capture-phase `scroll` listener catches scrolls on
   * any ancestor, including the drawer panel. */
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

  const isSelected = (id) =>
    mode === 'multi' ? Array.isArray(value) && value.includes(id) : value === id;

  const toggle = (id) => {
    if (mode === 'multi') {
      const current = Array.isArray(value) ? value : [];
      const next = current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id];
      onChange(next);
    } else {
      onChange(value === id ? null : id);
      setOpen(false);
    }
  };

  const remove = (id) => {
    if (mode === 'multi') {
      const current = Array.isArray(value) ? value : [];
      onChange(current.filter((v) => v !== id));
    } else {
      onChange(null);
    }
  };

  const selectedIds =
    mode === 'multi'
      ? Array.isArray(value) ? value : []
      : value
        ? [value]
        : [];

  return (
    <div ref={wrapRef} className="relative" dir="rtl">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cn(
          'w-full flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-2.5',
          'text-md text-ink-muted text-right',
          'transition-colors',
          open ? 'border-brand-300' : 'border-line hover:border-brand-200'
        )}
      >
        <span className="truncate">{placeholder}</span>
        <ArrowDown2
          size="16"
          color="currentColor"
          className={cn('shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-multiselectable={mode === 'multi'}
          className={cn(
            'absolute z-20 inset-x-0',
            placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            'max-h-64 overflow-y-auto scrollbar-brand',
            'rounded-xl border border-line bg-white shadow-card',
            'animate-fade-in py-1'
          )}
        >
          {options.map((opt) => {
            const selected = isSelected(opt.id);
            return (
              <li key={opt.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => toggle(opt.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2 text-right text-md',
                    'transition-colors',
                    selected
                      ? 'bg-brand-50/60 text-brand-500 font-bold'
                      : 'text-ink hover:bg-surface-muted/70'
                  )}
                >
                  {/* Visual checkbox for multi-mode so users can see
                      which items are already in the list without scanning
                      the pill row. Single-mode just shows the bg highlight. */}
                  {mode === 'multi' && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'inline-flex h-4 w-4 items-center justify-center shrink-0',
                        'rounded border',
                        selected
                          ? 'bg-brand-500 border-brand-500'
                          : 'bg-white border-line'
                      )}
                    >
                      {selected && <CheckGlyph className="h-2.5 w-2.5 text-white" />}
                    </span>
                  )}
                  <span className="flex-1">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Selected pills. Render after the trigger so they stack below it
          in the natural flow. RTL-friendly with flex-wrap. */}
      {selectedIds.length > 0 && (
        <ul className="flex flex-wrap gap-2 mt-3">
          {selectedIds.map((id) => {
            const opt = options.find((o) => o.id === id);
            if (!opt) return null;
            return (
              <li key={id}>
                <Pill label={opt.label} onRemove={() => remove(id)} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* Removable pill rendered for each selected option. DOM order
 * [label, X] in RTL → label on right, X on left, matching the
 * view-panel treatment: rounded-md (not full pill), thin gray border,
 * no rose tint, larger 18px text. */
function Pill({ label, onRemove }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-1',
        'border border-gray-200 bg-white text-[18px] text-ink'
      )}
    >
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`הסרת ${label}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-danger hover:bg-rose-100 transition-colors"
      >
        <CrossGlyph className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

function CheckGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5L10 17.5L19 7.5" />
    </svg>
  );
}

function CrossGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
