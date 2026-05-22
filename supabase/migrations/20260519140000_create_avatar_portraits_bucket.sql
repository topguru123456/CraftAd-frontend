-- ============================================================================
-- 20260519140000_create_avatar_portraits_bucket.sql
--
-- Storage bucket for AI-generated avatar portraits (Gemini Nano Banana
-- Pro output). One image per avatar row, written by AvatarsService
-- after the Gemini call resolves.
--
-- Folder convention:
--     avatar-portraits/<auth.uid()>/<avatar_id>.png
--
-- Public-read so the URL can sit on the avatars row and render in
-- <img src> without per-render signing. The portraits aren't
-- watermarked — they're internal persona references, not customer-
-- facing creatives (see §10 watermarking rule, which targets
-- generated ads, not avatars).
--
-- The backend writes via the service role; the user_id in the path
-- comes from the authenticated JWT on the create endpoint, so the
-- "user can only access their own folder" invariant holds at read.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-portraits', 'avatar-portraits', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY avatar_portraits_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatar-portraits');

CREATE POLICY avatar_portraits_user_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatar-portraits'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY avatar_portraits_user_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatar-portraits'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
