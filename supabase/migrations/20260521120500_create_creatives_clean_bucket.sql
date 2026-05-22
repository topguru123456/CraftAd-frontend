-- ============================================================================
-- 20260521120500_create_creatives_clean_bucket.sql
--
-- Private bucket for UN-watermarked originals of every creative the user
-- generates. Pairs with the existing public `creatives` bucket:
--
--   creatives        — public, watermarked variant, URL in image_url column,
--                      rendered in <img src> for every card
--   creatives-clean  — PRIVATE, unwatermarked original, PATH in clean_image_url
--                      column, exposed ONLY via /downloads endpoint which mints
--                      a short-lived signed URL after an ownership / quota check
--
-- The security boundary IS the public flag on this bucket. If clean files
-- ever land in the public bucket, the entire watermark gate becomes
-- theatre — anyone could curl the clean URL directly.
--
-- Folder convention (same as the public bucket):
--     creatives-clean/<auth.uid()>/<generation_id>.png
--
-- The webhook writes via the service role (no JWT). Reads happen via the
-- backend's downloads service (also service role) which mints signed URLs
-- — there is intentionally NO authenticated-user SELECT policy below, so
-- a leaked JWT can't pull clean files directly from the bucket.
--
-- TODO (post-launch): orphan cleanup. When the parent generations row is
-- deleted, the foreign-key cascade only removes the DB row; the bytes
-- here stay. Same cron job that prunes `creatives` orphans should hit
-- this bucket too.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('creatives-clean', 'creatives-clean', false)
ON CONFLICT (id) DO NOTHING;

-- DELETE scoped to the user's own folder — needed if we ever ship a
-- "clear my history" flow that the user invokes from the FE with their
-- own JWT (today the backend does deletions via the service role, which
-- bypasses RLS, so this policy is harmless if unused).
CREATE POLICY creatives_clean_user_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'creatives-clean'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Note the absence of SELECT/INSERT policies on purpose. The webhook
-- writes via service role (bypasses RLS), the downloads endpoint reads
-- via service role (bypasses RLS), and no anonymous or authenticated
-- read path exists. A misconfigured FE that tries to fetch the clean
-- URL directly will get 403 — exactly what we want.
