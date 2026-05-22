import { supabase } from '@lib/supabase';
import { apiClient } from '@lib/apiClient';

/* Brands API client.
 *
 * CRUD + URL-lookup go through our NestJS backend (apiClient adds the JWT).
 * Logo storage stays on Supabase Storage — RLS-scoped to the user's folder,
 * no reason to proxy bytes through our backend.
 *
 * Every method returns { data, error } so existing call sites don't change.
 */

const BRAND_STORAGE_BUCKET = 'brand-assets';

const ok = (data) => ({ data, error: null });
const fail = (message) => ({ data: null, error: { message } });

export const brandsApi = {
  async list() {
    const { data, error } = await apiClient.get('/brands');
    if (error) return { data: null, error };
    return ok(data.map(withDefaults));
  },

  async get(id) {
    const { data, error } = await apiClient.get(`/brands/${id}`);
    if (error) return { data: null, error };
    return ok(withDefaults(data));
  },

  async create(input) {
    const name = input?.name?.trim();
    if (!name) return fail('שם המותג נדרש');
    const { data, error } = await apiClient.post('/brands', { ...input, name });
    if (error) return { data: null, error };
    return ok(withDefaults(data));
  },

  async update(id, patch) {
    const { data, error } = await apiClient.patch(`/brands/${id}`, patch);
    if (error) return { data: null, error };
    return ok(withDefaults(data));
  },

  async remove(id) {
    const { error } = await apiClient.delete(`/brands/${id}`);
    if (error) return { data: null, error };
    return ok({ id });
  },

  /* Look up a brand profile by website URL. Backend proxies context.dev
   * and returns the wizard draft shape directly. */
  async fetchFromUrl(url, { forceLanguage = 'hebrew' } = {}) {
    if (!url?.trim()) return fail('כתובת אתר נדרשת');
    const { data, error } = await apiClient.post('/brands/fetch', {
      url: url.trim(),
      forceLanguage,
    });
    if (error) return { data: null, error };
    return ok(data);
  },

  /* Upload a logo to the brand-assets bucket and return its public URL.
   * Folder convention is enforced by Storage RLS: the first segment of
   * the path MUST equal auth.uid(), otherwise insert is denied. */
  async uploadLogo(file) {
    if (!file) return fail('לא נבחר קובץ');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail('המשתמש אינו מחובר');

    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const safeBase =
      file.name
        .replace(/\.[^.]+$/, '')
        .replace(/[^a-z0-9_-]+/gi, '-')
        .slice(0, 40) || 'logo';
    const path = `${user.id}/${Date.now()}-${safeBase}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BRAND_STORAGE_BUCKET)
      .upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      console.error('[brandsApi.uploadLogo] upload failed:', uploadError);
      return fail(uploadError.message);
    }

    const { data: urlData } = supabase.storage
      .from(BRAND_STORAGE_BUCKET)
      .getPublicUrl(path);

    return ok({ url: urlData.publicUrl, path });
  },

  /* Delete a single object from the brand-assets bucket. URL-aware — pass
   * the public URL and we extract the path. URLs that don't belong to our
   * bucket (e.g. context.dev's CDN) resolve as a no-op success so callers
   * can pipe every "previous logo" URL through here without checking
   * ownership first. */
  async deleteAsset(url) {
    const path = extractBrandAssetPath(url);
    if (!path) return ok({ skipped: true });

    const { data, error } = await supabase.storage
      .from(BRAND_STORAGE_BUCKET)
      .remove([path]);
    if (error) {
      console.error('[brandsApi.deleteAsset] remove failed:', { path, error });
      return fail(error.message);
    }
    return ok({ removed: data });
  },
};

/* projectCount is computed once projects are ported to the backend. Defaulting
 * to 0 here keeps BrandCard rendering correct in the meantime. */
function withDefaults(brand) {
  if (!brand) return null;
  return { ...brand, projectCount: brand.projectCount ?? 0 };
}

/* Pull the in-bucket path out of a Supabase public URL. Returns null for
 * any URL that's not from this bucket — see deleteAsset above. */
function extractBrandAssetPath(url) {
  if (typeof url !== 'string' || !url) return null;
  const marker = `/storage/v1/object/public/${BRAND_STORAGE_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length);
}
