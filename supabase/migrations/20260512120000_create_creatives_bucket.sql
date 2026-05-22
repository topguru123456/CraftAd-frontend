-- ============================================================================
-- 20260512120000_create_creatives_bucket.sql
--
-- Storage bucket for the watermarked images returned by the Bubble
-- image-generation worker. Written by the `creative-webhook` edge
-- function, read by the wizard's result step.
--
-- Distinct from `campaign-uploads`:
--   * campaign-uploads holds INPUTS (the device/AI/Pexels image the
--     user picked for the campaign).
--   * creatives holds OUTPUTS (the finished, watermarked creative).
-- Splitting them means we can apply different retention / cleanup
-- rules later (we'll likely keep finished creatives longer than the
-- intermediary input bytes).
--
-- Public-read so the URL persists directly on the generations row and
-- can be rendered in <img src> without per-render signing.
--
-- Folder convention:
--     creatives/<auth.uid()>/<generation_id>.png
--
-- The webhook writes via the service role (it has no JWT to scope to a
-- user), but the path is always the verified user_id from the
-- generations row being processed — so the "user can only access their
-- own folder" invariant still holds at read time.
--
-- TODO (post-launch, alongside the campaign-uploads orphan cleanup):
-- prune objects whose owning generations row has been deleted. Today
-- the foreign-key cascade only touches the DB row; the bytes stay.
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('creatives', 'creatives', true)
ON CONFLICT (id) DO NOTHING;

-- Public read: the rendered <img src> path. Anonymous reads are fine
-- because the worker watermarks the bytes before returning them; raw
-- unwatermarked originals never reach this bucket.
CREATE POLICY creatives_public_read
  ON storage.objects FOR SELECT
  USING (bucket_id = 'creatives');

-- Authenticated user INSERT scoped to own folder. The edge function
-- doesn't use this path (it writes via service role), but if we ever
-- add a client-side "re-upload finished design" flow it'll inherit
-- the right RLS without extra work.
CREATE POLICY creatives_user_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'creatives'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE scoped the same way — needed for "clear my history" flows.
CREATE POLICY creatives_user_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'creatives'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
