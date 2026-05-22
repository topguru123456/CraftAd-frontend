import { useState } from 'react';
import { Gallery, MagicStar, Scissor, Trash } from 'iconsax-react';
import { useActiveBrand } from '@/contexts/BrandsContext';
import {
  ImageCropModal,
  ProjectWizardHeader,
  ProjectWizardShell,
} from '@features/projects/flows/shared';
import { creativeImagesApi } from '@features/projects/flows/campaign-creative/api/creative-images.api';
import { cn } from '@lib/cn';
import {
  STEP_IDS,
  WIZARD_STEPS,
  useProductImages,
} from '../context/ProductImagesContext';

/* Step 2 (visible stepper, terminal) — העלאת מוצר for the product-
 * images flow.
 *
 * Layout matches the spec mock:
 *   • Right column (DOM[0] in RTL) — UploadDropzone: a dashed-border
 *     drop area with a "select file" button. Reuses
 *     creativeImagesApi.uploadDeviceImage so the storage layout +
 *     RLS-scoped folder convention stays identical across flows.
 *   • Left column (DOM[1] in RTL) — Preview: the uploaded image,
 *     with two actions underneath:
 *       1. חיתוך   (Crop)         — opens ImageCropModal
 *       2. הסר רקע (Remove BG)    — stubbed (Pebblely upstream
 *                                    integration is a follow-up)
 *
 * Below the grid: gradient "תג'נרט לי תמונות מוצר" button → submit.
 * Today submit creates the project + rolls back with a clear "pipeline
 * pending" error; once the Pebblely backend lands, the context's
 * submit fans out generation instead of rolling back.
 *
 * Crop save flow:
 *   The modal returns a Blob (full source resolution). We wrap it in a
 *   File so the existing upload API path is reused unchanged, upload,
 *   then adoptImage() (which GCs the previous Storage object). The
 *   user can re-crop the cropped result — each save uploads a fresh
 *   object and the cleanup runs every time. */
