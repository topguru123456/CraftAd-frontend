import { useEffect, useRef, useState } from 'react';
import { Folder2 } from 'iconsax-react';
import { cn } from '@lib/cn';

/* Drag-or-click upload dropzone.
 *
 * States:
 *   - idle      → folder icon + CTA copy
 *   - dragging  → same content, brand-tinted border + bg
 *   - preview   → live thumbnail of the picked file (single-file mode only)
 *   - loading   → spinner + "מעלה..." copy (replaces all other content)
 *
 * The whole area is one big button — the hidden <input type=file> is
 * triggered by click and by Space/Enter (native button semantics). In
 * preview state, clicking re-opens the picker so the user can swap their
 * pick without an extra "clear" affordance (no nested <button> issue;
 * HTML disallows that).
 *
 * The preview URL comes from URL.createObjectURL on the actual File and
 * is revoked when the file changes or the component unmounts. That keeps
 * memory usage flat across repeated swaps. */
const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp,image/svg+xml';

export function UploadDropzone({
  onFilesSelected,
  isLoading = false,
  multiple = true,
  selectedFile = null,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // When the dropzone is single-file (multiple=false) we hard-cap the
  // selection at one even if the OS picker or a drop hands us more.
  // Picking the first preserves "drop your one creative" intent without
  // silently ignoring extras the user didn't realise they passed.
  const passSelection = (list) => {
    if (!list.length) return;
    onFilesSelected(multiple ? list : list.slice(0, 1));
  };

  const openPicker = () => {
    if (isLoading) return;
    inputRef.current?.click();
  };

  const handleInputChange = (event) => {
    const list = Array.from(event.target.files ?? []);
    passSelection(list);
    /* Reset so re-selecting the same file still fires onChange. */
    event.target.value = '';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (isLoading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (isLoading) return;
    const list = Array.from(event.dataTransfer.files ?? []).filter((file) =>
      file.type.startsWith('image/')
    );
    passSelection(list);
  };

  const hasPreview = !multiple && selectedFile && !isLoading;

  return (
    <button
      type="button"
      onClick={openPicker}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      disabled={isLoading}
      aria-busy={isLoading}
      aria-label={multiple ? 'העלאת תמונות' : 'העלאת תמונה'}
      className={cn(
        'group relative w-full rounded-2xl border-2 border-dashed transition-colors duration-150',
        'flex flex-col items-center justify-center text-center',
        /* Tighter vertical padding once a preview lives inside so the
           image isn't dwarfed by empty space. */
        hasPreview ? 'px-4 py-6 sm:py-8' : 'px-6 py-14 sm:py-16',
        isLoading
          ? 'border-brand-200 bg-brand-50/30 cursor-wait'
          : isDragging
            ? 'border-brand-400 bg-brand-50/60 cursor-copy'
            : hasPreview
              ? 'border-brand-200 bg-white hover:border-brand-300 cursor-pointer'
              : 'border-brand-200 bg-white hover:border-brand-300 hover:bg-brand-50/30 cursor-pointer'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      {isLoading ? (
        <LoadingState multiple={multiple} />
      ) : hasPreview ? (
        <PreviewState file={selectedFile} />
      ) : (
        <IdleState multiple={multiple} />
      )}
    </button>
  );
}

function IdleState({ multiple }) {
  return (
    <>
      <Folder2 size="56" variant="Bold" color="#ED5699" className="mb-4" />
      <p className="text-base sm:text-lg font-bold text-ink mb-1.5">
        {multiple
          ? 'לחצו כאן כדי להעלות תמונות או גררו אותן לכאן'
          : 'לחצו כאן כדי להעלות תמונה או גררו אותה לכאן'}
      </p>
      <p className="text-xs sm:text-sm text-ink-soft">
        סוגי קבצים נתמכים: WEBP, SVG, PNG, JPG
      </p>
    </>
  );
}

function LoadingState({ multiple }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="mb-4 h-12 w-12 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin"
      />
      <p className="text-base sm:text-lg font-bold text-ink mb-1.5">
        {multiple ? 'מעלה את התמונות...' : 'מעלה את התמונה...'}
      </p>
      <p className="text-xs sm:text-sm text-ink-soft">
        רגע אחד, אנחנו מעבדים את הקובץ שלכם
      </p>
    </>
  );
}

// Shows the chosen file's image inside the dropzone. Object URL is
// revoked on file change + unmount so swapping the image doesn't leak.
// `object-contain` so the user sees the FULL frame they uploaded (cropping
// here would be misleading — the score is based on the full creative).
function PreviewState({ file }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return undefined;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="w-full max-w-md flex items-center justify-center">
        {url ? (
          <img
            src={url}
            alt={file?.name ?? ''}
            className="max-h-64 sm:max-h-72 w-auto rounded-xl object-contain block"
          />
        ) : (
          <div className="h-48 w-full rounded-xl bg-surface-muted animate-pulse" />
        )}
      </div>
      <p className="text-xs sm:text-sm text-ink-muted truncate max-w-full px-2">
        {file?.name}
      </p>
      <p className="text-xs text-brand-500 font-bold">
        לחצו להחלפת התמונה
      </p>
    </div>
  );
}
