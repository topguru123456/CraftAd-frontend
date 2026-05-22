-- ============================================================================
-- 20260507130000_create_brand_assets_bucket.sql
--
-- Storage bucket for brand-owned media (logos today, banners and avatars
-- later). Public-read so the URLs are stable in <img src> without per-
-- request signing; per-user folders so RLS keeps writes scoped to each
-- owner.
--
-- Folder convention enforced by RLS:
--     brand-assets/<auth.uid()>/<filename>
--
-- The first path segment must equal the caller's auth.uid() — the
-- INSERT and DELETE policies check this with `storage.foldername(name)[1]`.
-- That keeps users from writing into another user's folder even though
-- read access is public.
--
-- Vendor portability:
--   * `storage.buckets` and `storage.objects` are Supabase's storage
--     subsystem (Postgres-backed). Migrating off Supabase means
--     replicating that schema or moving objects to another store
--     (S3, GCS, etc.) and updating brandsApi.uploadLogo's call site.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read: a brand record's logo_url is rendered by every authed
-- user that can see the brand. Tagging the bucket public skips having
-- to re-sign URLs on every render.
CREATE POLICY brand_assets_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets');

-- Authenticated users may upload only into their own folder.
CREATE POLICY brand_assets_user_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Same scope for delete — needed when the user removes a logo and we
-- garbage-collect the previous object.
CREATE POLICY brand_assets_user_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'brand-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update is not currently used (uploads always create a new object with
-- a unique filename). Add a policy here if/when we start overwriting.
