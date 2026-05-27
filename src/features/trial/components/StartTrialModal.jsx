import { useEffect, useState } from 'react';
import { Logo, Modal, Spinner } from '@components/ui';
import { billingApi } from '@features/billing';
import { STARTER_PLAN } from '../plans.config';
import { PlanSummaryCard } from './PlanSummaryCard';
import { PlanFeaturesCard } from './PlanFeaturesCard';
import { CouponInputCard } from './CouponInputCard';
import { TranzilaIframe } from './TranzilaIframe';
import { PaymentMethodIcons } from './PaymentMethodIcons';

/* Trial-start modal.
 *
 * Replaces the Stripe Elements implementation with the Tranzila classic
 * iframe. On open:
 *   1. POST /billing/tranzila/handshake → { iframeUrl, fields }
 *   2. Render TranzilaIframe with those params
 *   3. User enters card / uses Apple Pay / Google Pay inside the iframe
 *   4. Tranzila redirects the iframe → /trial/success → postMessage parent
 *   5. onComplete('success') → consumer's onSuccess callback fires
 *
 * The Tranzila iframe handles wallet buttons internally — Apple Pay and
 * Google Pay show up inline when enabled on the terminal (apple_pay=1 +
 * googlepay=1 in the handshake response). No GooglePayButton or Divider
 * needed on our side; the iframe is the entire payment surface.
 *
 * Trial config (Starter / yearly) is sent BE-side; the BE writes
 * subscription_plan_id + cycle into user_metadata on successful notify.
 * The FE doesn't pick the plan here — TrialStartPage owns that.
 */
export function StartTrialModal({ open, onClose, onSuccess, plan = STARTER_PLAN }) {
  const [session, setSession] = useState(null);
  const [bootError, setBootError] = useState(null);

  /* Mint a fresh handshake every time the modal opens. The session is
   * single-use + 15-minute-bounded BE-side; a stale one from a prior
   * open is already invalid. */
  useEffect(() => {
    if (!open) {
      setSession(null);
      setBootError(null);
      return;
    }
    let cancelled = false;

    billingApi
      .initIframeSession({ planId: 'starter', cycle: 'yearly', kind: 'trial' })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.iframeUrl) {
          setBootError(
            error?.message || 'לא ניתן להתחיל את התהליך כעת. נסו שוב מאוחר יותר.',
          );
          return;
        }
        setSession(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setBootError(err?.message || 'אירעה שגיאת רשת');
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleComplete = (result) => {
    if (result === 'success') {
      onSuccess?.();
      return;
    }
    setBootError('התשלום לא הושלם. סגרו ונסו שוב.');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      ariaLabel="התחלת ניסיון"
      panelClassName="rounded-[28px] sm:rounded-[32px]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[640px]">
        <PaymentPanel
          plan={plan}
          session={session}
          bootError={bootError}
          onComplete={handleComplete}
        />
        <PlanPanel plan={plan} />
      </div>
    </Modal>
  );
}

function PlanPanel({ plan }) {
  return (
    <aside
      dir="rtl"
      className="relative bg-gradient-to-br from-brand-300 via-brand-400 to-brand-500 px-6 py-10 sm:px-10 sm:py-12 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(255,255,255,0.25),transparent_55%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_85%,rgba(255,255,255,0.15),transparent_55%)]" aria-hidden="true" />

      <div className="relative space-y-5 max-w-[460px] mx-auto py-8">
        <header className="text-white space-y-2 text-right">
          <h2 className="text-[32px] sm:text-[36px] font-bold leading-[1.1]">
            הצטרף ל-{plan.shortName}
          </h2>
          <p className="text-base sm:text-md font-light text-white/90">
            הצטרף לאלפי משווקים שכבר יוצרים קמפיינים מנצחים ב-Craftad
          </p>
        </header>

        <PlanSummaryCard plan={plan} />
        <PlanFeaturesCard plan={plan} />
        <CouponInputCard />
      </div>
    </aside>
  );
}

function PaymentPanel({ session, bootError, onComplete }) {
  return (
    <section
      dir="rtl"
      className="bg-white px-6 py-10 sm:px-10 sm:py-12 flex flex-col"
    >
      <div className="flex justify-start mb-6">
        <Logo className="h-9" />
      </div>

      <header className="text-right space-y-2 mb-6">
        <h2 className="text-[26px] sm:text-[30px] font-bold leading-[1.2] text-ink">
          התחל את הניסיון שלך
        </h2>
        <p className="text-sm sm:text-base text-ink-muted">
          הוסף כרטיס לאימות בלבד - לא יבוצע חיוב כעת
        </p>
      </header>

      <div className="flex-1 flex flex-col">
        {bootError ? (
          <div
            className="rounded-card border border-danger/20 bg-danger/5 p-4 text-right"
            dir="rtl"
          >
            <p className="text-sm text-danger">{bootError}</p>
          </div>
        ) : !session ? (
          <div className="flex flex-1 items-center justify-center min-h-[240px]">
            <Spinner size={28} />
          </div>
        ) : (
          <TranzilaIframe
            iframeUrl={session.iframeUrl}
            fields={session.fields}
            onComplete={onComplete}
          />
        )}
      </div>

      <div className="mt-6">
        <PaymentMethodIcons />
      </div>
    </section>
  );
}
