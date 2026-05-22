import { useEffect, useRef, useState } from 'react';
import { Folder2, Profile } from 'iconsax-react';
import { cn } from '@lib/cn';
import { useToast } from '@/contexts/ToastContext';
import { accountApi, ACCEPTED_TYPES } from '../api/account.api';

export function ProfilePhotoSection({ avatarUrl, onSaved, className }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPreview(avatarUrl);
  }, [avatarUrl]);

  const handleFile = async (file) => {
    setError(null);
    setUploading(true);
    const { data, error: uploadErr } = await accountApi.uploadProfilePhoto(file);
    if (uploadErr) {
      setUploading(false);
      setError(uploadErr.message ?? 'העלאת התמונה נכשלה');
      return;
    }

    const { error: profileErr } = await accountApi.updateAvatarUrl(data.url);
    setUploading(false);

    if (profileErr) {
      setError(profileErr.message ?? 'שמירת תמונת הפרופיל נכשלה');
      return;
    }

    setPreview(data.url);
    await onSaved?.();
    toast.success('תמונת הפרופיל עודכנה');
  };

  const onInputChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    void handleFile(file);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <span className="block text-sm font-bold text-ink-muted text-right">
        תמונת פרופיל
      </span>

      {/* Upload + preview always side by side (matches design). */}
      <div className="flex flex-row gap-3 sm:gap-4 items-stretch">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'flex-1 min-w-0 rounded-2xl border-2 border-dashed border-brand-200 bg-white',
            'flex flex-col items-center justify-center gap-2 px-3 py-5 sm:py-6 text-center',
            'hover:border-brand-300 hover:bg-brand-50/30 transition-colors',
            'min-h-[130px] sm:min-h-[140px]',
            uploading && 'cursor-wait opacity-80',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={onInputChange}
            className="hidden"
          />
          {uploading ? (
            <span
              aria-hidden="true"
              className="h-9 w-9 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin"
            />
          ) : (
            <span
              aria-hidden="true"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500"
            >
              <Folder2 size={22} variant="Bold" />
            </span>
          )}
          <p className="text-xs sm:text-sm font-semibold text-ink leading-snug">
            לחצו כאן כדי להעלות
            <br />
            או גררו לכאן תמונה
          </p>
          <p className="text-xs text-ink-muted">PNG, JPG</p>
        </button>

        <div
          className={cn(
            'shrink-0 w-[108px] sm:w-[120px] rounded-2xl border border-line',
            'bg-surface-muted/60 flex items-center justify-center overflow-hidden',
          )}
          aria-label="תצוגה מקדימה של תמונת פרופיל"
        >
          {preview ? (
            <img
              src={preview}
              alt=""
              className="h-full w-full object-cover min-h-[130px] sm:min-h-[140px]"
            />
          ) : (
            <span
              aria-hidden="true"
              className="inline-flex h-14 w-14 items-center justify-center text-ink-soft"
            >
              <Profile size={48} variant="Bold" />
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs sm:text-sm text-danger text-right" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
