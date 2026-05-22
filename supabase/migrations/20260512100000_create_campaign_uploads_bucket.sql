-- ============================================================================
-- 20260512100000_create_campaign_uploads_bucket.sql
--
-- Storage bucket for the campaign-creative wizard's per-image uploads:
--   * Device-uploaded product photos (browser → supabase-js client)
--   * AI-generated images written by the generate-image edge function
--   * Pexels mirrors written by the pexels-import edge function
--
-- Public-read so the URLs are stable in <img src> without per-request
-- signing — both the picker preview and the downstream dispatcher
-- prompt reference these URLs directly.
--
-- Folder convention enforced by RLS:
--     campaign-uploads/<auth.uid()>/<filename>
--
-- The first segment must equal the caller's auth.uid(); the INSERT and
-- DELETE policies check this via `storage.foldername(name)[1]`. The
-- two edge functions that use the service role (pexels-import,
-- generate-image) still scope their paths to the verified caller's id,
-- so the "user can only write to their own folder" invariant holds
-- even when RLS is bypassed.
--
-- TODO (post-launch): wire an orphan cleanup job. Today nothing
-- garbage-collects abandoned uploads from wizards the user backed out
-- of. A simple sweep on a daily schedule — delete objects in this
-- bucket older than N days that aren't referenced by any
-- generations/projects row — keeps Storage costs bounded. Deferring
-- until the projects table lands and we know the referencing column.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-uploads', 'campaign-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Public read: the URLs go straight into <img src> in the wizard
-- preview and eventually into the dispatcher payload. Public-read
-- avoids re-signing on every render.
CREATE POLICY campaign_uploads_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-uploads');

-- Authenticated users may upload only into their own folder. Both
-- direct browser uploads (device files) and the edge functions
-- (operating with the service role but pinning the path to the
-- verified user id) land in this bucket through this constraint.
CREATE POLICY campaign_uploads_user_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Delete is scoped the same way — needed when a user removes a chosen
-- image from the wizard or replaces it (we GC the previous object so
-- abandoned blobs don't accumulate within a single session).
CREATE POLICY campaign_uploads_user_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'campaign-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update is not used (every upload creates a new uniquely-named
-- object). Add a policy here if we ever start overwriting in place.
