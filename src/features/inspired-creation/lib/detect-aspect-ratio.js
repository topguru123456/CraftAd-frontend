/* Detect the closest supported aspect-ratio id from an uploaded image
 * file.
 *
 * The inspired-creation wizard derives the output ratio from the inspo
 * the user uploads (per product decision: "the output image needs to
 * be the same ratio as the added inspo"). The dispatcher only accepts
 * the four canonical stored ids — `square` (1:1), `story` (9:16),
 * `portrait` (3:4), `landscape` (16:9) — so we snap the actual ratio
 * to whichever supported value is closest by absolute difference.
 *
 * Snapping is silent: 1080×1200 (ratio 0.9) becomes `square` (1.0)
 * with no UI prompt. Per the product-confirmed UX, users won't notice
 * minor rounding because the inspo is a creative-style reference, not
 * a pixel-exact crop.
 *
 * Pure helper — no hooks, no React. Returns a Promise that resolves
 * to the stored id string. Falls back to `square` on any load error
 * so the wizard never hangs on a corrupted file. */

const SUPPORTED = Object.freeze([
  { id: 'square',    ratio: 1 },        // 1:1
  { id: 'story',     ratio: 9 / 16 },   // 0.5625
  { id: 'portrait',  ratio: 3 / 4 },    // 0.75
  { id: 'landscape', ratio: 16 / 9 },   // ~1.7778
]);

/** @param {File} file */
export function detectAspectRatio(file) {
  return new Promise((resolve) => {
    if (!file || !(file instanceof Blob)) {
      resolve('square');
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      if (!w || !h) {
        resolve('square');
        return;
      }
      resolve(snapToSupportedRatio(w / h));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('square');
    };

    img.src = url;
  });
}

function snapToSupportedRatio(actual) {
  let bestId = SUPPORTED[0].id;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const { id, ratio } of SUPPORTED) {
    const dist = Math.abs(actual - ratio);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = id;
    }
  }
  return bestId;
}
