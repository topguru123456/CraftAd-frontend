import { useState } from 'react';
import { Gallery, MagicStar, Trash } from 'iconsax-react';
import { useActiveBrand } from '@/contexts/BrandsContext';
import {
  ProjectWizardHeader,
  ProjectWizardShell,
} from '@features/projects/flows/shared';
import { creativeImagesApi } from '@features/projects/flows/campaign-creative/api/creative-images.api';
import { cn } from '@lib/cn';
import {
  STEP_IDS,
  WIZARD_STEPS,
  useVideoCreative,
} from '../context/VideoCreativeContext';

/* Step 3 (visible stepper, terminal) — מידע על המוצר for the
 * video-creative flow.
 *
 * Single file, two layouts. The branching is on `draft.videoSourceType`:
 *
 *   • 'text'  → single-column: description textarea only.
 *   • 'image' → two-column: description + upload dropzone on the
 *               right (DOM[0]), preview panel on the left (DOM[1]).
 *
 * Why a single file:
 *   95% of the chrome is identical (header, shell, stepper, description
 *   field, submit button). Two files would mean every UI tweak has to
 *   be made twice; the day they drift is the day they regress. The only
 *   thing that varies is whether the image upload + preview block
 *   appears, and that's one boolean — exactly what conditional rendering
 *   is for. A third mode (e.g., text+image hybrid) lands here, not in
 *   a third file.
 *
 * Submit:
 *   Today this is the wizard's terminal step. Continue calls submit()
 *   from the context, which is currently stubbed pending the
 *   video-generation backend. Validation lives here:
 *     - description always required
 *     - image required ONLY when videoSourceType === 'image'
 *
 * Image lifecycle (image-mode only):
 *   Reuses creativeImagesApi.uploadDeviceImage (the same backend
 *   endpoint product-images uses) and adoptImage/removeImage from
 *   the context. adoptImage GCs the previous Storage object, so a
 *   user who re-uploads doesn't leave orphan blobs. */
const VIDEO_DESCRIPTION_MAX = 500;
const DESCRIPTION_PLACEHOLDER =
  'הקרם מוצג עם תאורה חמה, על שיש במקלחת...';

export function ProductInfoStep() {
  const {
    draft,
    updateDraft,
    back,
    cancel,
    submit,
    isSubmitting,
    submitError,
    adoptImage,
    removeImage,
  } = useVideoCreative();
  /* Active brand provides the brandId the context's submit requires
   * (it persists the project under that brand and assembles the
   * Veo prompt with brand context). Same pattern as product-images /
   * copywriting's terminal steps — Continue is also gated on having
   * an active brand so we don't fire submit with a null id. */
  const { activeBrand } = useActiveBrand();

  const isImageMode = draft.videoSourceType === 'image';
  const currentImage = draft.images?.[0] ?? null;

  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadError, setUploadError] = useState(null);

  /* Continue gate:
   *   - active brand required (submit needs brandId)
   *   - description always required (the model needs something to
   *     anchor the video on, regardless of source type)
   *   - image required only in image-mode (text-mode by definition
   *     doesn't have one) */
  const canSubmit =
    !isSubmitting &&
    uploadStatus !== 'uploading' &&
    Boolean(activeBrand?.id) &&
    Boolean(draft.videoDescription?.trim()) &&
    (!isImageMode || Boolean(currentImage?.url));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await submit({ brandId: activeBrand.id });
  };

  const handleDeviceFiles = async (event) => {
    const list = Array.from(event.target.files ?? []).filter((f) =>
      f.type?.startsWith('image/'),
    );
    /* Reset value so picking the same file twice still fires
     * onChange — without this the second pick silently no-ops. */
    event.target.value = '';
    const file = list[0];
    if (!file) return;

    setUploadStatus('uploading');
    setUploadError(null);
    const { data, error } = await creativeImagesApi.uploadDeviceImage(file);
    if (error) {
      setUploadStatus('error');
      setUploadError(error.message ?? 'ההעלאה נכשלה. נסו שוב.');
      return;
    }
    adoptImage({ url: data.url, path: data.path, source: 'device' });
    setUploadStatus('idle');
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
        currentStepId={STEP_IDS.productInfo}
        showActions={false}
      >
        {isImageMode ? (
          /* Image mode — 2 columns. DOM order [description-stack,
           * preview] → in RTL grid renders the description+upload on
           * the RIGHT and the preview on the LEFT, matching the spec
           * mock's second screenshot. */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-5">
              <DescriptionField
                value={draft.videoDescription}
                onChange={(val) => updateDraft({ videoDescription: val })}
              />
              <UploadDropzone
                uploadStatus={uploadStatus}
                uploadError={uploadError}
                onDeviceFiles={handleDeviceFiles}
                disabled={isSubmitting}
              />
            </div>
            <PreviewPanel
              image={currentImage}
              onRemove={removeImage}
              disabled={isSubmitting || uploadStatus === 'uploading'}
            />
          </div>
        ) : (
          /* Text mode — single column, description only. The shell
           * already centers/widths it. */
          <DescriptionField
            value={draft.videoDescription}
            onChange={(val) => updateDraft({ videoDescription: val })}
          />
        )}

        {submitError && (
          <p className="text-sm text-danger text-right pt-4">
            {submitError.message ?? 'יצירת הסרטון נכשלה. נסו שוב.'}
          </p>
        )}

        {/* DOM order [Back arrow, Create] — RTL flex puts the back
            arrow on the right and the gradient action on the left,
            matching the spec mock and the rest of the wizard. */}
        <div className="flex items-center justify-center gap-3 pt-6">
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
              'h-12 min-w-[200px] px-6 rounded-xl text-base font-bold transition-opacity',
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
                <span>צור סרטון</span>
              </>
            )}
          </button>
        </div>
      </ProjectWizardShell>
    </div>
  );
}

