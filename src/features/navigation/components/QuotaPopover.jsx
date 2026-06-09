import { forwardRef } from 'react';
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
 * Shows the user's REMAINING credits for each tracked resource — not
 * raw usage. The header bolt's job is to answer "how much do I have
 * left?" at a glance, so we surface `limit - current` directly. For
 * unlimited resources (Scale/Pro tiers on downloads + avatars) we
 * render `∞`.
 *
 * Data flow: reads from QuotaContext, which itself reads from
 * GET /quota/usage. If usage hasn't loaded yet (or fails), `current`
 * defaults to 0 via ZERO_USAGE — the popover then shows the full
 * limit as remaining, which is the right default during boot (no
 * blocked false-positives flashing the user).
 *
 * forwardRef so UserCard can attach a ref for its outside-click
 * dismiss handler (matches the ActiveBrandCard + BrandPickerPopover
 * pattern used elsewhere in the sidebar). */

const ROWS = [
  { id: 'downloads', label: 'הורדות ושיתוף', Icon: DocumentDownload },
  { id: 'brands',    label: 'קרדיט מותג',    Icon: Hashtag },
  { id: 'projects',  label: 'קרדיט לפרויקט', Icon: Element4 },
  { id: 'avatars',   label: 'קרדיט אווטאר',  Icon: Profile },
];

export const QuotaPopover = forwardRef(function QuotaPopover(_props, ref) {
  const { plan, usage } = useQuota();

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="מכסות החבילה שלי"
      dir="rtl"
      className={cn(
        /* Anchored above the bolt with the right edge aligned to the
         * bolt's right edge — popover extends leftward and upward.
         * z-30 sits above the sidebar's brand-picker (z-20) without
         * fighting modals (z-100). */
        'absolute bottom-full right-0 mb-3 z-30',
        'min-w-[270px] rounded-2xl bg-white',
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
              {/* RTL DOM[0] = visual RIGHT. Icon first → sits on the
                  start (right) side; label expands in the middle; the
                  count lands on the visual left, matching the
                  screenshot. */}
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
    </div>
  );
});
