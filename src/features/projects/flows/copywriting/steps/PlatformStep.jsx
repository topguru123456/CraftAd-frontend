import { PlatformPicker } from '@features/projects/components/PlatformPicker';
import { ProjectWizardHeader } from '@features/projects/flows/shared';
import { cn } from '@lib/cn';
import { useCopywriting } from '../context/CopywritingContext';

/* Phase 0 of the copywriting-ads flow — pick a target social platform.
 *
 * Mirrors campaign-creative's ContentSizeStep, minus the ratio picker
 * (copywriting outputs text, not images — there's no aspect ratio).
 * Doesn't appear in the visible "1/2/3" stepper for the same reason as
 * ContentSizeStep: the platform is a precondition for everything that
 * follows, so it's locked once you advance.
 *
 * Continue → forwards to the settings step via the wizard's `next()`. */
export function PlatformStep() {
  const { draft, updateDraft, next, back } = useCopywriting();

  const handlePlatformSelect = (id) => {
    updateDraft({ platformId: id });
  };

  const canContinue = Boolean(draft.platformId);

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <ProjectWizardHeader
        title="בחירת פלטפורמה"
        subtitle="בחרו את הפלטפורמה אליה תכתבו את הטקסט הפרסומי"
        onBack={back}
      />

      <PlatformPicker
        selectedId={draft.platformId}
        onSelect={handlePlatformSelect}
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
