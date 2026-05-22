import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { Logo, Modal, Spinner } from '@components/ui';
import { getStripe } from '@lib/stripe';
import { trialApi } from '../api/trial.api';
import { STARTER_PLAN } from '../plans.config';
import { PlanSummaryCard } from './PlanSummaryCard';
import { PlanFeaturesCard } from './PlanFeaturesCard';
import { CouponInputCard } from './CouponInputCard';
import { TrialPaymentForm } from './TrialPaymentForm';
import { PaymentMethodIcons } from './PaymentMethodIcons';
import { GooglePayButton } from './GooglePayButton';

const STRIPE_APPEARANCE = {
  theme: 'stripe',
  labels: 'above',
  variables: {
    fontFamily: '"Discovery Fs", Heebo, system-ui, sans-serif',
    colorPrimary: '#ED5699',
    colorText: '#0A1F30',
    colorTextSecondary: '#5A6B7A',
    colorTextPlaceholder: '#8A98A6',
    colorDanger: '#DC2626',
    borderRadius: '10px',
    spacingUnit: '4px',
  },
  rules: {
    '.Label': { fontWeight: '500', fontSize: '14px', color: '#0A1F30' },
    '.Input': { borderColor: '#E5E9EE', boxShadow: 'none', padding: '12px' },
    '.Input:focus': { borderColor: '#ED5699', boxShadow: '0 0 0 3px rgba(237,86,153,0.18)' },
    '.Tab': { borderColor: '#E5E9EE' },
    '.Tab--selected': { borderColor: '#ED5699', color: '#ED5699' },
  },
};

export function StartTrialModal({ open, onClose, onSuccess, plan = STARTER_PLAN }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [bootError, setBootError] = useState(null);
  const stripePromise = getStripe();

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setBootError(null);
      return;
    }
    let cancelled = false;
    trialApi
      .createSetupIntent()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.clientSecret) {
          setBootError(error?.message || 'לא ניתן להתחיל את התהליך כעת. נסו שוב מאוחר יותר.');
          return;
        }
        setClientSecret(data.clientSecret);
      })
      .catch((err) => {
        if (cancelled) return;
        setBootError(err?.message || 'אירעה שגיאת רשת');
      });
    return () => { cancelled = true; };
  }, [open]);

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
          clientSecret={clientSecret}
          stripePromise={stripePromise}
          bootError={bootError}
          onSuccess={onSuccess}
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

function PaymentPanel({ plan, clientSecret, stripePromise, bootError, onSuccess }) {
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

      <div className="mb-5">
        <GooglePayButton onClick={() => { /* placeholder — wallet flow wired later */ }} />
      </div>

      <Divider>או שלם עם כרטיס אשראי</Divider>

      <div className="mt-6 flex-1 flex flex-col">
        {bootError ? (
          <div className="rounded-card border border-danger/20 bg-danger/5 p-4 text-right" dir="rtl">
            <p className="text-sm text-danger">{bootError}</p>
          </div>
        ) : !clientSecret ? (
          <div className="flex flex-1 items-center justify-center min-h-[240px]">
            <Spinner size={28} />
          </div>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: STRIPE_APPEARANCE, locale: 'he' }}
          >
            <TrialPaymentForm plan={plan} onSuccess={onSuccess} />
          </Elements>
        )}
      </div>

      <div className="mt-6">
        <PaymentMethodIcons />
      </div>
    </section>
  );
}

function Divider({ children }) {
  return (
    <div className="flex items-center gap-3 text-ink-muted text-sm">
      <span className="h-px flex-1 bg-line" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
