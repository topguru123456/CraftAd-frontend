import { loadStripe } from '@stripe/stripe-js';
import { env } from '@config/env';

let stripePromise;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(env.stripePublishableKey);
  }
  return stripePromise;
};