export function UploadStep() {
  const { draft, back, cancel, submit, isSubmitting, submitError, adoptImage, removeImage } =
    useProductImages();
  const { activeBrand } = useActiveBrand();

  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadError, setUploadError] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);
  /* Background removal has its own pending flag (independent of upload)
   * so a user mid-removal can't accidentally retrigger by clicking the
   * upload button. Errors surface in the same inline slot as upload. */
  const [bgRemovalStatus, setBgRemovalStatus] = useState('idle');
  const [bgRemovalError, setBgRemovalError] = useState(null);

  const currentImage = draft.images?.[0] ?? null;
  const canSubmit =
    !isSubmitting &&
    uploadStatus !== 'uploading' &&
    Boolean(currentImage?.url) &&
    Boolean(activeBrand?.id);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await submit({ brandId: activeBrand.id });
  };

  const handleDeviceFiles = async (event) => {
    const list = Array.from(event.target.files ?? []).filter((f) =>
      f.type?.startsWith('image/')
    );
    /* Reset value so picking the same file twice still fires onChange.
     * Without this the second pick is a silent no-op. */
    event.target.value = '';
    const file = list[0];
    if (!file) return;
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploadStatus('uploading');
    setUploadError(null);
    const { data, error } = await creativeImagesApi.uploadDeviceImage(file);
    if (error) {
      setUploadStatus('error');
      setUploadError(error.message ?? 'ההעלאה נכשלה. נסו שוב.');
      return;
    }
    await adoptImage({ url: data.url, path: data.path, source: 'device' });
    setUploadStatus('idle');
  };

  /* Crop modal hands us a Blob (full source resolution). Wrap as a
   * File so uploadDeviceImage's mime/extension logic runs cleanly,
   * then route through the same upload path. Returning `{ error }`
   * from this callback signals the modal to keep itself open and
   * surface the message inline. */
  const handleCropSave = async (blob) => {
    const ext = blob.type === 'image/png' ? 'png' : 'jpg';
    const file = new File([blob], `cropped-${Date.now()}.${ext}`, {
      type: blob.type || 'image/jpeg',
    });
    const { data, error } = await creativeImagesApi.uploadDeviceImage(file);
    if (error) return { error };
    await adoptImage({ url: data.url, path: data.path, source: 'device' });
    return { data };
  };

  /* Background removal: 5–10s server-side inference, then the bg-
   * removed PNG replaces the current draft image via adoptImage()
   * (which GCs the previous Storage object). The button stays
   * disabled while pending so a spam-clicking user doesn't fire
   * redundant inferences — backend serializes them anyway, but
   * surfacing the disabled state on the FE makes the wait honest. */
  const handleRemoveBackground = async () => {
    if (!currentImage?.url || bgRemovalStatus === 'pending') return;
    setBgRemovalStatus('pending');
    setBgRemovalError(null);
    const { data, error } = await creativeImagesApi.removeBackground(currentImage.url);
    if (error) {
      setBgRemovalStatus('error');
      setBgRemovalError(error.message ?? 'הסרת הרקע נכשלה');
      return;
    }
    await adoptImage({ url: data.url, path: data.path, source: 'bg-removed' });
    setBgRemovalStatus('idle');
  };

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <ProjectWizardHeader
        title="בחרו איזה תוכן ונכסים דיגיטליים תרצו לייצר באמצעות AI"
        subtitle="זה השלב הראשון בדרך ליצירת התכנים עבור המותג שלכם. זה רק כמה צעדים פשוטים, לא יותר מ-3 דקות!"
        onBack={cancel}
      />

      <ProjectWizardShell
        steps={WIZARD_STEPS}
        currentStepId={STEP_IDS.upload}
        showActions={false}
      >
        {/* 2-col grid. DOM order = reading order in RTL:
              DOM[0] = PreviewCard → renders on the visual RIGHT
            BUT the spec mock has the upload area on the right and the
            preview on the LEFT. So we flip DOM order: dropzone first
            (DOM[0] → right), preview second (DOM[1] → left). */}
        <div dir="rtl" className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <UploadDropzone
            uploadStatus={uploadStatus}
            uploadError={uploadError}
            onDeviceFiles={handleDeviceFiles}
            disabled={isSubmitting}
          />
          <PreviewPanel
            image={currentImage}
            onCrop={() => setCropOpen(true)}
            onRemoveBackground={handleRemoveBackground}
            isRemovingBackground={bgRemovalStatus === 'pending'}
            onRemove={removeImage}
            disabled={isSubmitting || uploadStatus === 'uploading'}
          />
        </div>

        {bgRemovalError && (
          <p className="text-sm text-danger text-right">{bgRemovalError}</p>
        )}

        {submitError && (
          <p className="text-sm text-danger text-right">
            {submitError.message ?? 'יצירת התוכן נכשלה. נסו שוב.'}
          </p>
        )}

        <div className="flex items-center justify-center gap-3 pt-4">
          {/* DOM order [Back arrow, Generate] — RTL flex puts the back
              arrow on the right and the gradient action on the left,
              matching the spec mock and the rest of the wizard. */}
          <button
            type="button"
            onClick={back}
            aria-label="חזרה"
            className={cn(
              'inline-flex h-12 w-12 items-center justify-center shrink-0',
              'rounded-xl border border-brand-200 bg-white text-brand-500',
              'hover:bg-brand-50 transition-colors'
            )}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'inline-flex items-center justify-center gap-2',
              'h-12 min-w-[260px] px-6 rounded-xl text-base font-bold transition-opacity',
              canSubmit
                ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
                : 'bg-brand-100 text-brand-300 cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <span
                aria-hidden="true"
                className="h-5 w-5 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
              />
            ) : (
              <>
                <MagicStar size="20" variant="Bold" color="currentColor" />
                <span>תג'נרט לי תמונות מוצר</span>
              </>
            )}
          </button>
        </div>
      </ProjectWizardShell>

      <ImageCropModal
        open={cropOpen}
        imageUrl={currentImage?.url ?? null}
        onSave={handleCropSave}
        onClose={() => setCropOpen(false)}
      />
    </div>
  );
}

/* Right column (DOM[0] in RTL) — drop zone + select button. Dashed
 * border, big icon, two-line copy + the primary "upload" CTA. */
