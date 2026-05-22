import { LottieProgressModal } from '@components/ui';

/* "Scoring in progress" modal.
 *
 * Replaces the in-dropzone loading text that used to flash while we
 * waited for GPT-4o vision (~5-15s). A modal works better here for a
 * few reasons:
 *   - The user just clicked "קבלת ציון" and is now waiting on the
 *     network — a centered modal communicates "we're doing the work"
 *     more clearly than an inline spinner.
 *   - Blocks the rest of the page so a frantic user can't re-click,
 *     pick another file, or navigate away mid-call (which would orphan
 *     the in-flight request).
 *   - The animation has room to actually breathe at this size.
 *
 * Pure data-binding wrapper over LottieProgressModal — all visual
 * decisions (inner card, padding, animation framing, no-close behavior)
 * live in the shared primitive so this modal and AutoFetchModal stay
 * visually coherent without copy-paste drift.
 *
 * Animation: lazy-loaded time.json from src/assets/animations/. */
const TIME_ANIMATION_LOADER = () => import('@assets/animations/time.json');

export function ScoringInProgressModal({ open }) {
  return (
    <LottieProgressModal
      open={open}
      title="בוחנים את התוכן שלכם!"
      statusText="חושבים על רעיונות..."
      animationLoader={TIME_ANIMATION_LOADER}
      ariaLabel="הציון נוצר"
    />
  );
}
