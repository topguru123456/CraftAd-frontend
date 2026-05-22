import { useCallback, useEffect, useRef, useState } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Modal } from '@components/ui';
import { cn } from '@lib/cn';

/* Generic image-crop modal.
 *
 * Wraps react-image-crop with a sensible default UX (centered crop on
 * open, free or fixed-aspect rectangle, corner+grid handles) and a
 * single `onSave(Blob)` callback. The caller owns where the blob goes
 * — typically a re-upload to Storage and a draft.images swap.
 *
 * Lives in shared/ because cropping is a generic affordance and the
 * next image-output flow (video-creative, etc.) will need the same
 * dialog with the same UX. Hard-coupling it to product-images now
 * would force a copy-paste later.
 *
 * Why we return a Blob (vs a data URL or a cropped Image element):
 *   Storage uploads want a Blob/File. Returning anything else forces
 *   the caller to re-encode. Blob is the smallest interface that
 *   composes with `supabase.storage.from(...).upload(path, blob)`.
 *
 * Quality: we draw the crop at the IMAGE's natural pixel resolution
 * (not the display resolution), so a 4000×4000 input that the modal
 * shows at 600px wide still produces a full-resolution crop. The
 * dispatcher downstream may downscale to 1080×1350 etc., but we don't
 * preemptively lose pixels here. */

/* Centered initial crop covering 80% of the image — gives the user a
 * starting rectangle they can adjust without dragging from zero. */
function initialCrop(imageWidth, imageHeight, aspect) {
  const baseWidthPct = 80;
  if (aspect) {
    return centerCrop(
      makeAspectCrop(
        { unit: '%', width: baseWidthPct },
        aspect,
        imageWidth,
        imageHeight,
      ),
      imageWidth,
      imageHeight,
    );
  }
  /* Free-form: a centered 80×80% rectangle. */
  return centerCrop(
    { unit: '%', width: baseWidthPct, height: baseWidthPct, x: 10, y: 10 },
    imageWidth,
    imageHeight,
  );
}

/* Walk the canvas's alpha channel. Returns true on the first pixel
 * with alpha < 255 — i.e., the source had real transparency that we
 * must preserve through the encode. Bails early; for a fully-opaque
 * 1080×1080 image this scans ~1.16M alpha bytes (~5–10ms typical), and
 * for a transparent product photo it usually returns within the first
 * few hundred pixels. Cheap insurance against JPEG-flattening a
 * bg-removed image to a black-background blob. */
function canvasHasAlpha(ctx, width, height) {
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

/* Pixel-accurate canvas draw of the user's crop region. Reads pixel
 * coordinates (not percent) so we always work in source-image space —
 * keeps output resolution at the input's full quality regardless of
 * how the modal sized the preview.
 *
 * Output format is chosen by inspecting the canvas AFTER the draw:
 *   • Any pixel with alpha < 255 → encode as PNG (preserves the alpha
 *     channel; otherwise transparent regions would flatten to black
 *     under JPEG, which has no alpha).
 *   • Fully opaque → encode as JPEG (3–5× smaller files for the
 *     common "user uploaded a photo and cropped it" case).
 *
 * Auto-detect (vs a caller-supplied MIME) keeps the modal free of
 * business logic — works for "JPEG → crop", "PNG-bg-removed → crop",
 * and "user uploaded a transparent PNG → crop" without the caller
 * having to remember which case it's in.
 *
 * Cross-origin note: the source image lives on Supabase Storage (a
 * different origin than the app), so the <img> MUST be loaded with
 * `crossOrigin="anonymous"` for the canvas to remain untainted.
 * Without that attribute both `getImageData` (used for the alpha
 * scan) and `toBlob` (used for encoding) reject with `SecurityError:
 * Tainted canvases may not be exported`. The CORS request is paired
 * with Supabase's `Access-Control-Allow-Origin: *` response on public
 * buckets; we just need to opt in on the client. */
async function cropToBlob(image, pixelCrop) {
  const canvas = document.createElement('canvas');
  /* devicePixelRatio left at 1 on purpose — we're rendering the
   * SOURCE pixels, not a display surface. The downstream consumer
   * (Supabase Storage + AI image pipeline) wants honest pixel counts. */
  canvas.width = Math.round(pixelCrop.width);
  canvas.height = Math.round(pixelCrop.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  /* Map source-image pixels into the canvas. `naturalWidth` vs
   * `width` matters here — react-image-crop reports pixels in DISPLAY
   * space; we scale up to NATURAL space before sampling. */
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  let mimeType;
  try {
    mimeType = canvasHasAlpha(ctx, canvas.width, canvas.height)
      ? 'image/png'
      : 'image/jpeg';
  } catch (err) {
    /* Same tainted-canvas SecurityError path as toBlob below — surface
     * the same Hebrew hint so the user sees one consistent message
     * regardless of which API tripped the security check. */
    const isSecurity =
      err instanceof DOMException && err.name === 'SecurityError';
    throw new Error(
      isSecurity
        ? 'התמונה נטענה ללא הרשאות שיתוף — רעננו את העמוד ונסו שוב.'
        : err instanceof Error
          ? err.message
          : 'שגיאה בחיתוך התמונה',
    );
  }

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (b) => {
          if (!b) reject(new Error('Canvas toBlob produced null'));
          else resolve(b);
        },
        mimeType,
        /* Quality only applies to JPEG (PNG is lossless and ignores
         * this argument). 0.92 = visually-lossless JPEG at ~30% of
         * PNG file size. */
        0.92,
      );
    } catch (err) {
      const isSecurity =
        err instanceof DOMException && err.name === 'SecurityError';
      reject(
        new Error(
          isSecurity
            ? 'התמונה נטענה ללא הרשאות שיתוף — רעננו את העמוד ונסו שוב.'
            : err instanceof Error
              ? err.message
              : 'שגיאה בחיתוך התמונה',
        ),
      );
    }
  });
}

