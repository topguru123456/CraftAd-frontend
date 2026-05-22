const required = (name, value) => {
  if (!value) throw new Error(`Missing required env var: ${name}. Check your .env file.`);
  return value;
};

export const env = {
  // Defaults to our local NestJS backend in dev, prod URL otherwise.
  // Override with VITE_API_URL in .env.local for staging / etc.
  apiUrl:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:3001' : 'https://api.craftad.ai'),
  appName: import.meta.env.VITE_APP_NAME || 'CraftAd',
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabasePublishableKey: required('VITE_SUPABASE_PUBLISHABLE_KEY', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  stripePublishableKey: required('VITE_STRIPE_PUBLISHABLE_KEY', import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY),
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};
