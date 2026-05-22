import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@lib/cn';
import { ChevronDownIcon } from './icons';

/* ───────────── Branch-tree geometry ─────────────────────────────────────────
 * The dropdown lives below the parent <button>. We reserve a fixed-width
 * column on the RIGHT of the dropdown (matching the parent's icon column)
 * and draw the entire tree as a single SVG inside it. SVG is the right tool
 * here — CSS border-radius tricks would need ~3 nested elements per item
 * and break when items wrap.
 *
 * Layout invariants the SVG depends on:
 *   - Each <li> is exactly ITEM_HEIGHT tall (set via `h-9`)
 *   - Items separated by ITEM_GAP (matches `space-y-1.5`)
 * ─────────────────────────────────────────────────────────────────────────── */
const ITEM_HEIGHT = 36;
const ITEM_GAP = 6;
const SVG_WIDTH = 24;
const TRUNK_X = 12;
const CURVE_R = 8;
const STROKE = 2;
const INACTIVE_COLOR = 'rgba(138,152,166,0.45)'; // ink-soft @ 45% — quiet structural tone

function BranchTree({ count}) {
  if (count === 0) return null;

  const totalHeight = count * ITEM_HEIGHT + Math.max(0, count - 1) * ITEM_GAP;
  const lastCurveStart =
    (count - 1) * (ITEM_HEIGHT + ITEM_GAP) + ITEM_HEIGHT / 2;

  return (
    <svg
      aria-hidden="true"
      className="absolute top-0 right-0 pointer-events-none"
      width={SVG_WIDTH}
      height={totalHeight}
      viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
      fill="none"
      strokeLinecap="round"
    >
      {/* Trunk: always inactive color — only individual branches highlight. */}
      <line
        x1={TRUNK_X}
        y1={0}
        x2={TRUNK_X}
        y2={lastCurveStart}
        stroke={INACTIVE_COLOR}
        strokeWidth={STROKE}
      />

      {Array.from({ length: count }).map((_, i) => {
        const itemCenter = i * (ITEM_HEIGHT + ITEM_GAP) + ITEM_HEIGHT / 2;
        return (
          <path
            key={i}
            d={`M ${TRUNK_X} ${itemCenter - CURVE_R} Q ${TRUNK_X} ${itemCenter} ${TRUNK_X - CURVE_R} ${itemCenter}`}
            stroke={INACTIVE_COLOR}
            strokeWidth={STROKE}
          />
        );
      })}
    </svg>
  );
}

export function NavGroup({ group }) {
  const { pathname } = useLocation();
  const isMatched = pathname.startsWith(group.matchPath);
  const [open, setOpen] = useState(isMatched);

  useEffect(() => {
    if (isMatched) setOpen(true);
  }, [isMatched]);

  // Compute which child route is active so the SVG can highlight that branch.
  const activeIndex = group.children.findIndex(
    (child) => pathname === child.href || pathname.startsWith(child.href + '/')
  );

  // Same active-icon swap as NavItem — when any child route is active,
  // the parent group icon shows its _selected variant.
  const Icon = isMatched && group.IconActive ? group.IconActive : group.Icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`nav-group-${group.id}`}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
          'text-md text-ink',
          isMatched ? 'bg-surface-muted font-bold' : 'hover:bg-surface-muted/60'
        )}
      >
        {/* DOM order: [groupIcon, label, chevron] →
            in RTL: gear on right, label centered, chevron on left. */}
        <Icon className="h-6 w-6 shrink-0" />
        <span className="flex-1 text-right">{group.label}</span>
        <ChevronDownIcon
          className={cn(
            'h-4 w-4 shrink-0 text-ink-soft transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          id={`nav-group-${group.id}`}
          className="relative pr-7 mt-2 mb-1"
          dir="rtl"
        >
          <BranchTree count={group.children.length} activeIndex={activeIndex} />

          <ul className="space-y-1.5">
            {group.children.map((child) => (
              <li key={child.id} className="h-9">
                <NavLink
                  to={child.href}
                  className={({ isActive }) =>
                    cn(
                      'h-9 text-[16px] flex items-center px-4 rounded-lg text-right transition-colors',
                      isActive
                        ? 'bg-surface-muted text-brand-500 font-bold'
                        : 'text-ink hover:bg-surface-muted/60'
                    )
                  }
                >
                  {child.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
