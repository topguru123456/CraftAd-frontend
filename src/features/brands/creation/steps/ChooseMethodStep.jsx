import { useState } from 'react';
import { ArrowLeft2 } from 'iconsax-react';
import BrushIcon from '@assets/icons/brush.svg?react';
import ZapIcon from '@assets/icons/zap.svg?react';
import LinkIcon from '@assets/icons/link.svg?react';
import { IconTile } from '@components/ui';
import { cn } from '@lib/cn';
import { BrandsHeader } from '../../components/BrandsHeader';
import { useBrandCreation } from '../context/BrandCreationContext';

/* Step 0 — choose creation method.
 *
 * Two cards: auto (paste a URL we can scrape) or manual (4-step wizard).
 *
 * Layout (RTL):
 *   - Mobile: cards stack vertically, "או" centers horizontally between.
 *   - Desktop (md+): cards side-by-side, "או" sits vertically between.
 *   - DOM order [auto, או, manual] → on desktop auto lands on the visual
 *     right and manual on the left, matching the screenshot. On mobile
 *     the column flow puts auto on top.
 *
 * Navigation goes through the wizard context — this file doesn't know
 * what step comes next, just that the user picked a path.
 */
export function ChooseMethodStep() {
  const { startAuto, startManual, cancel, isFetching } = useBrandCreation();
  const [url, setUrl] = useState('');

  const handleUrlSubmit = (event) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    /* AutoFetchModal opens (driven by context isFetching), runs the
       scrape, prefills draft, and the wizard advances to the identity
       step on success. */
    startAuto(trimmed);
  };

  const handleManual = () => {
    startManual();
  };

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8">
      <BrandsHeader
        title="הקימו מותג חדש"
        subtitle="בחרו אם להקים את המותג אוטומטית באמצעות צירוף קישור לאתר המותג או ידנית בכמה שלבים מהירים"
        onBack={cancel}
      />

      <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-5 lg:gap-6">
        {/* Auto card — DOM[0]. On desktop visual-right; on mobile top. */}
        <ChoiceCard
          icon={ZapIcon}
          title="הקמה אוטומטית באמצעות קישור לאתר"
          description="אם יש למותג אתר קיים - אנחנו יכולים להקים לכם את המותג אוטומטית! תוכלו לשנות אחר כך מה שתרצו."
        >
          <form onSubmit={handleUrlSubmit} className="w-full">
            <UrlInput value={url} onChange={setUrl} />
          </form>
        </ChoiceCard>

        <Divider />

        <ChoiceCard
          icon={BrushIcon}
          title="הקמה ידנית ב-4 שלבים מהירים"
          description="אין אתר? אתם יכולים בקלות להעלות את פרטי המותג שלכם ולהתאים את ההגדרות באיזה אופן שתרצו."
        >
          <button
            type="button"
            onClick={handleManual}
            className={cn(
              'w-full rounded-xl border-2 border-brand-400 bg-white',
              'py-3 text-base font-bold text-brand-500',
              'hover:bg-brand-50 transition-colors'
            )}
          >
            יצירה ידנית
          </button>
        </ChoiceCard>
      </div>
    </div>
  );
}

function ChoiceCard({ icon, title, description, children }) {
  return (
    <div
      className={cn(
        'flex-1 flex flex-col items-center text-center',
        'bg-white rounded-3xl border-2 border-brand-200',
        'shadow-soft p-6 sm:p-8 lg:p-9'
      )}
    >
      <IconTile icon={icon} size="md" className="mb-5 sm:mb-6" />
      <h3 className="text-base sm:text-lg lg:text-xl font-extrabold text-ink mb-2 sm:mb-3">
        {title}
      </h3>
      <p className="text-sm text-ink-muted mb-5 sm:mb-6 flex-1 max-w-[34ch]">
        {description}
      </p>
      <div className="w-full">{children}</div>
    </div>
  );
}

/* "או" separator. Centered in either layout — flex direction switches
 * with the surrounding container, so the same JSX works for stacked
 * (mobile) and side-by-side (desktop) variants. */
function Divider() {
  return (
    <div className="flex items-center justify-center md:px-1 lg:px-2">
      <span className="text-lg sm:text-xl font-extrabold text-ink-muted">או</span>
    </div>
  );
}

function UrlInput({ value, onChange }) {
  const hasValue = Boolean(value.trim());
  return (
    <div className="relative w-full">
      <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none">
        <LinkIcon className="h-5 w-5" />
      </span>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="הזינו כתובת האתר, נגיד Craftad.ai"
        className={cn(
          'w-full rounded-xl border border-brand-200 bg-white',
          'ps-10 pe-[112px] py-3 text-sm text-ink placeholder:text-ink-soft',
          'focus:border-brand-400 focus:outline-none focus:shadow-focus'
        )}
      />
      <button
        type="submit"
        disabled={!hasValue}
        className={cn(
          'absolute inset-y-1 end-1 inline-flex items-center gap-1.5',
          'px-4 rounded-lg text-sm font-bold transition-colors',
          hasValue
            ? 'bg-brand-500 text-white hover:bg-brand-600'
            : 'bg-brand-100 text-brand-300 cursor-not-allowed'
        )}
      >
        {/* Forward action in RTL → arrow points left. */}
        <ArrowLeft2 size="16" variant="Linear" color="currentColor" />
        <span>המשך</span>
      </button>
    </div>
  );
}
