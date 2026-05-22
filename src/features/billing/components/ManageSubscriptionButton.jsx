import { useState } from 'react';
import { cn } from '@lib/cn';
import { billingApi } from '../api/billing.api';

/* "ניהול מנוי" — opens the Stripe Customer Portal in the same tab.
 *
 * The Portal hosts the entire upgrade/downgrade/cancel/payment-method
 * UI, so this single button replaces any FE-side subscription-management
 * surface. Place it on the settings page where the user expects to find
 * billing controls.
 *
 * Disabled while we're minting the URL so a frantic user can't fire
 * multiple Portal sessions in parallel. On error we surface inline so
 * the user knows the click "did something." */
export function ManageSubscriptionButton({ className }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await billingApi.redirectToPortal();
    // If we reach here the redirect didn't happen → surface the error and
    // re-enable the button so the user can retry.
    if (err) {
      setError(err.message ?? 'פתיחת ניהול המנוי נכשלה. נסו שוב.');
      setBusy(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={cn(
          'inline-flex items-center justify-center gap-2 self-start',
          'rounded-xl px-5 h-11 text-sm font-bold',
          'bg-white border border-brand-300 text-brand-600',
          'hover:border-brand-500 hover:bg-brand-50/50 transition-colors',
          busy && 'cursor-wait opacity-70'
        )}
      >
        {busy && (
          <span
            aria-hidden="true"
            className="h-4 w-4 rounded-full border-2 border-brand-300 border-t-brand-600 animate-spin"
          />
        )}
        <span>{busy ? 'פותח...' : 'ניהול מנוי'}</span>
      </button>
      {error && <p className="text-sm text-danger text-right">{error}</p>}
    </div>
  );
}
