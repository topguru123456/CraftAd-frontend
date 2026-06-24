const required = (name, value) => {
  if (!value) throw new Error(`Missing required env var: ${name}. Check your .env file.`);
  return value;
};

export const env = {
  // Defaults to our local NestJS backend in dev, prod URL otherwise.
  // Override with VITE_API_URL in .env.local for staging / etc.
  apiUrl:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:8000' : 'https://api.craftad.ai'),
  appName: import.meta.env.VITE_APP_NAME || 'CraftAd',
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabasePublishableKey: required('VITE_SUPABASE_PUBLISHABLE_KEY', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  stripePublishableKey: required('VITE_STRIPE_PUBLISHABLE_KEY', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY),
  // DEV BYPASS — REMOVE BEFORE PROD.
  // When true, exposes a "skip trial verification" button on /trial that
  // calls POST /billing/tranzila/bypass-trial. The BE has its own gate
  // (TRANZILA_BYPASS_ENABLED) — both must be true for the bypass to fire.
  tranzilaBypassEnabled: import.meta.env.VITE_TRANZILA_BYPASS_ENABLED === 'true',
  // PAYMENT TEST MODE — REMOVE BEFORE PROD.
  // When true, the FE displays ₪1 prices on the pricing page + shows a
  // visible TEST MODE banner. Pairs with backend env BILLING_TEST_MODE
  // which overrides real charges to ₪1 — both must be true for an
  // end-to-end consistent test (BE flag is the authoritative one).
  billingTestMode: import.meta.env.VITE_BILLING_TEST_MODE === 'true',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};