/* Convert a `Crop` (percent or pixel units) to pixel space using the
 * displayed image dimensions. react-image-crop hands us `Crop` in
 * percent or pixel based on how it was initialized; we normalize so
 * the downstream canvas math doesn't have to branch. */
function toPixelCrop(crop, image) {
  if (!crop || !image) return null;
  if (crop.unit === 'px') {
    return { x: crop.x, y: crop.y, width: crop.width, height: crop.height };
  }
  return {
    x: (crop.x / 100) * image.width,
    y: (crop.y / 100) * image.height,
    width: (crop.width / 100) * image.width,
    height: (crop.height / 100) * image.height,
  };
}

export function ImageCropModal({
  open,
  imageUrl,
  aspect,
  title = 'חיתוך תמונה',
  onSave,
  onClose,
}) {
  const imgRef = useRef(null);
  const [crop, setCrop] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  /* Reset on each open so a re-crop of the same image starts fresh
   * (the user may have dragged the rectangle, closed, and reopened to
   * try again from the center). */
  useEffect(() => {
    if (open) {
      setCrop(null);
      setIsSaving(false);
      setError(null);
    }
  }, [open, imageUrl]);

  const handleImageLoad = useCallback(
    (e) => {
      const img = e.currentTarget;
      setCrop(initialCrop(img.width, img.height, aspect));
    },
    [aspect],
  );

  /* If the CORS handshake fails (Supabase bucket misconfigured, or the
   * URL is from a host that doesn't send `Access-Control-Allow-Origin`),
   * the <img> will fire `onError` rather than rendering. Surface a
   * dedicated message so the user knows it isn't a generic upload bug —
   * cropping just requires the host to allow cross-origin reads. */
  const handleImageError = useCallback(() => {
    setError('לא ניתן לטעון את התמונה לחיתוך. ודאו שהיא נגישה ונסו שוב.');
  }, []);

  const handleSave = useCallback(async () => {
    if (!imgRef.current || !crop) return;
    setIsSaving(true);
    setError(null);
    try {
      const pixelCrop = toPixelCrop(crop, imgRef.current);
      if (!pixelCrop || pixelCrop.width < 1 || pixelCrop.height < 1) {
        throw new Error('בחרו אזור חיתוך תקין');
      }
      /* Output format is auto-selected by cropToBlob based on whether
       * the source has transparency — PNG-with-alpha is preserved,
       * fully-opaque images encode as JPEG for smaller files. */
      const blob = await cropToBlob(imgRef.current, pixelCrop);
      const result = await onSave(blob);
      /* `onSave` may return `{ error }` to signal upload failure
       * inline; otherwise we close. */
      if (result?.error) {
        setError(result.error.message ?? 'שמירת התמונה נכשלה');
        setIsSaving(false);
        return;
      }
      setIsSaving(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בחיתוך התמונה');
      setIsSaving(false);
    }
  }, [crop, onSave, onClose]);

  const canSave = Boolean(crop && crop.width > 0 && crop.height > 0 && !isSaving);

  return (
    <Modal
      open={open}
      onClose={isSaving ? () => {} : onClose}
      size="lg"
      ariaLabel={title}
      closeOnBackdrop={!isSaving}
      closeOnEsc={!isSaving}
    >
      <div dir="rtl" className="p-6 sm:p-7 space-y-5">
        <header>
          <h2 className="text-xl font-extrabold text-ink text-right">{title}</h2>
        </header>

        {imageUrl && (
          <div className="flex items-center justify-center bg-surface-muted/40 rounded-xl p-3">
            {/* react-image-crop wraps the <img> and handles handles + grid.
                We constrain max height so a 4k image doesn't blow up the
                modal — the source pixels are preserved at save time
                regardless of display size. */}
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              aspect={aspect}
              ruleOfThirds
              className="max-h-[60vh]"
            >
              {/* `crossOrigin="anonymous"` is the load-time half of
                  the CORS handshake — it tells the browser to fetch
                  the image with an Origin header, and to cache the
                  result as "safe for canvas reads". Without it the
                  canvas becomes tainted the moment we drawImage()
                  this element, and toBlob/getImageData fail. The
                  attribute must be present BEFORE `src` for the
                  CORS request to fire; React renders both as JSX
                  props in one go, which preserves that ordering. */}
              <img
                ref={imgRef}
                src={imageUrl}
                alt="חיתוך תמונה"
                crossOrigin="anonymous"
                onLoad={handleImageLoad}
                onError={handleImageError}
                className="max-h-[60vh] max-w-full"
              />
            </ReactCrop>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger text-right">
            {error}
          </p>
        )}

        <footer dir="rtl" className="flex items-center justify-end gap-3">
          {/* DOM order [Cancel, Save] → in RTL, Cancel on the right,
              Save on the left. Same convention as the wizard footer. */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={cn(
              'inline-flex items-center justify-center rounded-xl px-5 py-2.5',
              'text-sm font-bold border border-line text-ink-muted bg-white',
              'hover:text-ink hover:border-ink-muted transition-colors',
              isSaving && 'opacity-60 cursor-not-allowed'
            )}
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              'inline-flex items-center justify-center rounded-xl px-6 py-2.5 min-w-[140px]',
              'text-sm font-bold transition-opacity',
              canSave
                ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
                : 'bg-brand-100 text-brand-300 cursor-not-allowed'
            )}
          >
            {isSaving ? (
              <span
                aria-hidden="true"
                className="h-5 w-5 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
              />
            ) : (
              'שמור'
            )}
          </button>
        </footer>
      </div>
    </Modal>
  );
}
