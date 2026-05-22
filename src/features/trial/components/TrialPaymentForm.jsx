import { useState } from 'react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '@components/ui';
import { LockIcon } from './icons';

const PAYMENT_ELEMENT_OPTIONS = {
  layout: 'tabs',
  defaultValues: {
    billingDetails: {
      address: { country: 'IL' },
    },
  },
  fields: {
    billingDetails: {
      address: { country: 'auto' },
    },
  },
};

export function TrialPaymentForm({ plan, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setServerError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setServerError(submitError.message);
      setIsSubmitting(false);
      return;
    }

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/app`,
      },
    });

    if (error) {
      setServerError(error.message);
      setIsSubmitting(false);
      return;
    }

    if (setupIntent?.status === 'succeeded') {
      try {
        await onSuccess?.(setupIntent);
      } catch (err) {
        setServerError(err?.message || 'אירעה שגיאה בסיום התהליך');
        setIsSubmitting(false);
      }
    } else {
      setServerError('אימות הכרטיס נכשל. נסו שוב.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} dir="ltr" className="space-y-5">
      <div className="rounded-[20px] border border-brand-100 bg-white p-5">
        <PaymentElement options={PAYMENT_ELEMENT_OPTIONS} />
      </div>

      {serverError && (
        <p className="text-sm text-danger text-right" dir="rtl">{serverError}</p>
      )}

      <p className="text-xs text-ink-muted text-left leading-relaxed">
        By providing your card information, you allow {plan.shortName ?? 'CraftAd'} to charge your card for future
        payments in accordance with their terms.
      </p>

      <Button
        type="submit"
        className="w-full"
        loading={isSubmitting}
        disabled={!stripe || !elements}
      >
        <span dir="rtl" className="inline-flex items-center gap-2">
          <LockIcon className="h-4 w-4 text-white" />
          התחל ניסיון חינם של {plan.trialDays} ימים
        </span>
      </Button>
    </form>
  );
}
