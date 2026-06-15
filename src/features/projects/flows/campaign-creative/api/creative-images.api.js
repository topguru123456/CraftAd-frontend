import { supabase } from '@lib/supabase';
import { apiClient } from '@lib/apiClient';

/** Campaign wizard images — device/Pexels/AI → `campaign-uploads` (`{ data, error }`). */

const BUCKET = 'campaign-uploads';

const ok = (data) => ({ data, error: null });
const fail = (message) => ({ data: null, error: { message } });

export const creativeImagesApi = {
  async uploadDeviceImage(file) {
    if (!file) return fail('לא נבחר קובץ');
    if (!file.type?.startsWith('image/')) {
      return fail('הקובץ אינו תמונה');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail('המשתמש אינו מחובר');

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const safeBase = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9_-]+/gi, '-')
      .slice(0, 40)
      || 'image';
    const path = `${user.id}/device-${Date.now()}-${safeBase}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type || undefined,
        upsert: false,
      });

    if (uploadError) {
      console.error('[creativeImagesApi.uploadDeviceImage] upload failed:', uploadError);
      return fail(uploadError.message);
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return ok({ url: urlData.publicUrl, path });
  },

  async searchPexels({ query, page = 1, perPage = 24 } = {}) {
    if (!query?.trim()) return fail('חיפוש ריק');

    const { data, error } = await apiClient.post('/images/pexels/search', {
      query: query.trim(),
      page,
      perPage,
    });

    if (error) return { data: null, error };
    return ok({
      photos: Array.isArray(data?.photos) ? data.photos : [],
      page: data?.page ?? page,
      perPage: data?.perPage ?? perPage,
      totalResults: data?.totalResults ?? 0,
      nextPage: data?.nextPage ?? null,
    });
  },

  async importPexels({ url, id, ext } = {}) {
    if (!url?.trim()) return fail('כתובת תמונה חסרה');

    const { data, error } = await apiClient.post('/images/pexels/import', {
      url: url.trim(),
      ...(id !== undefined && { id }),
      ...(ext !== undefined && { ext }),
    });

    if (error) return { data: null, error };
    if (!data?.url) return fail('שגיאה בהעתקת התמונה');
    return ok({ url: data.url, path: data.path });
  },

  /** AI product image — reference is optional; sent as base64 only when present. */
  async generateAiImage({ prompt, referenceFile } = {}) {
    const trimmedPrompt = prompt?.trim() ?? '';
    if (!trimmedPrompt) return fail('יש למלא תיאור לתמונה');

    const payload = { prompt: trimmedPrompt };

    if (referenceFile) {
      if (!referenceFile.type?.startsWith('image/')) {
        return fail('תמונת הייחוס אינה תקינה');
      }
      try {
        payload.referenceImageBase64 = await fileToBase64(referenceFile);
      } catch (err) {
        console.error('[creativeImagesApi.generateAiImage] base64 encode failed:', err);
        return fail('שגיאה בקריאת תמונת הייחוס');
      }
      payload.referenceMime = referenceFile.type;
    }

    const { data, error } = await apiClient.post('/images/ai-generate', payload);

    if (error) return { data: null, error };
    if (!data?.url) return fail('שגיאה בייצור התמונה');
    return ok({ url: data.url, path: data.path, mime: data.mime });
  },

  /** Background removal — input must already be in `campaign-uploads`. */
  async removeBackground(imageUrl) {
    if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return fail('כתובת התמונה חסרה');
    }
    const { data, error } = await apiClient.post('/images/remove-background', {
      imageUrl: imageUrl.trim(),
    });
    if (error) return { data: null, error };
    if (!data?.url || !data?.path) {
      return fail('הסרת הרקע נכשלה');
    }
    return ok({ url: data.url, path: data.path });
  },

  /** Delete by public URL; foreign URLs no-op. */
  async deleteCampaignUpload(url) {
    const path = extractCampaignUploadPath(url);
    if (!path) return ok({ skipped: true });

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .remove([path]);

    if (error) {
      console.error('[creativeImagesApi.deleteCampaignUpload] remove failed:', { path, error });
      return fail(error.message);
    }
    return ok({ removed: data });
  },
};

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Unexpected FileReader result type'));
        return;
      }
      // Strip `data:*;base64,` prefix — backend expects raw payload.
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

function extractCampaignUploadPath(url) {
  if (typeof url !== 'string' || !url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx < 0) return null;
  const after = url.slice(idx + marker.length);
  const queryIdx = after.indexOf('?');
  return queryIdx >= 0 ? after.slice(0, queryIdx) : after;
}
