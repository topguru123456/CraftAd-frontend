import { useCallback, useEffect, useRef, useState } from 'react';
import { FolderOpen, MagicStar, Trash } from 'iconsax-react';
import { Drawer } from '@components/ui';
import { cn } from '@lib/cn';
import { creativeImagesApi } from '../api/creative-images.api';

/* AI-image generation modal.
 *
 *   1. User describes the image they want (REQUIRED).
 *   2. User optionally uploads a reference image — when provided,
 *      Gemini uses it as a style/composition anchor; when omitted,
 *      generation is pure text-to-image.
 *   3. "Generate" calls /images/ai-generate. The backend builds the
 *      Gemini payload with or without an inline_data part depending
 *      on whether the FE sent a reference.
 *   4. The result appears in-place. User can "Generate again" or
 *      "Accept" to hand the URL back to the parent step.
 *
 * Layout: vertical stack — prompt on top (primary), reference under
 * it as an optional compact panel. The earlier 2-column variant
 * forced two equal-weight tiles which read as "both required" and
 * left a height mismatch on lg+ widths.
 */
const PROMPT_MAX = 2000;
const ACCEPTED_REFERENCE_TYPES = 'image/png,image/jpeg,image/webp';

export function AiGenerateModal({ open, onClose, onSelect }) {
  const [referenceFile, setReferenceFile] = useState(null);
  const [referenceUrl, setReferenceUrl] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [resultPath, setResultPath] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setReferenceFile(null);
      setReferenceUrl(null);
      setPrompt('');
      setStatus('idle');
      setErrorMessage(null);
      setResultUrl(null);
      setResultPath(null);
    }
  }, [open]);

  /* Object URL for the in-modal preview — created on file swap, revoked
   * on next swap / unmount so blob memory doesn't accumulate. */
  useEffect(() => {
    if (!referenceFile) {
      setReferenceUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(referenceFile);
    setReferenceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [referenceFile]);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleReferenceFiles = (event) => {
    const list = Array.from(event.target.files ?? []).filter((f) =>
      f.type?.startsWith('image/')
    );
    if (list.length) setReferenceFile(list[0]);
    event.target.value = '';
  };

  const removeReference = () => setReferenceFile(null);

  const canGenerate = status !== 'generating' && Boolean(prompt.trim());

  const runGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setStatus('generating');
    setErrorMessage(null);
    setResultUrl(null);
    setResultPath(null);

    const { data, error } = await creativeImagesApi.generateAiImage({
      prompt,
      referenceFile,
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message ?? 'ייצור התמונה נכשל. נסו שוב.');
      return;
    }

    setResultUrl(data.url);
    setResultPath(data.path);
    setStatus('done');
  }, [canGenerate, prompt, referenceFile]);

  const handleAccept = () => {
    if (!resultUrl) return;
    onSelect?.({ url: resultUrl, path: resultPath });
    onClose?.();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      ariaLabel="יצירת תמונה עם AI"
      panelClassName="bg-white overflow-hidden sm:w-[600px] lg:w-[720px]"
    >
      <div dir="rtl" className="flex flex-col h-full">
        <Header />

        <div className="flex-1 overflow-y-auto scrollbar-brand px-5 sm:px-7 py-5 space-y-5">
          <PromptSection
            prompt={prompt}
            onPromptChange={setPrompt}
            disabled={status === 'generating'}
          />

          <ReferenceSection
            file={referenceFile}
            previewUrl={referenceUrl}
            onPick={openFilePicker}
            onRemove={removeReference}
            disabled={status === 'generating'}
          />

          {errorMessage && (
            <p className="text-sm text-danger text-right">{errorMessage}</p>
          )}

          {(status === 'generating' || status === 'done') && (
            <ResultSection
              status={status}
              resultUrl={resultUrl}
              onAccept={handleAccept}
              onRegenerate={runGenerate}
              canRegenerate={canGenerate}
            />
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_REFERENCE_TYPES}
          onChange={handleReferenceFiles}
          className="hidden"
        />

        <Footer
          status={status}
          canGenerate={canGenerate}
          onGenerate={runGenerate}
          onClose={onClose}
        />
      </div>
    </Drawer>
  );
}

function Header() {
  return (
    <header className="px-5 sm:px-7 pt-6 pb-3 border-b border-line">
      <h2 className="text-xl sm:text-2xl font-extrabold text-ink text-right">
        יצירת תמונה עם AI
      </h2>
      <p className="mt-1 text-sm text-ink-muted text-right">
        תארו את התמונה שתרצו לקבל. תוכלו גם להעלות תמונת ייחוס (אופציונלי)
        כדי לעגן את הסגנון או הקומפוזיציה.
      </p>
    </header>
  );
}

