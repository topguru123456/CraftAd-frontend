import { useState } from 'react';
import { cn } from '@lib/cn';
import { billingApi } from '@features/billing/api/billing.api';
import { useSubscriptionInfo } from '../hooks/useSubscriptionInfo';
import { SettingsSection } from './SettingsSection';

export function SubscriptionSettingsSection() {
  const { planName, periodEndLabel } = useSubscriptionInfo();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const openPortal = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const { error: err } = await billingApi.redirectToPortal();
    if (err) {
      setError(err.message ?? 'פתיחת ניהול המנוי נכשלה');
      setBusy(false);
    }
  };

  return (
    <SettingsSection title="הגדרות מנוי">
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4',
          'rounded-2xl border border-line bg-surface-muted/30 px-5 py-4',
        )}
      >
        <div className="space-y-1 text-right text-sm sm:text-base">
          <p className="text-ink">
            <span className="font-bold">תכנית פעילה:</span>{' '}
            <span className="font-semibold">{planName}</span>
          </p>
          <p className="text-ink-muted">
            <span className="font-bold text-ink">תאריך סיום חבילה:</span>{' '}
            {periodEndLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={openPortal}
          disabled={busy}
          className={cn(
            'shrink-0 self-start sm:self-center',
            'h-11 px-6 rounded-xl text-sm font-bold',
            'border-2 border-danger text-danger bg-white',
            'hover:bg-rose-50 transition-colors',
            busy && 'cursor-wait opacity-70',
          )}
        >
          {busy ? 'פותח…' : 'ביטול תוכנית'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-danger text-right" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs text-ink-muted text-right leading-relaxed">
        ביטול או שינוי מנוי מתבצעים בפורטל התשלום המאובטח של Stripe — שם ניתן
        גם לעדכן אמצעי תשלום.
      </p>
    </SettingsSection>
  );
}
