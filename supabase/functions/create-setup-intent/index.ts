// @ts-nocheck — Deno runtime file. Type-checked by Deno at deploy time.
// The project's TypeScript LSP doesn't know about Deno globals (`Deno.serve`,
// `Deno.env`) since this is a Vite project. Install the "Deno" VS Code
// extension to get proper IntelliSense here (already enabled for this folder
// via .vscode/settings.json).
//
// supabase/functions/create-setup-intent/index.ts
//
// Returns a Stripe SetupIntent client_secret the browser uses to confirm
// card details with Stripe.js. No charge happens — the card gets attached
// to a Stripe Customer (lazily created on first use) for later subscription
// billing.
//
// Required Supabase function secrets:
//   STRIPE_SECRET_KEY              sk_test_... or sk_live_...
//   SUPABASE_URL                   auto-injected by the runtime
//   SUPABASE_ANON_KEY              auto-injected by the runtime
//   SUPABASE_SERVICE_ROLE_KEY      auto-injected by the runtime
//
// Deploy via Supabase Dashboard:
//   Functions → Deploy a new function → Via Editor
//   Name: create-setup-intent
//   IMPORTANT: turn OFF "Verify JWT with legacy secret"
//   (We verify the JWT manually inside the handler so OPTIONS preflights
//    return 200 with proper CORS headers instead of 401.)

import Stripe from 'https://esm.sh/stripe@17?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Workaround for stripe-node + Deno fetch header incompatibility.
// Deno's fetch requires header values to be valid ByteString (codepoints
// 0-255). The Stripe SDK injects an `X-Stripe-Client-User-Agent` header that
// can contain non-ASCII characters in Deno runtimes, triggering:
//   TypeError: Failed to construct 'Request': 'headers' of 'RequestInit'
//   (Argument 2) is not a valid ByteString
// This wrapper strips problematic codepoints from header values before
// delegating to native fetch.
// Ref: https://github.com/denoland/deno/issues/13316
const NON_ASCII = new RegExp('[\\u0080-\\uFFFF]', 'g');

function sanitizingFetch(input, init) {
  if (init && init.headers) {
    const sanitized = {};
    const entries =
      init.headers instanceof Headers
        ? Array.from(init.headers.entries())
        : Array.isArray(init.headers)
        ? init.headers
        : Object.entries(init.headers);

    for (const [key, value] of entries) {
      if (value === undefined || value === null) continue;
      sanitized[key] = String(value).replace(NON_ASCII, '');
    }
    init = { ...init, headers: sanitized };
  }
  return fetch(input, init);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  // 1. CORS preflight — must succeed even if everything else is misconfigured
  //    so the browser doesn't block the real POST with a CORS error.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // 2. Read env at request time (NOT at module load) so a missing secret
  //    returns a useful 500 with CORS headers, instead of crashing the
  //    function and producing an opaque CORS error in the browser.
  const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(
      {
        error:
          'Server misconfigured: missing required env. Add the missing secret(s) at ' +
          'Supabase Dashboard → Edge Functions → Secrets.',
        envStatus: {
          STRIPE_SECRET_KEY: Boolean(STRIPE_SECRET_KEY),
          SUPABASE_URL: Boolean(SUPABASE_URL),
          SUPABASE_ANON_KEY: Boolean(SUPABASE_ANON_KEY),
          SUPABASE_SERVICE_ROLE_KEY: Boolean(SUPABASE_SERVICE_ROLE_KEY),
        },
      },
      500
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    // 3. Resolve calling user from their Supabase JWT.
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user || !user.email) {
      return json({ error: 'Unauthenticated' }, 401);
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY.trim(), {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(sanitizingFetch),
      telemetry: false,
      appInfo: {
        name: 'craftad-trial',
        version: '1.0.0',
      },
    });

    // 4. Get or lazily create a Stripe Customer for this user.
    let stripeCustomerId = user.user_metadata?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            stripe_customer_id: stripeCustomerId,
          },
        }
      );
      if (updateError) {
        console.error('[create-setup-intent] failed to persist customer id:', updateError);
      }
    }

    // 5. Create a SetupIntent so the browser can confirm card details.
    //    `usage: 'off_session'` lets us charge the card later (post-trial)
    //    without the customer being present on the page.
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        supabase_user_id: user.id,
        purpose: 'trial_card_verification',
      },
    });

    return json({
      clientSecret: setupIntent.client_secret,
      customerId: stripeCustomerId,
    });
  } catch (err) {
    console.error('[create-setup-intent] error:', err);
    return json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      500
    );
  }
});
