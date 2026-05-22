# `create-setup-intent` Edge Function

Creates (or reuses) a Stripe Customer for the authenticated Supabase user and
returns a SetupIntent `client_secret` that the browser confirms with
Stripe.js. No charge happens — the card is just attached to the customer for
later use.

## What it does

1. Verifies the caller's Supabase JWT and resolves the user.
2. Reads `user.user_metadata.stripe_customer_id`. If missing, creates a Stripe
   Customer (`{ email, metadata: { supabase_user_id } }`) and writes the new
   ID back into `user_metadata` via the service-role admin client.
3. Creates a SetupIntent on that customer (`usage: 'off_session'`,
   `payment_method_types: ['card']`).
4. Returns `{ clientSecret, customerId }`.

## One-time setup

```bash
# 1. Set the function secrets (only STRIPE_SECRET_KEY is yours to provide;
#    the SUPABASE_* values are auto-populated by the runtime).
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx

# 2. Deploy. We pass --no-verify-jwt because we verify the JWT inside the
#    function so we can return a proper 401 with a useful body.
supabase functions deploy create-setup-intent --no-verify-jwt
```

## Local dev

```bash
# Create supabase/.env (gitignored) with at minimum:
#   STRIPE_SECRET_KEY=sk_test_xxx
#
# Then serve locally:
supabase functions serve create-setup-intent --env-file ./supabase/.env
```

The frontend calls this via
`supabase.functions.invoke('create-setup-intent')` (see
`src/features/trial/api/trial.api.js`). The Authorization header with the
user's JWT is added automatically by the Supabase JS client.

## Response shape

```ts
// 200 OK
{ clientSecret: string, customerId: string }

// 401 Unauthorized
{ error: 'Missing Authorization header' | 'Unauthenticated' }

// 500 Internal
{ error: string }
```
