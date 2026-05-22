# Supabase backend

Everything backend-side lives here:

```
supabase/
  migrations/           # versioned SQL — the schema
    20260507120000_create_brands_table.sql
    README.md
  functions/            # Deno edge functions
    fetch-brand-data/
    create-setup-intent/
```

The frontend talks to Supabase via [`@supabase/supabase-js`](https://supabase.com/docs/reference/javascript) configured in [`src/lib/supabase.js`](../src/lib/supabase.js).

---

## Two schemas, one project

Open your Supabase project's **Table Editor**. There's a schema selector at the top:

- **`auth`** — Supabase's internal auth subsystem. ~22 tables (sessions, MFA, OAuth, refresh tokens…). **Maintained by Supabase. Never edit directly.** Your code references `auth.users` via foreign keys and `auth.uid()` in RLS policies, but you don't write to `auth.*`.
- **`public`** — your application's tables. **This is where every migration in this repo writes.** After applying `20260507120000_create_brands_table.sql`, `public.brands` shows up here.

If you don't see your table in the Dashboard, you're probably looking at the wrong schema — switch the dropdown to `public`.

---

## Workflow paths — pick by phase

### Path A — Dashboard SQL Editor (solo dev, day-one)

Fastest to start. You manually paste each migration into the dashboard.

**Apply a migration:**

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Open the migration file from `supabase/migrations/`, copy the entire contents
3. Paste → **Run**
4. Verify: **Table Editor** → schema = `public` → the new table is there

**Apply migrations in timestamp order.** Each filename starts with a UTC timestamp (`20260507120000_...`) — apply oldest first.

This works fine while it's just you. It stops scaling when:
- A second environment exists (staging/prod) — you have to remember to apply each migration to each environment
- A teammate joins — there's no automatic "what's already applied here?" check

### Path B — Supabase CLI (recommended once you have a second env)

The CLI tracks applied migrations per-environment in `supabase_migrations.schema_migrations` and only runs new ones. Same migration files in git, multiple Supabase projects in sync.

**One-time setup:**

```bash
# Install (pick one)
npm install -D supabase
# or
brew install supabase/tap/supabase
# or download from https://github.com/supabase/cli/releases

# Login (browser flow)
npx supabase login

# Link this repo to your Supabase project
# Project ref = the slug in your dashboard URL (xxx.supabase.co → xxx)
npx supabase link --project-ref <your-project-ref>
```

The CLI now stores the link in `supabase/.temp/` (gitignored). The next commands target whatever project you're linked to.

**Apply pending migrations:**

```bash
npx supabase db push
```

This compares `supabase/migrations/*.sql` against what's already been applied to the linked project and runs only the new ones.

**Optional: add npm scripts** so the CLI calls match the rest of your tooling. Add to `package.json`:

```json
"scripts": {
  "db:push": "supabase db push",
  "db:diff": "supabase db diff -f new_migration",
  "fn:deploy": "supabase functions deploy"
}
```

---

## Day-to-day: changing the schema

You're adding a new table, column, or index. Same workflow for both paths.

**1. In your code:**

```bash
# Create a new migration file. Filename = UTC timestamp + snake_case name.
# Example: 20260601093000_add_projects_table.sql
```

Write the SQL in the new file. Header comment + RLS + audit columns + trigger — see [`migrations/README.md`](./migrations/README.md) for the conventions.

**2. Apply it:**

- **Path A (Dashboard):** SQL Editor → paste → Run
- **Path B (CLI):** `npx supabase db push`

**3. Commit the migration file** along with whatever code changes depend on the new schema. Reviewers see the schema change in the same PR as the API code that uses it.

**Never edit a migration that has already been applied to any environment.** Schema changes in published files corrupt the migration history. Always add a new migration to amend an old one.

---

## Going to production: spinning up a fresh project

This is what makes the whole setup pay off. From zero to a fully-provisioned production database:

**1. Create the new project on Supabase**

Dashboard → **New project** → pick org / region / DB password → wait ~2 min.

**2. Link the CLI to it**

```bash
npx supabase link --project-ref <new-project-ref>
```

(If you were linked to dev, this overwrites that link. To switch back to dev later, re-link.)

**3. Apply every migration**

```bash
npx supabase db push
```

The CLI runs every file in `supabase/migrations/` in order. Done — your production database has the same schema as dev.

**4. Set Edge Function secrets**

Production uses different secrets than dev (Stripe live keys, possibly a separate Context.dev key with higher quota). In the Dashboard → **Edge Functions → Secrets**, add:

| Key                    | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| `STRIPE_SECRET_KEY`    | `sk_live_...` (production Stripe key)                   |
| `CONTEXT_DEV_API_KEY`  | `brand__...` (production Context.dev key, no `Bearer`)  |

**5. Deploy the Edge Functions**

```bash
npx supabase functions deploy fetch-brand-data --no-verify-jwt
npx supabase functions deploy create-setup-intent --no-verify-jwt
```

`--no-verify-jwt` is required because both functions verify the JWT manually inside the handler so OPTIONS preflights return 200 with CORS headers (see each function's README).

**6. Update the frontend's environment variables**

The frontend reads Supabase URL + anon key from env. Set the production values wherever you host the build (Vercel / Netlify / your CI):

```
VITE_SUPABASE_URL=<new-project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<new-project-anon-key>
```

These come from the new project's **Settings → API** page.

That's it. Redeploy the frontend and the production stack is live.

---

## Migrating data between projects

Schema is replayed via migrations. **Data** is a separate concern — you only care if you're moving an existing dev database to production with rows you want to keep.

**Easiest: Supabase's built-in backup/restore**

- Source project: **Database → Backups → Download backup** (gives you a `.sql` dump)
- Target project: **SQL Editor** → paste → Run

**Programmatic: pg_dump / psql** (if you need to script it)

```bash
# Export
pg_dump --schema=public --data-only \
  "postgres://postgres:<pwd>@db.<src-ref>.supabase.co:5432/postgres" \
  > data.sql

# Import
psql "postgres://postgres:<pwd>@db.<dst-ref>.supabase.co:5432/postgres" \
  < data.sql
```

Get the connection string from each project's **Settings → Database**.

For Craftad specifically, this is rarely needed — onboarding/trial flows let users (re)create their data in production. You only need data migration if you're cutting over a live user base.

---

## What's portable, what isn't

If you ever need to leave Supabase:

**Portable as-is:**
- Every migration in `supabase/migrations/*.sql` — plain Postgres, runs on Neon, RDS, self-hosted Postgres, any other managed Postgres.
- Audit columns, indexes, triggers — generic SQL.
- All client code in `src/` — talks to `brandsApi`, `useAuth`, etc. None of it knows whether the backend is Supabase or something else.

**Needs rewrite (documented in each migration's header):**
- `auth.users` foreign key references — repoint to whatever user table the new platform uses.
- `auth.uid()` defaults and RLS policies — replace with application-set `user_id` and app-level authz.
- Edge Functions (`fetch-brand-data`, `create-setup-intent`) — straight-line port to Node/Express routes. Logic stays the same; only the runtime wrapper changes.

The data itself moves cleanly via `pg_dump | psql` regardless of source or destination.

---

## Git hygiene

**Commit:**
- `supabase/migrations/*.sql` — the schema is part of the source code.
- `supabase/functions/<fn>/index.ts` and each function's README.
- `supabase/README.md` (this file) and `migrations/README.md`.

**Don't commit (add to `.gitignore` if not already there):**
- `supabase/.temp/` — CLI link cache.
- `supabase/.branches/` — local branch state.
- `.env*` — environment variables go to your hosting platform's env config, not git.
