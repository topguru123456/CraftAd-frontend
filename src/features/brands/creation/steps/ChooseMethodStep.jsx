import { useState } from 'react';
import { ArrowLeft2 } from 'iconsax-react';
import BrushIcon from '@assets/icons/brush.svg?react';
import ZapIcon from '@assets/icons/zap.svg?react';
import LinkIcon from '@assets/icons/link.svg?react';
import { IconTile } from '@components/ui';
import { cn } from '@lib/cn';
import { BrandsHeader } from '../../components/BrandsHeader';
import { useBrandCreation } from '../context/BrandCreationContext';

/* QA-approved copy for any invalid URL/domain input. Keep verbatim
 * — design + product agreed on this exact phrasing. */
const INVALID_URL_MESSAGE = 'כתובת האתר אינה תקינה. אנא הזינו כתובת URL חוקית.';

/* Domain-shape regex: at least one dot, alphanumeric labels with
 * optional hyphens (RFC 1035-style, max 63 chars per label), TLD must
 * be 2+ letters. Used as a check on the parsed `URL.hostname`, not on
 * the raw input — the URL constructor handles protocols / paths /
 * ports / queries for us; this regex rejects things URL() happily
 * accepts but aren't real public domains (e.g. `notarealhost`,
 * `192.168.1.1`, `localhost`). */
const DOMAIN_HOSTNAME_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

function isValidWebsiteUrl(input) {
  const trimmed = input.trim();
  if (!trimmed) return false;
  /* Accept bare domains (`craftad.ai`) and fully-qualified URLs
   * (`https://craftad.ai/about`). If no protocol, prepend https:// so
   * the URL constructor can parse the hostname out. */
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProtocol);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return DOMAIN_HOSTNAME_RE.test(u.hostname);
  } catch {
    return false;
  }
}

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
  /* Inline error displayed under the input when client-side URL
   * validation fails. Cleared when the user starts typing again. */
  const [urlError, setUrlError] = useState(null);

  const handleUrlChange = (next) => {
    setUrl(next);
    if (urlError) setUrlError(null);
  };

  const handleUrlSubmit = (event) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isValidWebsiteUrl(trimmed)) {
      setUrlError(INVALID_URL_MESSAGE);
      return;
    }
    setUrlError(null);
    /* AutoFetchModal opens (driven by context isFetching), runs the
       scrape, prefills draft, and the wizard advances to the identity
       step on success. Server-side failures are wrapped to Hebrew by
       BrandCreationContext.startAuto, so the AutoFetchModal ErrorState
       never displays raw apiClient transport messages. */
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
          <form onSubmit={handleUrlSubmit} className="w-full" noValidate>
            <UrlInput
              value={url}
              onChange={handleUrlChange}
              hasError={Boolean(urlError)}
            />
            {urlError && (
              <p
                className="mt-2 text-sm font-medium text-danger text-right"
                role="alert"
                aria-live="polite"
              >
                {urlError}
              </p>
            )}
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

function UrlInput({ value, onChange, hasError }) {
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
        aria-invalid={hasError || undefined}
        className={cn(
          'w-full rounded-xl border bg-white',
          'ps-10 pe-[112px] py-3 text-sm text-ink placeholder:text-ink-soft',
          'focus:outline-none focus:shadow-focus',
          hasError
            ? 'border-danger focus:border-danger'
            : 'border-brand-200 focus:border-brand-400'
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
