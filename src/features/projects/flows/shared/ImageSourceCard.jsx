import { Folder2, FolderOpen, Gallery, SearchNormal1 } from 'iconsax-react';
import { cn } from '@lib/cn';

/* Image-source picker card — the dashed-border panel with three
 * source buttons (AI / Pexels / device) that every image-output
 * wizard's terminal step uses. Pure presentational; the owning step
 * supplies the three callbacks + the device-input change handler.
 *
 * Extracted from campaign-creative's ImagesStep so advertising-package
 * (and any future image-bearing flow) renders the exact same surface
 * without copy-pasting ~120 lines of JSX. Behavior is byte-identical
 * to the original — moves are literal.
 *
 * Props:
 *   uploadStatus  — 'idle' | 'uploading' | 'error'. Drives the
 *                   device button's spinner + label.
 *   uploadError   — string | null. Rendered below the buttons in
 *                   danger color when present.
 *   onDeviceFiles — (event) => void. Handler for the hidden
 *                   `<input type="file">` change.
 *   onOpenPexels  — () => void. Opens the Pexels picker modal.
 *   onOpenAi      — () => void. Opens the AI-generate modal.
 *   disabled      — boolean. Greys out all three buttons (e.g. while
 *                   the wizard is submitting or another upload is
 *                   in flight). */
export function ImageSourceCard({
  uploadStatus,
  uploadError,
  onDeviceFiles,
  onOpenPexels,
  onOpenAi,
  disabled,
}) {
  const isUploading = uploadStatus === 'uploading';
  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-dashed border-brand-200 bg-white',
        'p-5 sm:p-6 flex flex-col items-center text-center',
      )}
    >
      <Folder2 size="48" variant="Bold" color="#ED5699" className="mb-3" />

      <h3 className="text-base sm:text-lg font-bold text-ink mb-1">
        העלו או צרו תמונה שתשמש את הקריאייטיב
      </h3>
      <p className="text-xs sm:text-sm text-ink-soft mb-1">
        (תמונת מוצר / תמונת תדמית / להמחשה)
      </p>
      <p className="text-xs text-ink-soft mb-5" dir="ltr">
        PNG, JPG
      </p>

      <div className="w-full space-y-2.5">
        <SourceButton
          variant="primary"
          icon={<Gallery size="18" variant="Bold" color="currentColor" />}
          label="יצירה עם AI"
          onClick={onOpenAi}
          disabled={disabled}
        />
        <SourceButton
          variant="outline"
          icon={<SearchNormal1 size="18" variant="Linear" color="currentColor" />}
          label="בחירה ממאגר התמונות"
          onClick={onOpenPexels}
          disabled={disabled}
        />
        <SourceButton
          variant="outline"
          icon={
            isUploading ? (
              <span
                aria-hidden="true"
                className="inline-block h-4 w-4 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin"
              />
            ) : (
              <FolderOpen size="18" variant="Linear" color="currentColor" />
            )
          }
          label={isUploading ? 'מעלה...' : 'בחירה מהמכשיר'}
          asLabel
          disabled={disabled}
        >
          {/* Wrapped <input> means clicking the label opens the picker
           * without a separate ref + click() dance. `disabled` + hidden
           * input handles the no-op-while-uploading case. */}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onDeviceFiles}
            disabled={disabled}
            className="hidden"
          />
        </SourceButton>
      </div>

      {uploadError && (
        <p className="mt-3 text-xs text-danger text-right w-full">{uploadError}</p>
      )}
    </div>
  );
}

/* Source button. Two variants (primary / outline). Optional `asLabel`
 * mode renders the button as a <label> wrapping a hidden <input> so
 * the device-upload path doesn't need a separate ref + click(). Kept
 * file-local — no caller needs the standalone primitive yet, and
 * exporting it would just invite drift. */
function SourceButton({
  icon,
  label,
  variant,
  onClick,
  disabled,
  title,
  asLabel = false,
  children,
}) {
  const isPrimary = variant === 'primary';
  const className = cn(
    'w-full inline-flex items-center justify-center gap-2',
    'rounded-xl px-4 py-2.5 text-sm sm:text-md font-bold transition-colors',
    isPrimary
      ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
      : 'bg-white text-ink border border-line hover:border-brand-300 hover:text-brand-500',
    disabled && 'opacity-60 cursor-not-allowed hover:opacity-60',
  );

  if (asLabel) {
    return (
      <label
        className={cn(className, !disabled && 'cursor-pointer')}
        title={title}
      >
        {icon}
        <span>{label}</span>
        {children}
      </label>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={className}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
