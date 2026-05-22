# Supabase setup SQL

What's left here, after the backend migration:

- `*_create_*_bucket.sql` — three Storage bucket setup files. Supabase Storage isn't managed by Prisma, so when you provision a new Supabase project for this app (dev, staging, restore-from-scratch) run these once to recreate the buckets and their RLS policies.

That's the entire remaining scope of this folder. **All schema migrations live in [`backend/prisma/migrations/`](../../backend/prisma/migrations/)** now and are applied via `npm run db:migrate:dev` / `npm run db:migrate:deploy`. Don't add new `CREATE TABLE` / `ALTER TABLE` SQL here.

## Storage bucket files in this folder

| File | Bucket | Used by |
|---|---|---|
| `20260507130000_create_brand_assets_bucket.sql` | `brand-assets` | Brand logos (FE upload + backend read) |
| `20260512100000_create_campaign_uploads_bucket.sql` | `campaign-uploads` | Wizard product images (FE + AI generation + Pexels import) |
| `20260512120000_create_creatives_bucket.sql` | `creatives` | Generated variants — WATERMARKED variant, public (creative-webhook writes; FE reads via `<img src>`) |
| `20260521120500_create_creatives_clean_bucket.sql` | `creatives-clean` | Generated variants — PRIVATE unwatermarked originals (creative-webhook writes; downloads service mints signed URLs) |
| `20260519140000_create_avatar_portraits_bucket.sql` | `avatar-portraits` | AI-generated persona portraits (avatars module writes; FE reads) |

## How to apply (fresh Supabase project setup)

1. Open Supabase Dashboard → **SQL Editor** → New query
2. Paste the contents of each `*_create_*_bucket.sql` file
3. Run

Order doesn't matter — they're independent buckets. The RLS policies are idempotent (`ON CONFLICT DO NOTHING` on the insert) so re-running is safe.

## Anything else Supabase-side that needs setup

- **Realtime publication membership** for `creative_generations` — handled by a Prisma migration (`backend/prisma/migrations/<ts>_creative_generations_realtime_publication/migration.sql`). Skip — `prisma migrate dev` runs it.
- **Edge Functions** — only `create-setup-intent` (Stripe) remains. All others were ported to the NestJS backend during Phase 2 of the migration.
