import { forwardRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DocumentDownload,
  Element4,
  Hashtag,
  Profile,
} from 'iconsax-react';
import { useQuota } from '@/contexts/QuotaContext';
import { cn } from '@lib/cn';

/* Plan-quota popover anchored to the bolt button in UserCard.
 *
 * Why a portal + fixed positioning instead of `position: absolute`
 * relative to the bolt:
 *   The sidebar's <aside> has `overflow-y-auto`, which under modern
 *   CSS reinterprets the orthogonal `overflow-x: visible` as `auto`.
 *   Anything that extends past the sidebar's edge gets clipped.
 *   Rendering into document.body via createPortal escapes the
 *   sidebar's overflow context entirely, so the popover can sit
 *   over the main content area without being chopped off.
 *
 * Position: anchored ABOVE the trigger, right edge of the popover
 * aligned with the right edge of the trigger. In our layout the bolt
 * sits on the visual LEFT of the user card (DOM[2] in an RTL flex
 * row), so the popover extends leftward + upward, landing partially
 * over the main app area — same spatial relationship as the
 * reference design. Recomputes on window scroll (capture phase, to
 * catch scroll on the sidebar ancestor) and resize.
 *
 * Data: reads remaining credits via useQuota (`limit - current`);
 * unlimited tiers render `∞`.
 *
 * forwardRef so UserCard can attach a ref for its outside-click
 * dismiss handler — `.contains()` works across portal boundaries. */

const GAP_PX = 8;

const ROWS = [
  { id: 'downloads', label: 'הורדות ושיתוף', Icon: DocumentDownload },
  { id: 'brands',    label: 'קרדיט מותג',    Icon: Hashtag },
  { id: 'projects',  label: 'קרדיט לפרויקט', Icon: Element4 },
  { id: 'avatars',   label: 'קרדיט אווטאר',  Icon: Profile },
];

export const QuotaPopover = forwardRef(function QuotaPopover(
  { triggerRef },
  ref,
) {
  const { plan, usage } = useQuota();
  const [position, setPosition] = useState(null);

  /* Measure the trigger and recompute on scroll/resize. The capture-
   * phase scroll listener catches scrolls on ANY ancestor (the
   * sidebar's own overflow container in particular) — without
   * capture, only window-level scrolls would fire and the popover
   * would drift away from the bolt when the user scrolls the
   * sidebar. */
  useEffect(() => {
    if (!triggerRef?.current) return undefined;

    const measure = () => {
      const node = triggerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      setPosition({
        // CSS `bottom` is viewport-from-bottom, so we convert from
        // the rect's top (viewport-from-top) by subtracting from the
        // window height. Skipping `top` lets the popover grow upward
        // naturally without us needing to know its own height.
        bottom: window.innerHeight - rect.top + GAP_PX,
        right:  window.innerWidth  - rect.right,
      });
    };

    measure();
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [triggerRef]);

  if (!position) return null;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label="מכסות החבילה שלי"
      dir="rtl"
      style={{
        position: 'fixed',
        bottom: `${position.bottom}px`,
        right:  `${position.right}px`,
      }}
      className={cn(
        'z-50 min-w-[270px] rounded-2xl bg-white',
        'border-2 border-brand-200 shadow-card',
        'p-2 animate-fade-in',
      )}
    >
      <ul className="space-y-0.5">
        {ROWS.map(({ id, label, Icon }) => {
          const limit = plan.limits[id];
          const current = usage[id] ?? 0;
          const unlimited = limit === Infinity;
          const remaining = unlimited
            ? null
            : Math.max(0, limit - current);
          return (
            <li
              key={id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg"
            >
              {/* RTL DOM[0] = visual RIGHT. Icon first → on the start
                  (right) side near the count; label expands; the
                  count sits at the visual end (left). */}
              <Icon size="20" color="#1F2A37" variant="Linear" />
              <span className="flex-1 text-right text-base font-bold text-ink whitespace-nowrap">
                {label}
              </span>
              <span
                className="tabular-nums text-base font-extrabold text-ink"
                aria-label={
                  unlimited
                    ? `${label}: ללא הגבלה`
                    : `${label}: ${remaining} נותרו`
                }
              >
                {unlimited ? '∞' : remaining}
              </span>
            </li>
          );
        })}
      </ul>
    </div>,
    document.body,
  );
});
