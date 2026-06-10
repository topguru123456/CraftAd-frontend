import { useState } from 'react';
import { useActiveBrand } from '@/contexts/BrandsContext';
import { VideoIcon, MenuIcon } from '@features/navigation';
import { VideoTutorialModal } from '@features/tutorials';
import { SupportBanner } from './SupportBanner';

/* App-wide header.
 *
 * The centered logo is "the active brand's mark" — it cascades from the
 * sidebar's brand picker (BrandsContext.activeBrand). When no brand is
 * selected the center stays empty — the previous Craftad-logo
 * fallback was misleading because users mistook it for their brand;
 * an empty center honestly reflects "no brand active."
 *
 * Mobile responsiveness:
 *   - Logo height steps down from 48px to 32px so it fits between the
 *     hamburger and tutorial button without colliding.
 *   - Tutorial button collapses to icon-only on small screens — the
 *     Hebrew label is hidden, the video glyph alone communicates intent.
 *   - The right-side hamburger spacer narrows on mobile (44px = the
 *     hamburger itself) and only inflates to 140px from sm+ to keep the
 *     centered logo symmetric with the tutorial button on desktop.
 */
export function AppHeader({ onOpenSidebar }) {
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const { activeBrand } = useActiveBrand();

  return (
    <header className="bg-white border-b border-line">
      <SupportBanner />
      <div className="relative flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 gap-2" dir="rtl">
        {/* Right side (RTL start). Hamburger trigger on mobile; on lg+
            the trigger is hidden but the slot stays at 140px so the
            centered logo remains symmetric with the tutorial button. */}
        <div className="flex items-center w-11 sm:w-[140px] shrink-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="פתח תפריט"
            className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-md text-ink hover:bg-surface-muted transition-colors"
          >
            <MenuIcon className="h-8 w-8 text-brand-600"/>
          </button>
        </div>

        {/* Centered logo. `max-w` caps width so on mobile the logo can't
            push into the side controls; `object-contain` preserves the
            aspect ratio inside that cap. When no active brand, render
            nothing — see component docstring. */}
        {activeBrand?.logoUrl && (
          <div className="absolute left-1/2 -translate-x-1/2 px-2">
            <img
              src={activeBrand.logoUrl}
              alt={activeBrand.name}
              className="h-8 sm:h-12 w-auto max-w-[140px] sm:max-w-[220px] object-contain"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setTutorialOpen(true)}
          aria-label="סרטון הדרכה"
          className="inline-flex items-center gap-2 rounded-card border border-line bg-white px-3 sm:px-4 py-2 text-sm sm:text-md font-medium text-ink hover:border-brand-200 hover:bg-brand-50/40 transition-colors shrink-0"
        >
          {/* Label hidden on mobile to free horizontal space; on sm+
              the icon + label pair returns. The button still has an
              aria-label so screen readers always have the full intent. */}
          <span className="hidden sm:inline">סרטון הדרכה</span>
          <VideoIcon className="h-5 w-5 text-brand-500" />
        </button>
      </div>

      <VideoTutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </header>
  );
}
