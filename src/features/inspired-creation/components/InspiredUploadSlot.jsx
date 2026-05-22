import { useEffect, useRef, useState } from 'react';
import { FolderOpen } from 'iconsax-react';
import { cn } from '@lib/cn';

const ACCEPT = 'image/png,image/jpeg,image/jpg';

/**
 * Dashed upload panel — click or drag a single image.
 * Used for both the reference ad and the product image slots.
 */
export function InspiredUploadSlot({
  icon,
  title,
  subtitle = 'סוגי קבצים נתמכים: PNG, JPG',
  file,
  onFileChange,
  showDeviceButton = false,
  deviceButtonLabel = 'בחירה מהמכשיר',
  disabled = false,
  className,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = (list) => {
    const next = list?.[0];
    if (!next?.type?.startsWith('image/')) return;
    onFileChange?.(next);
  };

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  return (
    <div className={cn('flex flex-col min-h-[280px]', className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={showDeviceButton ? undefined : openPicker}
        onKeyDown={
          showDeviceButton
            ? undefined
            : (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openPicker();
                }
              }
        }
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          pickFile(Array.from(e.dataTransfer.files ?? []));
        }}
        className={cn(
          'flex-1 rounded-2xl border-2 border-dashed transition-colors',
          'flex flex-col items-center justify-center text-center px-4 py-8',
          isDragging
            ? 'border-brand-400 bg-brand-50/50'
            : 'border-brand-200 bg-white hover:border-brand-300',
          !showDeviceButton && !disabled && 'cursor-pointer',
          disabled && 'opacity-60 pointer-events-none',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            pickFile(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />

        {previewUrl ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <img
              src={previewUrl}
              alt=""
              className="max-h-48 w-full object-contain rounded-xl"
            />
            <p className="text-xs text-brand-500 font-bold">לחצו להחלפה</p>
          </div>
        ) : (
          <>
            {icon}
            <h3 className="mt-3 text-base sm:text-lg font-bold text-ink leading-snug max-w-xs">
              {title}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-ink-soft">{subtitle}</p>
          </>
        )}
      </div>

      {showDeviceButton && (
        <label
          className={cn(
            'mt-4 inline-flex w-full items-center justify-center gap-2',
            'h-11 rounded-xl border border-line bg-white text-sm font-bold text-ink',
            'hover:bg-surface-muted/60 transition-colors cursor-pointer',
            disabled && 'opacity-60 pointer-events-none',
          )}
        >
          <FolderOpen size={18} variant="Linear" color="currentColor" />
          <span>{deviceButtonLabel}</span>
          <input
            type="file"
            accept={ACCEPT}
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              pickFile(Array.from(e.target.files ?? []));
              e.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}
