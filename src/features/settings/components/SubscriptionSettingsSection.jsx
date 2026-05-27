import { useState } from 'react';
import { cn } from '@lib/cn';
import { CancelConfirmModal } from '@features/billing/components/CancelConfirmModal';
import { supabase } from '@lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { requestQuotaRefresh } from '@/contexts/QuotaContext';
import { useSubscriptionInfo } from '../hooks/useSubscriptionInfo';
import { SettingsSection } from './SettingsSection';

/* Subscription panel on the account settings page.
 *
 * Used to redirect to the Stripe Customer Portal; now opens the in-app
 * CancelConfirmModal directly. Plan-change + card-update live on
 * /app/settings/payment via ManageSubscriptionButton — this section is
 * a focused "view current state + cancel" surface, not a general
 * management panel.
 *
 * Cancel-already-pending state hides the cancel button and surfaces
 * the period_end date so the user sees their grace window without
 * having to open the modal.
 */
export function SubscriptionSettingsSection() {
  const info = useSubscriptionInfo();
  const toast = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);

  const handleCancelled = async () => {
    await supabase.auth.refreshSession();
    requestQuotaRefresh();
    setCancelOpen(false);
    toast.success('המנוי יסתיים בתום תקופת החיוב הנוכחית');
  };

  return (
    <>
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
              <span className="font-semibold">{info.planName}</span>
            </p>
            <p className="text-ink-muted">
              <span className="font-bold text-ink">
                {info.cancelAtPeriodEnd ? 'גישה עד:' : 'תאריך סיום חבילה:'}
              </span>{' '}
              {info.periodEndLabel}
            </p>
            {info.cancelAtPeriodEnd && (
              <p className="text-xs text-ink-muted pt-1">
                המנוי בוטל. הגישה תסתיים בתאריך לעיל.
              </p>
            )}
          </div>

          {!info.cancelAtPeriodEnd && (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className={cn(
                'shrink-0 self-start sm:self-center',
                'h-11 px-6 rounded-xl text-sm font-bold',
                'border-2 border-danger text-danger bg-white',
                'hover:bg-rose-50 transition-colors',
              )}
            >
              ביטול תוכנית
            </button>
          )}
        </div>

        <p className="text-xs text-ink-muted text-right leading-relaxed">
          {info.cancelAtPeriodEnd
            ? 'הביטול נרשם. תוכלו לחזור ולהירשם בעתיד באמצעות בחירת מסלול חדש.'
            : 'ניתן לבטל את המנוי כאן. הגישה למסלול תישאר עד תום תקופת החיוב הנוכחית.'}
        </p>
      </SettingsSection>

      <CancelConfirmModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onCancelled={handleCancelled}
        periodEndUnix={info.periodEndUnix}
      />
    </>
  );
}