function UploadDropzone({ uploadStatus, uploadError, onDeviceFiles, disabled }) {
  const isUploading = uploadStatus === 'uploading';
  return (
    <div
      dir="rtl"
      className={cn(
        'rounded-2xl border-2 border-dashed border-brand-200 bg-white',
        'p-5 sm:p-7 flex flex-col items-center justify-center text-center',
        'min-h-[320px]'
      )}
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
        {isUploading ? (
          <span
            aria-hidden="true"
            className="h-6 w-6 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin"
          />
        ) : (
          <Gallery size="24" variant="Bold" color="#ED5699" />
        )}
      </div>

      <p className="text-base sm:text-lg font-bold text-ink mb-1">
        לחצו כאן להעלאת תמונת המוצר
      </p>
      <p className="text-xs text-ink-soft mb-5" dir="ltr">
        סוגי קבצים נתמכים: PNG, JPG
      </p>

      <label
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl',
          'px-5 h-11 min-w-[220px] text-sm font-bold border border-brand-300',
          'text-brand-500 bg-white transition-colors',
          disabled || isUploading
            ? 'opacity-60 cursor-not-allowed'
            : 'cursor-pointer hover:bg-brand-50'
        )}
      >
        <Gallery size="18" variant="Linear" color="currentColor" />
        <span>{isUploading ? 'מעלה...' : 'העלאת תמונת המוצר שלך'}</span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onDeviceFiles}
          disabled={disabled || isUploading}
          className="hidden"
        />
      </label>

      {uploadError && (
        <p className="mt-3 text-xs text-danger" dir="rtl">
          {uploadError}
        </p>
      )}
    </div>
  );
}

/* Left column (DOM[1] in RTL) — image preview + post-upload actions.
 * When no image is selected, mirrors the dropzone's empty look so the
 * pair reads as one symmetric panel. */
function PreviewPanel({
  image,
  onCrop,
  onRemoveBackground,
  isRemovingBackground,
  onRemove,
  disabled,
}) {
  if (!image?.url) {
    return (
      <div
        dir="rtl"
        className={cn(
          'rounded-2xl border-2 border-dashed border-line bg-surface-muted/40',
          'p-5 sm:p-7 min-h-[320px] flex flex-col items-center justify-center text-center'
        )}
      >
        <Gallery size="40" variant="Linear" color="#9CA3AF" className="mb-3" />
        <p className="text-sm sm:text-base font-bold text-ink-muted mb-1">
          תצוגה מקדימה תופיע כאן
        </p>
        <p className="text-xs text-ink-soft">העלו תמונה בצד מנגד</p>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="rounded-2xl border border-line bg-white p-3 sm:p-4 flex flex-col gap-3 min-h-[320px]"
    >
      <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-surface-muted/30">
        {/* `crossOrigin="anonymous"` is set here even though the preview
         * doesn't read pixels — so the browser caches a CORS-friendly
         * copy on first paint. When the user opens the crop modal,
         * that modal's <img> (also crossOrigin) reuses the cache
         * instead of re-fetching, and the canvas it draws into stays
         * untainted. Without aligning the two, a non-CORS preview load
         * could otherwise win the cache race and taint a subsequent
         * crop. See ImageCropModal.jsx for the full handshake notes. */}
        <img
          src={image.url}
          alt="תצוגה מקדימה של תמונת המוצר"
          crossOrigin="anonymous"
          className="max-h-[260px] max-w-full object-contain rounded-lg"
        />
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label="הסירו את התמונה"
          className={cn(
            'absolute top-3 start-3 inline-flex h-9 w-9 items-center justify-center',
            'rounded-full bg-white/90 backdrop-blur border border-line',
            'text-danger hover:bg-white hover:border-danger transition-colors shadow-soft',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          <Trash size="18" color="currentColor" variant="Linear" />
        </button>
      </div>

      {/* DOM order [Crop, RemoveBackground] — RTL flex puts Crop on
          the right and RemoveBackground on the left. Spec mock has
          Crop on the right and "הסר רקע" on the left → match. */}
      <div className="grid grid-cols-2 gap-3">
        <ToolButton
          icon={<Scissor size="18" variant="Linear" color="currentColor" />}
          label="חיתוך"
          onClick={onCrop}
          disabled={disabled || isRemovingBackground}
        />
        <ToolButton
          icon={<MagicStar size="18" variant="Linear" color="currentColor" />}
          label={isRemovingBackground ? 'מסיר רקע...' : 'הסר רקע'}
          onClick={onRemoveBackground}
          disabled={disabled || isRemovingBackground}
          loading={isRemovingBackground}
        />
      </div>
    </div>
  );
}

function ToolButton({ icon, label, onClick, disabled, loading, title }) {
  /* When `loading` is true we swap the icon for a spinner — visual
   * "this is working, don't click again" cue paired with the
   * disabled state. Disabled-only without the spinner reads as
   * "broken button"; spinner-only without disabled lets the user
   * spam-click. Both together is the honest signal. */
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        'rounded-xl px-4 h-11 text-sm font-bold',
        'border border-brand-300 text-brand-500 bg-white transition-colors',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-brand-50'
      )}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin"
        />
      ) : (
        icon
      )}
      <span>{label}</span>
    </button>
  );
}