function PromptSection({ prompt, onPromptChange, disabled }) {
  return (
    <Section
      label="תיאור התמונה הרצויה"
      hint={`עד ${PROMPT_MAX} תווים`}
    >
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        maxLength={PROMPT_MAX}
        rows={6}
        dir="rtl"
        disabled={disabled}
        placeholder="לדוגמה: בקבוק קולד-ברו על שיש לבן בתאורת בוקר רכה, רקע מטושטש, מבט-על מעט מוטה"
        className={cn(
          'w-full rounded-xl border border-line bg-white',
          'px-4 py-3 text-md text-ink placeholder:text-ink-soft text-right',
          'focus:border-brand-300 focus:outline-none focus:shadow-focus',
          'resize-y min-h-[180px]',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      />
      <div className="flex justify-end mt-1">
        <span
          dir="ltr"
          className={cn(
            'text-xs',
            prompt.length >= PROMPT_MAX ? 'text-danger font-bold' : 'text-ink-soft'
          )}
        >
          {prompt.length} / {PROMPT_MAX}
        </span>
      </div>
    </Section>
  );
}

function ReferenceSection({ file, previewUrl, onPick, onRemove, disabled }) {
  if (!file || !previewUrl) {
    return (
      <Section
        label="תמונת ייחוס (אופציונלי)"
        hint="שיפור התוצאה אם תספקו תמונה לסגנון או קומפוזיציה"
      >
        <button
          type="button"
          onClick={onPick}
          disabled={disabled}
          className={cn(
            'w-full rounded-xl border-2 border-dashed border-brand-200 bg-white',
            'flex items-center justify-center gap-4 text-right',
            'px-5 py-5 transition-colors',
            !disabled && 'hover:border-brand-400 hover:bg-brand-50/30',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          <FolderOpen size="28" variant="Linear" color="#ED5699" />
          <div>
            <p className="text-sm font-bold text-ink">לחצו לבחירת תמונה</p>
            <p className="text-xs text-ink-soft mt-0.5" dir="ltr">PNG, JPG, WEBP</p>
          </div>
        </button>
      </Section>
    );
  }

  return (
    <Section label="תמונת ייחוס (אופציונלי)" hint={file.name}>
      <div className="relative rounded-xl border border-line bg-white p-2 flex items-center justify-center">
        <img
          src={previewUrl}
          alt={file.name}
          className="max-h-[180px] max-w-full object-contain rounded-lg"
        />
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label="הסירו תמונת ייחוס"
          className={cn(
            'absolute top-2 start-2 inline-flex h-8 w-8 items-center justify-center',
            'rounded-full bg-white/90 backdrop-blur border border-line',
            'text-danger hover:bg-white hover:border-danger transition-colors',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          <Trash size="16" color="currentColor" variant="Linear" />
        </button>
      </div>
    </Section>
  );
}

function ResultSection({ status, resultUrl, onAccept, onRegenerate, canRegenerate }) {
  const isGenerating = status === 'generating';
  return (
    <Section label="תוצאה" hint={isGenerating ? 'ה-AI עובד על התמונה...' : 'בחרו לאשר או לייצר שוב'}>
      <div className="rounded-xl border border-line bg-surface-muted/30 p-4 min-h-[220px] flex items-center justify-center">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-3 text-ink-soft">
            <span
              aria-hidden="true"
              className="h-10 w-10 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin"
            />
            <p className="text-sm">ייצור בתהליך — עד 30 שניות בדרך כלל</p>
          </div>
        ) : resultUrl ? (
          <img
            src={resultUrl}
            alt="התמונה שנוצרה"
            className="max-h-[320px] max-w-full object-contain rounded-lg"
          />
        ) : null}
      </div>

      {!isGenerating && resultUrl && (
        <div className="flex flex-wrap items-center justify-end gap-3 mt-3">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={!canRegenerate}
            className={cn(
              'inline-flex items-center justify-center rounded-xl px-5 py-2.5',
              'text-sm font-bold border transition-colors',
              canRegenerate
                ? 'border-line text-ink bg-white hover:border-brand-300 hover:text-brand-500'
                : 'border-line text-ink-soft bg-white/60 cursor-not-allowed'
            )}
          >
            ייצור מחדש
          </button>
          <button
            type="button"
            onClick={onAccept}
            className={cn(
              'inline-flex items-center justify-center rounded-xl px-6 py-2.5',
              'text-sm font-bold bg-brand-gradient text-white shadow-brand',
              'hover:opacity-95 transition-opacity'
            )}
          >
            אישור והמשך
          </button>
        </div>
      )}
    </Section>
  );
}

function Section({ label, hint, children }) {
  return (
    <div className="space-y-2 text-right">
      <div className="flex items-baseline justify-between">
        <label className="block text-[15px] font-bold text-ink-muted">
          {label}
        </label>
        {hint && (
          <span className="text-xs text-ink-soft truncate ms-3">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Footer({ status, canGenerate, onGenerate, onClose }) {
  const isGenerating = status === 'generating';
  const hasResult = status === 'done';
  return (
    <footer className="px-5 sm:px-7 py-4 border-t border-line flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={onClose}
        disabled={isGenerating}
        className={cn(
          'inline-flex items-center justify-center rounded-xl px-4 py-2.5',
          'text-sm font-bold border border-line text-ink bg-white',
          'hover:border-brand-300 hover:text-brand-500 transition-colors',
          isGenerating && 'opacity-60 cursor-not-allowed'
        )}
      >
        ביטול
      </button>

      {!hasResult && (
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className={cn(
            'inline-flex items-center gap-2 justify-center rounded-xl px-6 py-2.5',
            'text-sm font-bold transition-opacity',
            canGenerate
              ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
              : 'bg-brand-100 text-brand-300 cursor-not-allowed'
          )}
        >
          {isGenerating ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
            />
          ) : (
            <MagicStar size="18" variant="Bold" color="currentColor" />
          )}
          {isGenerating ? 'מייצר...' : 'יצירת תמונה'}
        </button>
      )}
    </footer>
  );
}
