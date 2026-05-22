import { apiClient } from '@lib/apiClient';

/* Creative-score API client.
 *
 * Ephemeral by design: the chosen image is read into a base64 data URL on
 * the client and POSTed inline to /scoring/score-creative. The backend ships
 * the data URL straight to GPT-4o vision and returns parsed scores in the
 * same response — nothing is persisted server-side. That's why the request
 * shape is JSON-only (no multipart): it matches the 20MB JSON body limit
 * already in place for webhook payloads and keeps the BE controller simple.
 *
 * Returns the same `{ data, error }` envelope as the rest of the FE so
 * callers don't fork on shape. `data` contains the scores plus a local
 * `previewUrl` (the same data URL) so the result modal can show the user
 * exactly what was scored without a second round-trip. */

const ok = (data) => ({ data, error: null });
const fail = (message) => ({ data: null, error: { message } });

// FileReader → base64 data URL. Resolves to the full `data:...;base64,...`
// string so it can be sent as-is. Rejects only on a true read error.
function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('read_failed'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('read_failed'));
        return;
      }
      resolve(result);
    };
    reader.readAsDataURL(file);
  });
}

export const creativeScoreApi = {
  async scoreCreative(file) {
    if (!file) return fail('לא נבחר קובץ.');
    if (!file.type?.startsWith('image/')) {
      return fail('סוג קובץ לא נתמך. העלו תמונה (PNG, JPG, WEBP).');
    }

    let imageDataUrl;
    try {
      imageDataUrl = await readAsDataUrl(file);
    } catch {
      return fail('קריאת הקובץ נכשלה. נסו שוב.');
    }

    const { data, error } = await apiClient.post('/scoring/score-creative', {
      imageDataUrl,
    });
    if (error) return { data: null, error };
    if (
      typeof data?.creativeScore !== 'number' ||
      typeof data?.performanceScore !== 'number' ||
      !Array.isArray(data?.recommendations)
    ) {
      return fail('תגובה לא צפויה מהשרת.');
    }

    return ok({
      creativeScore: data.creativeScore,
      performanceScore: data.performanceScore,
      recommendations: data.recommendations,
      previewUrl: imageDataUrl,
      fileName: file.name,
    });
  },
};
