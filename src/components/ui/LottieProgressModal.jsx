import { LottieIcon } from './LottieIcon';
import { Modal } from './Modal';
import { cn } from '@lib/cn';

/* "Long-running operation, please wait" modal.
 *
 * Shared visual primitive for any flow that blocks on a multi-second
 * server call where the user has just committed to an action and needs
 * clear feedback. Consumers today:
 *   - ScoringInProgressModal (GPT-4o vision call, ~5-15s)
 *   - AutoFetchModal (context.dev brand scrape, ~10-30s)
 *
 * Why a shared primitive rather than two visually-identical components:
 * any cross-flow style change (motion, padding, color of the inner card,
 * the placeholder while the Lottie loads) lives in one place, so future
 * "in-progress" surfaces stay coherent without copy-paste drift.
 *
 * Intentionally has no close affordance — the parent owns dismissal by
 * flipping `open` to false when the underlying request resolves or
 * errors out. closeOnEsc + closeOnBackdrop are both false at the
 * primitive level so a frantic user can't accidentally kill an in-
 * flight request and end up confused about what just happened.
 *
 * Props:
 *   open              — modal visibility, owned by the parent
 *   title             — Hebrew bold headline; color via titleClassName
 *   titleClassName    — override the default ink color (e.g. brand pink
 *                       for the auto-fetch modal)
 *   subtitle          — small muted text under the title. Defaults to
 *                       "התהליך יכול לקחת עד דקה." — the standard line
 *                       across all our in-progress modals; pass a
 *                       different string to override per-flow.
 *   animationLoader   — lazy factory returning the Lottie JSON (Vite
 *                       chunks it; same convention as the project icons)
 *   statusText        — short, present-tense status under the animation
 *                       (e.g. "אוסף מידע...")
 *   ariaLabel         — for screen readers; defaults to the title
 */
export function LottieProgressModal({
  open,
  title,
  titleClassName,
  subtitle = 'התהליך יכול לקחת עד דקה.',
  animationLoader,
  statusText,
  ariaLabel,
}) {
  return (
    <Modal
      open={open}
      /* No-op onClose — parent is the sole owner of dismissal. */
      onClose={() => {}}
      size="md"
      ariaLabel={ariaLabel ?? title}
      closeOnEsc={false}
      closeOnBackdrop={false}
      showCloseButton={false}
    >
      <div dir="rtl" className="p-6 sm:p-8 text-center">
        <header className="space-y-1.5 mb-6">
          <h2
            className={cn(
              'text-xl sm:text-2xl font-extrabold',
              titleClassName ?? 'text-ink'
            )}
          >
            {title}
          </h2>
          <p className="text-sm sm:text-base text-ink-muted">{subtitle}</p>
        </header>

        {/* Inner card frames the animation so it doesn't feel like a
            floating icon in white space. The pink gradient + brand-100
            border + inset glow matches the in-progress visual vocabulary
            across the app. */}
        <section
          className={cn(
            'rounded-3xl border border-brand-100',
            'bg-gradient-to-b from-brand-50/60 to-white',
            'px-6 py-8 sm:py-10 space-y-4',
            'shadow-[inset_0_0_24px_rgba(237,86,153,0.06)]'
          )}
        >
          {/* Fixed-size square keeps the modal height stable while the
              loader resolves — without this, the modal jumps in size
              the instant the Lottie chunk arrives. */}
          <div className="mx-auto h-32 w-32 sm:h-36 sm:w-36">
            <LottieIcon loader={animationLoader} playMode="always" />
          </div>
          {statusText && (
            <p
              role="status"
              aria-live="polite"
              className="text-base sm:text-lg font-extrabold text-ink"
            >
              {statusText}
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}
