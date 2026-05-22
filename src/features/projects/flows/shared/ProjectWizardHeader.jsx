import AiStarIcon from '@assets/icons/sidebar/stars_selected.svg';
import { BackButton } from '@components/ui';

/* Centered wizard page header — title, optional sparkle, subtitle,
 * back arrow pinned to the visual start (RTL right). */
export function ProjectWizardHeader({ title, subtitle, onBack }) {
  return (
    <header className="relative space-y-2 text-center">
      {onBack && <BackButton floating onClick={onBack} />}

      <div className="flex items-center justify-center gap-3">
        <h1 className="text-2xl sm:text-[28px] font-extrabold text-ink leading-tight">
          {title}
        </h1>
        <img src={AiStarIcon} alt="" aria-hidden="true" className="w-9 h-9 shrink-0" />
      </div>

      {subtitle && (
        <p className="text-sm sm:text-base text-ink-muted max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
    </header>
  );
}