/* Description textarea — label on top, counter underneath. Same shape
 * as the offer-features brief and product-images description so every
 * "long description" surface in the app reads the same way. Counter
 * goes red at the cap. Local to this file because the cap differs
 * (VIDEO_DESCRIPTION_MAX = 500 vs BRIEF_MAX = 5000) — abstracting it
 * out would carry a configurable-max prop that just re-implements the
 * inlined cap. */
function DescriptionField({ value, onChange }) {
  const length = value?.length ?? 0;
  const atLimit = length >= VIDEO_DESCRIPTION_MAX;
  return (
    <div className="space-y-2">
      <label className="block text-[16px] font-bold text-ink-muted text-right">
        תאר את הסרטון הרצוי
      </label>
      <div className="relative">
        <textarea
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={VIDEO_DESCRIPTION_MAX}
          placeholder={DESCRIPTION_PLACEHOLDER}
          dir="rtl"
          rows={6}
          className={cn(
            'w-full rounded-xl border border-line bg-white',
            'px-4 py-3 text-md text-ink placeholder:text-ink-soft text-right',
            'focus:border-brand-300 focus:outline-none focus:shadow-focus',
            'resize-y min-h-[160px]'
          )}
        />
        <span
          dir="ltr"
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute bottom-3 left-3',
            'text-sm tabular-nums',
            atLimit ? 'text-danger font-bold' : 'text-ink-soft'
          )}
        >
          {VIDEO_DESCRIPTION_MAX}
        </span>
      </div>
    </div>
  );
}

/* Upload dropzone — dashed-border drop area with a "select file"
 * button. Same chrome as product-images so the upload affordance
 * reads consistently across flows. Reuses creativeImagesApi for the
 * actual upload (same bucket, same RLS-scoped path). */
function UploadDropzone({ uploadStatus, uploadError, onDeviceFiles, disabled }) {
  const isUploading = uploadStatus === 'uploading';
  return (
    <div
      dir="rtl"
      className={cn(
        'rounded-2xl border-2 border-dashed border-brand-200 bg-white',
        'p-5 sm:p-7 flex flex-col items-center justify-center text-center'
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

/* Preview panel — image-mode only. Mirrors product-images'
 * PreviewPanel chrome (same crossOrigin handshake so any future crop
 * modal on this image stays canvas-untainted; same trash button
 * position; same empty-state look). */
function PreviewPanel({ image, onRemove, disabled }) {
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
      className="rounded-2xl border border-line bg-white p-3 sm:p-4 min-h-[320px] flex items-center justify-center overflow-hidden relative"
    >
      <img
        src={image.url}
        alt="תצוגה מקדימה של תמונת המוצר"
        crossOrigin="anonymous"
        className="max-h-[280px] max-w-full object-contain rounded-lg"
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
  );
}
