import { useCallback, useEffect, useRef, useState } from 'react';
import { FolderOpen, MagicStar, Trash } from 'iconsax-react';
import { Modal } from '@components/ui';
import { cn } from '@lib/cn';
import { creativeImagesApi } from '../api/creative-images.api';

/* AI-image generation modal (Gemini 2.5 Flash Image).
 *
 * The whole flow lives in this one modal:
 *
 *   1. User uploads a reference image (REQUIRED). The reference
 *      anchors what Gemini produces — per product decision, text-only
 *      generation is not allowed, so we block "Generate" until a
 *      reference is staged.
 *   2. User describes what they want in the prompt textarea.
 *   3. "Generate" calls `generate-image`. The edge function calls
 *      Gemini, uploads the returned bytes to campaign-uploads, and
 *      returns a public URL.
 *   4. The result appears in-place. User can:
 *        - "Generate again" — same reference + prompt, fresh call
 *        - "Accept" — handoff to ImagesStep via onSelect and close
 *
 * State machine (`status`):
 *   'idle'        — ready for input
 *   'generating'  — request in flight; both buttons disabled
 *   'done'        — result rendered; accept / regenerate available
 *   'error'       — last call failed; show message, allow retry
 *
 * Notes on the reference:
 *   - The browser holds the File in state and converts to base64 in
 *     the API client. We don't upload the reference to Storage —
 *     it's only there to give Gemini visual context. If we ever
 *     start saving references for traceability, switch to upload-
 *     first + URL-passing in the payload.
 *   - Object URL is used for the in-modal preview and revoked on
 *     swap / unmount so we don't leak memory across regenerations.
 *
 * Notes on the result:
 *   - We do NOT auto-accept after a successful generation. The user
 *     decides whether the result is good enough; "Generate again"
 *     burns another Gemini call but keeps them in control.
 *   - If the user closes the modal without accepting, the generated
 *     URL stays in our bucket. The TODO orphan cleanup mentioned in
 *     the migration handles this eventually.
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

  /* Reset on close so a re-open starts fresh. Tied to `open` rather
   * than unmount so we don't lose state during transient focus
   * shifts. */
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

  /* Manage the reference preview object URL — create on file change,
   * revoke on swap / close so blob memory doesn't accumulate across
   * regenerations or modal sessions. */
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
    /* Reset so re-picking the same file still fires onChange. */
    event.target.value = '';
  };

  const removeReference = () => setReferenceFile(null);

  const canGenerate =
    status !== 'generating' && Boolean(referenceFile) && Boolean(prompt.trim());

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
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      ariaLabel="יצירת תמונה עם AI"
      panelClassName="bg-white"
    >
      <div dir="rtl" className="flex flex-col max-h-[90vh]">
        <Header />

        <div className="flex-1 overflow-y-auto scrollbar-brand px-5 sm:px-7 py-5 space-y-5">
          {/* Two-column input area on lg+, stacked under that. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ReferenceSection
              file={referenceFile}
              previewUrl={referenceUrl}
              onPick={openFilePicker}
              onRemove={removeReference}
              disabled={status === 'generating'}
            />
            <PromptSection
              prompt={prompt}
              onPromptChange={setPrompt}
              disabled={status === 'generating'}
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-danger text-right">{errorMessage}</p>
          )}

          {/* Result strip — appears after a successful generation. */}
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
    </Modal>
  );
}

function Header() {
  return (
    <header className="px-5 sm:px-7 pt-6 pb-3 border-b border-line">
      <h2 className="text-xl sm:text-2xl font-extrabold text-ink text-right">
        יצירת תמונה עם AI
      </h2>
      <p className="mt-1 text-sm text-ink-muted text-right">
        העלו תמונת ייחוס ותארו את התמונה שתרצו לקבל. ה-AI ייצר תמונה
        חדשה על בסיס שניהם.
      </p>
    </header>
  );
}

function ReferenceSection({ file, previewUrl, onPick, onRemove, disabled }) {
  if (!file || !previewUrl) {
    return (
      <Section
        label="תמונת ייחוס"
        hint="חובה — ה-AI ישתמש בתמונה כבסיס ויצמיד את התוצאה לסגנון שלה"
      >
        <button
          type="button"
          onClick={onPick}
          disabled={disabled}
          className={cn(
            'w-full rounded-xl border-2 border-dashed border-brand-200 bg-white',
            'flex flex-col items-center justify-center text-center',
            'px-5 py-10 transition-colors',
            !disabled && 'hover:border-brand-400 hover:bg-brand-50/30',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          <FolderOpen size="40" variant="Linear" color="#ED5699" className="mb-3" />
          <p className="text-sm font-bold text-ink mb-1">לחצו לבחירת תמונה</p>
          <p className="text-xs text-ink-soft" dir="ltr">PNG, JPG, WEBP</p>
        </button>
      </Section>
    );
  }

  return (
    <Section
      label="תמונת ייחוס"
      hint={file.name}
    >
      <div className="relative rounded-xl border border-line bg-white p-2 min-h-[220px] flex items-center justify-center">
        <img
          src={previewUrl}
          alt={file.name}
          className="max-h-[260px] max-w-full object-contain rounded-lg"
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
        rows={8}
        dir="rtl"
        disabled={disabled}
        placeholder="לדוגמה: בקבוק קולד-ברו על שיש לבן בתאורת בוקר רכה, רקע מטושטש, מבט-על מעט מוטה"
        className={cn(
          'w-full rounded-xl border border-line bg-white',
          'px-4 py-3 text-md text-ink placeholder:text-ink-soft text-right',
          'focus:border-brand-300 focus:outline-none focus:shadow-focus',
          'resize-y min-h-[220px]',
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
  /* Hide the primary "Generate" CTA once a result is rendered — the
   * action then lives in the result section ("Regenerate" / "Accept"
   * + Close). This keeps the footer from competing with the
   * result-section CTAs. */
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
