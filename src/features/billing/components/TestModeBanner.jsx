import { env } from '@config/env';
import { cn } from '@lib/cn';

/* Renders a high-visibility banner above billing surfaces when
 * VITE_BILLING_TEST_MODE is true. Returns null otherwise — the import
 * cost is one boolean read.
 *
 * The whole point of the banner is to make it impossible to confuse a
 * test-mode session with real billing — the prices on every card flip
 * to ₪1 and the user (almost always a dev) needs an unmissable signal
 * that "yes, this is real Tranzila, but the amount is the test value."
 *
 * Mirrors the backend's BILLING_TEST_MODE — both flags should be set
 * together. The BE is the authoritative one (it controls the actual
 * charged amount); this banner is the FE's matching reassurance. */
export function TestModeBanner({ className }) {
  if (!env.billingTestMode) return null;
  return (
    <div
      role="status"
      dir="rtl"
      className={cn(
        'rounded-2xl border-2 border-amber-300 bg-amber-50',
        'px-4 py-3 sm:px-5 sm:py-3.5 text-right',
        className,
      )}
    >
      <p className="text-sm sm:text-base font-bold text-amber-900 leading-snug">
        מצב טסט פעיל — כל החיובים יבוצעו ב-₪1
      </p>
      <p className="text-xs text-amber-800/80 mt-0.5 leading-snug">
        BILLING_TEST_MODE is on. Plan renewals and switches will charge ₪1
        regardless of the displayed price. Turn off before production.
      </p>
    </div>
  );
}
