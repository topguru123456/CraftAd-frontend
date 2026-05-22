import { useState } from 'react';
import { PageContainer } from '@components/ui';
import {
  CreativeScoreResultModal,
  ScoringInProgressModal,
  UploadDropzone,
  creativeScoreApi,
} from '@features/creative-score';
import { cn } from '@lib/cn';

/* /app/creative-score
 *
 * One-shot, ephemeral flow:
 *   pick image → "המשך" → GPT-4o vision (~5-15s) → score modal → close resets.
 *
 * The page intentionally does NOT persist anything. Each upload is sent
 * inline as a base64 data URL to /scoring/score-creative; the score comes
 * back in the same response and lives in component state until the modal
 * closes. If the user wants history, that's a separate `creative_scores`
 * table from handoff §12.11 — not built yet, by product decision.
 *
 * Dropzone is locked to single-file mode (`multiple={false}`) to match the
 * one-image-per-result UX. The modal includes a "סרוק תמונה אחרת" CTA
 * that just resets state and lets the user pick a new file.
 */
export default function CreativeScorePage() {
  /* `selectedFile` holds the user's pick until they hit Continue; the
   * generic Object means we don't try to re-derive a preview URL here
   * (the modal gets one from the API response). */
  const [selectedFile, setSelectedFile] = useState(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFilesSelected = (files) => {
    /* Single-file dropzone — first item is what was picked. */
    const next = files?.[0] ?? null;
    setSelectedFile(next);
    setScoreError(null);
  };

  const handleContinue = async () => {
    if (!selectedFile || isScoring) return;
    setIsScoring(true);
    setScoreError(null);
    const { data, error } = await creativeScoreApi.scoreCreative(selectedFile);
    setIsScoring(false);
    if (error) {
      setScoreError(error.message ?? 'הציון נכשל. נסו שוב.');
      return;
    }
    setResult(data);
  };

  const reset = () => {
    setResult(null);
    setSelectedFile(null);
    setScoreError(null);
  };

  const canContinue = selectedFile !== null && !isScoring;

  return (
    <PageContainer>
      <div dir="rtl" className="space-y-5 sm:space-y-6">
        <header className="space-y-1.5 text-right">
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-ink leading-tight">
            ציון קריאייטיב
          </h1>
          <p className="text-sm sm:text-base text-ink-muted">
            העלו מודעה קיימת וקבלו ציון מיידי עם המלצות לשיפור — בלי לבזבז כסף וזמן.
          </p>
        </header>

        <section className="bg-white border border-line rounded-3xl shadow-soft p-5 sm:p-7 space-y-5">
          <p className="text-right text-sm sm:text-base text-ink-muted">
            תמכו ב-PNG, JPG או WEBP. הציון מנותח ב-AI ולא נשמר אצלנו.
          </p>

          {/* Dropzone keeps showing the user's preview during scoring —
              the loading status is communicated via ScoringInProgressModal
              below, which renders on top and blocks input. Don't pass
              isLoading=true here: it would replace the preview with a
              tiny spinner that competes with the modal for attention. */}
          <UploadDropzone
            onFilesSelected={handleFilesSelected}
            isLoading={false}
            multiple={false}
            selectedFile={selectedFile}
          />

          {scoreError && (
            <p className="text-right text-sm text-danger">{scoreError}</p>
          )}

          <div className="flex justify-center pt-1">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className={cn(
                'w-full sm:w-auto sm:min-w-[280px] md:min-w-[320px]',
                'inline-flex items-center justify-center gap-2',
                'rounded-xl py-2.5 px-6 font-bold text-base transition-colors',
                canContinue
                  ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-brand'
                  : 'bg-brand-100 text-brand-300 cursor-not-allowed',
                isScoring && 'cursor-wait'
              )}
            >
              {isScoring && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
                />
              )}
              <span>{isScoring ? 'מנתח את המודעה...' : 'קבלת ציון'}</span>
            </button>
          </div>
        </section>
      </div>

      {/* Scoring-in-progress modal opens for the duration of the GPT-4o
          vision call (~5-15s). No close affordance — the parent flips
          `isScoring` to false when the API resolves or errors out. */}
      <ScoringInProgressModal open={isScoring} />

      <CreativeScoreResultModal
        open={result !== null}
        result={result}
        onClose={reset}
      />
    </PageContainer>
  );
}
