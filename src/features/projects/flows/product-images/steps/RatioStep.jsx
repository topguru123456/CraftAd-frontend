import {
  ProjectWizardHeader,
  RatioPicker,
} from '@features/projects/flows/shared';
import { IMAGE_RATIOS } from '@features/projects/config/ratios.config';
import { cn } from '@lib/cn';
import { useProductImages } from '../context/ProductImagesContext';

/* Phase 0 of the product-images flow — pick the output aspect ratio.
 *
 * Doesn't appear in the visible "1/2" stepper because it's a
 * precondition for everything that follows: switching ratio mid-form
 * would invalidate the user's product image upload (the image is
 * generated to fit the chosen size). Locked once you advance.
 *
 * Mirrors campaign-creative's ContentSizeStep, minus the platform
 * picker — product images aren't platform-specific, they're sized by
 * intended use (story / square / portrait). The brief omits platform
 * by design.
 *
 * Continue → forwards to the customization step via the wizard's
 * `next()`. Back exits the wizard. */
export function RatioStep() {
  const { draft, updateDraft, next, back } = useProductImages();

  const canContinue = Boolean(draft.ratioId);

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <ProjectWizardHeader
        title="בחירת גודל"
        subtitle="בחרו את הגודל בו תרצו ליצור את תמונת המוצר"
        onBack={back}
      />

      <RatioPicker
        selectedId={draft.ratioId}
        onSelect={(id) => updateDraft({ ratioId: id })}
        ratios={IMAGE_RATIOS}
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
