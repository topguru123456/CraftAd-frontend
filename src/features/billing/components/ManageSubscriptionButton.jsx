import { useState } from 'react';
import { cn } from '@lib/cn';
import { ManageSubscriptionModal } from './ManageSubscriptionModal';

/* "ניהול מנוי" — opens the in-app subscription management modal.
 *
 * Replaces the previous Stripe Customer Portal redirect. The modal
 * surfaces plan/period/card summary plus the three actions Stripe
 * Portal used to host: change plan, update card, cancel. */
export function ManageSubscriptionButton({ className }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center justify-center gap-2 self-start',
          'rounded-xl px-5 h-11 text-sm font-bold',
          'bg-white border border-brand-300 text-brand-600',
          'hover:border-brand-500 hover:bg-brand-50/50 transition-colors',
        )}
      >
        ניהול מנוי
      </button>

      <ManageSubscriptionModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
