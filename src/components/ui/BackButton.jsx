import { ArrowRight } from 'iconsax-react';
import { cn } from '@lib/cn';

/* Reusable back-affordance button — small circle, brand-pink arrow.
 *
 * Visual is constant; positioning is the caller's job. Two layout
 * modes via the `floating` prop:
 *
 *   floating=false (default) — inline block-level button. Drops into
 *     normal flow and self-aligns to the inline-start (visual right
 *     in RTL) of its container. Use this on pages whose header is a
 *     standard top-of-page block (project detail, settings, etc.).
 *
 *   floating=true — absolutely positioned in the page's start-side
 *     margin (-3rem along inline-start, top-aligned) on ≥sm
 *     viewports; falls back to inline + mb-3 on mobile. Use this in
 *     centered wizard headers where the back arrow needs to sit
 *     outside the centered title block without disrupting it. The
 *     parent must be `position: relative` (every wizard header
 *     already is).
 *
 * Arrow direction: ArrowRight is correct in RTL — "back" points
 * toward the visual right because that's the inline-start direction. */
export function BackButton({ onClick, ariaLabel = 'חזרה', floating = false, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'flex h-10 w-10 items-center justify-center shrink-0',
        'rounded-md shadow-md bg-white text-brand-500',
        'hover:bg-brand-50 transition-colors',
        floating && 'mb-3 sm:absolute sm:-start-12 sm:top-4 sm:mb-0',
        className,
      )}
    >
      <ArrowRight size="22" variant="Linear" color="currentColor" />
    </button>
  );
}
