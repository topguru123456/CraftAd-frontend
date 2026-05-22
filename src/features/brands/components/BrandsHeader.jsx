import AiStarIcon from '@assets/icons/sidebar/stars_selected.svg';
import { BackButton } from '@components/ui';
import { cn } from '@lib/cn';

/* Brands feature page header.
 *
 * Used in two places today, with one component:
 *   1. Brand list (default props): right-aligned greeting + subtitle.
 *   2. Brand creation launcher: centered title + subtitle + back arrow,
 *      provided via the `title`, `subtitle`, `align`, and `onBack` props.
 *
 * Props are all optional so the existing `<BrandsHeader />` call sites
 * keep working unchanged.
 */
const DEFAULT_TITLE = (
  <>
    ברוכים השבים!
    <br />
    הגדירו כאן את המותגים שלכם
  </>
);

const DEFAULT_SUBTITLE =
  'זה השלב הראשון בדרך ליצירת התכנים עבור המותג שלכם. זה רק כמה צעדים פשוטים, לא יותר מ-3 דקות!';

export function BrandsHeader({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  align = 'start',
  onBack,
}) {
  const isCenter = align === 'center';

  return (
    <header
      dir="rtl"
      className={cn('relative space-y-2', isCenter ? 'text-center' : 'text-right')}
    >
      {onBack && <BackButton floating onClick={onBack} />}

      <div
        className={cn(
          'flex items-center gap-3',
          isCenter ? 'justify-center' : 'justify-start'
        )}
      >
        <h1 className="text-2xl sm:text-[32px] font-extrabold text-ink leading-tight">
          {title}
        </h1>
        <img src={AiStarIcon} alt="כוכב" className="w-10 h-10 shrink-0" />
      </div>

      <p
        className={cn(
          'text-sm sm:text-[18px] text-ink-muted',
          isCenter && 'max-w-2xl mx-auto'
        )}
      >
        {subtitle}
      </p>
    </header>
  );
}
