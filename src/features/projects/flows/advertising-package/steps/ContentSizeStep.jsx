import { useRef } from 'react';
import AiStarIcon from '@assets/icons/sidebar/stars_selected.svg';
import { BackButton } from '@components/ui';
import { useAdvertisingPackage } from '../context/AdvertisingPackageContext';
import { PlatformPicker } from '@features/projects/components/PlatformPicker';
import { RatioPicker } from '@features/projects/flows/shared';
import { IMAGE_RATIOS } from '@features/projects/config/ratios.config';
import { cn } from '@lib/cn';

/* Phase 0 of the advertising-package flow — platform + aspect ratio.
 *
 * Hidden from the visible "1/2/3" stepper because both choices are
 * locked preconditions: a Meta-9:16 brief and a TikTok-1:1 brief
 * produce different downstream layouts, so flipping mid-form would
 * invalidate later inputs. Same UX contract as campaign-creative's
 * ContentSizeStep — picking a platform auto-scrolls to the ratio
 * section so the user doesn't have to hunt for it.
 *
 * Ratio set: IMAGE_RATIOS (square / story / portrait — the same set
 * other image-output flows use). Landscape (16:9) is video-only and
 * intentionally excluded; advertising-package's image side runs
 * against the same generation pipeline as campaign-creative. */
export function ContentSizeStep() {
  const { draft, updateDraft, next, back } = useAdvertisingPackage();
  const ratioSectionRef = useRef(null);

  const handlePlatformSelect = (id) => {
    updateDraft({ platformId: id });
    /* Defer one frame so the picker's selected-state class lands
     * before scroll. requestAnimationFrame is enough — longer
     * setTimeouts read as laggy. */
    requestAnimationFrame(() => {
      ratioSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const handleRatioSelect = (id) => {
    updateDraft({ ratioId: id });
  };

  const canContinue = Boolean(draft.platformId) && Boolean(draft.ratioId);

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8 pb-12">
      <Header onBack={back} />

      <PlatformPicker
        selectedId={draft.platformId}
        onSelect={handlePlatformSelect}
      />

      <RatioPicker
        ref={ratioSectionRef}
        selectedId={draft.ratioId}
        onSelect={handleRatioSelect}
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
              : 'bg-brand-100 text-brand-300 cursor-not-allowed',
          )}
        >
          המשך
        </button>
      </div>
    </div>
  );
}

function Header({ onBack }) {
  return (
    <header className="relative space-y-2 text-center">
      {onBack && <BackButton floating onClick={onBack} />}

      <div className="flex items-center justify-center gap-3">
        <h1 className="text-2xl sm:text-[28px] font-extrabold text-ink leading-tight">
          בחירת גודל תוכן
        </h1>
        <img src={AiStarIcon} alt="" aria-hidden="true" className="w-9 h-9 shrink-0" />
      </div>
      <p className="text-sm sm:text-base text-ink-muted max-w-3xl mx-auto">
        בחרו את גודל התוכן אותו תרצו ליצור, בהתאם לפלטפורמה בה תרצו לפרסם
      </p>
    </header>
  );
}
