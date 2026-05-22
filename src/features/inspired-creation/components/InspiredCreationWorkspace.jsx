import { useState } from 'react';
import { ArrowLeft2, DocumentText, MagicStar } from 'iconsax-react';
import { cn } from '@lib/cn';
import { InspiredUploadSlot } from './InspiredUploadSlot';

export function InspiredCreationWorkspace({ onGenerate, onBack }) {
  const [productFile, setProductFile] = useState(null);
  const [inspirationFile, setInspirationFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canGenerate = Boolean(productFile && inspirationFile) && !isSubmitting;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsSubmitting(true);
    try {
      await onGenerate?.({ productFile, inspirationFile });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white border border-line rounded-3xl shadow-soft p-5 sm:p-7 lg:p-8 space-y-6 sm:space-y-7">
      {/* Desktop: product (visual right) | inspiration (visual left). Mobile: product first. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        <InspiredUploadSlot
          title="העלו תמונה של המוצר שלכם או תמונה שתשמש את הקריאייטיב"
          file={productFile}
          onFileChange={setProductFile}
          showDeviceButton
          disabled={isSubmitting}
        />

        <InspiredUploadSlot
          icon={
            <span
              aria-hidden="true"
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500"
            >
              <DocumentText size={28} variant="Bold" color="currentColor" />
            </span>
          }
          title="העלו מודעה/קריאייטיב להשראה"
          file={inspirationFile}
          onFileChange={setInspirationFile}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex items-center justify-start gap-3 pt-1" dir="rtl">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="חזרה"
            className={cn(
              'inline-flex h-12 w-12 shrink-0 items-center justify-center',
              'rounded-xl border border-brand-300 bg-white text-brand-600',
              'hover:bg-brand-50 transition-colors',
            )}
          >
            <ArrowLeft2 size={22} variant="Linear" color="currentColor" />
          </button>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={cn(
            'inline-flex h-12 min-w-[200px] sm:min-w-[280px] items-center justify-center gap-2',
            'rounded-xl px-6 text-base font-bold transition-opacity',
            canGenerate
              ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
              : 'bg-brand-100 text-brand-300 cursor-not-allowed',
            isSubmitting && 'cursor-wait opacity-90',
          )}
        >
          {isSubmitting ? (
            <span
              aria-hidden="true"
              className="h-5 w-5 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
            />
          ) : (
            <MagicStar size={20} variant="Bold" color="currentColor" />
          )}
          <span>{isSubmitting ? 'מייצר…' : 'תג׳נרט לי תוכן'}</span>
        </button>
      </div>
    </section>
  );
}
