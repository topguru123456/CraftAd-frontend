import {
  ProjectWizardHeader,
  RatioPicker,
} from '@features/projects/flows/shared';
import { RATIOS_BY_ID } from '@features/projects/config/ratios.config';
import { cn } from '@lib/cn';
import { useVideoCreative } from '../context/VideoCreativeContext';

/* Veo 3's Gemini API accepts ONLY 9:16 (story) and 16:9 (landscape).
 * 1:1 and 4:5 are rejected by the API ("aspectRatio does not support
 * '1:1'"). Restricting the picker to just those two is honest UX —
 * better than offering ratios we'd have to silently coerce or fail on.
 * The image-creative flows continue to use 1:1/9:16/4:5 unchanged. */
const VIDEO_RATIOS = [RATIOS_BY_ID.landscape, RATIOS_BY_ID.story].filter(Boolean);

/* Phase 0 of the video-creative flow — pick the output aspect ratio.
 *
 * Doesn't appear in the visible "1/2/3" stepper because the choice
 * sits before any form content begins; switching mid-flow would
 * invalidate later inputs that depend on the format (e.g., layout
 * decisions that vary between story 9:16 and square 1:1).
 *
 * Mirrors product-images' RatioStep — same shared `<RatioPicker>`,
 * same gating ("continue" disabled until a ratio is chosen), same
 * "back exits the wizard" behavior. Where product-images talks about
 * "תמונת המוצר" in the subtitle, video swaps to "סרטון". */
export function RatioStep() {
  const { draft, updateDraft, next, back } = useVideoCreative();

  const canContinue = Boolean(draft.ratioId);

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <ProjectWizardHeader
        title="בחירת גודל"
        subtitle="בחרו את הגודל בו תרצו ליצור את הסרטון"
        onBack={back}
      />

      <RatioPicker
        selectedId={draft.ratioId}
        onSelect={(id) => updateDraft({ ratioId: id })}
        ratios={VIDEO_RATIOS}
      />

      <div className="flex justify-center pt-2">
        <button
          type="button"
          onClick={next}
          disabled={!canContinue}
          className={cn(
            'min-w-[280px] sm:min-w-[320px] rounded-xl py-3 px-6 font-bold text-md transition-colors',
            canContinue
              ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
              : 'bg-brand-100 text-brand-300 cursor-not-allowed'
          )}
        >
          המשך
        </button>
      </div>
    </div>
  );
}
