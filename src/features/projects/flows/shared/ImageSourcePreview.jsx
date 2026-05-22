import { Gallery, Trash } from 'iconsax-react';
import { cn } from '@lib/cn';

/* Selected-image preview card — paired with ImageSourceCard inside
 * the terminal step of any image-output wizard. Renders the empty
 * "תצוגה מקדימה תופיע כאן" state when no image is selected, or the
 * actual image with a remove button and source badge when one is.
 *
 * Pure presentational; the owning step controls the image record and
 * the remove handler. Source badge labels are mapped from a small
 * internal enum (ai/pexels/device) — passing through unknown sources
 * renders the raw value so a future source type isn't silently
 * swallowed.
 *
 * Props:
 *   image    — { url, source } | null. When null, renders the
 *              empty state. When set, renders the image preview.
 *   onRemove — () => void. Called by the trash button.
 *   disabled — boolean. Disables the trash button (e.g. while the
 *              wizard is mid-submit). */
export function ImageSourcePreview({ image, onRemove, disabled }) {
  if (!image?.url) {
    return (
      <div
        className={cn(
          'rounded-2xl border-2 border-dashed border-line bg-surface-muted/40',
          'p-5 sm:p-6 min-h-[280px] flex flex-col items-center justify-center text-center',
        )}
      >
        <Gallery size="40" variant="Linear" color="#9CA3AF" className="mb-3" />
        <p className="text-sm sm:text-base font-bold text-ink-muted mb-1">
          תצוגה מקדימה תופיע כאן
        </p>
        <p className="text-xs text-ink-soft">
          בחרו תמונה מאחת האפשרויות בצד
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-line bg-white p-3',
        'flex items-center justify-center overflow-hidden min-h-[280px]',
      )}
    >
      <img
        src={image.url}
        alt="התמונה שנבחרה"
        className="max-h-[320px] max-w-full object-contain rounded-xl"
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="הסירו את התמונה"
        className={cn(
          'absolute top-3 start-3 inline-flex h-9 w-9 items-center justify-center',
          'rounded-full bg-white/90 backdrop-blur border border-line',
          'text-danger hover:bg-white hover:border-danger transition-colors',
          'shadow-soft',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <Trash size="18" color="currentColor" variant="Linear" />
      </button>
      {image.source && (
        <span
          className={cn(
            'absolute bottom-3 end-3 px-2 py-1 rounded-md text-[10px] font-bold',
            'bg-white/90 backdrop-blur border border-line text-ink-muted',
          )}
        >
          {sourceLabel(image.source)}
        </span>
      )}
    </div>
  );
}

function sourceLabel(source) {
  switch (source) {
    case 'ai':     return 'AI';
    case 'pexels': return 'Pexels';
    case 'device': return 'מכשיר';
    default:       return source;
  }
}
