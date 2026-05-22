import { useState } from 'react';
import AiStarIcon from '@assets/icons/sidebar/stars_selected.svg';
import { BackButton } from '@components/ui';
import { ProjectTypesGrid } from './ProjectTypesGrid';

/* Project-creation entry point — the "what kind of project?" chooser.
 *
 * Lives inline on ProjectsPage (no separate route): clicking "צרו
 * פרויקט חדש" flips the page from list mode into this view; the back
 * arrow returns. Keeping the route stable matches the brand-creation
 * pattern.
 *
 * Selection model:
 *   - Click a card → it becomes selected; nothing happens yet. The
 *     screenshot's pink-ringed card matches this state.
 *   - Future iteration will route to that type's specific creation
 *     flow once each one's UI is spec'd. For now, `onSelect` is
 *     invoked when the user picks a card so the parent can wire the
 *     dispatch when ready.
 *
 * Coming-soon types render disabled inside the card itself (see
 * ProjectTypeCard) — this component doesn't need to think about it.
 */
export function ProjectCreationLauncher({ onCancel, onSelect }) {
  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = (type) => {
    setSelectedId(type.id);
    onSelect?.(type);
  };

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8">
      <Header onBack={onCancel} />
      <ProjectTypesGrid selectedId={selectedId} onSelect={handleSelect} />
    </div>
  );
}

/* Centered title + sparkle + subtitle, with the back arrow pinned to
 * the visual left (RTL end). Mirrors BrandsHeader's centered variant —
 * not extracted to a shared component yet because there are still only
 * two consumers and they could plausibly diverge (sparkle asset,
 * subtitle copy patterns, etc.). When a third use lands, extract. */
function Header({ onBack }) {
  return (
    <header dir="rtl" className="relative space-y-2 text-center">
      {onBack && <BackButton floating onClick={onBack} />}

      <div className="flex items-center justify-center gap-3">
        <h1 className="text-2xl sm:text-[28px] font-extrabold text-ink leading-tight">
          בחרו איזה תוכן ונכסים דיגיטליים תרצו לייצר באמצעות AI
        </h1>
        <img src={AiStarIcon} alt="" aria-hidden="true" className="w-9 h-9 shrink-0" />
      </div>
      <p className="text-sm sm:text-base text-ink-muted max-w-3xl mx-auto">
        זה השלב הראשון בדרך ליצירת התכנים עבור המותג שלכם. זה רק כמה צעדים פשוטים, לא יותר מ-3 דקות!
      </p>
    </header>
  );
}
