import { Dropdown } from '@components/ui';
import { cn } from '@lib/cn';
import { ProjectWizardField } from './ProjectWizardField';
import {
  CAMPAIGN_GOALS,
  CAMPAIGN_NATURES,
  CONVERSION_LOCATIONS,
  PROJECT_NAME_MAX,
  TARGET_AUDIENCES,
} from '../../config/project-fields.config';

/* Project-settings field grid — the "פרטי הפרויקט" form body shared by
 * every wizard whose first visible step asks for the same campaign-
 * shaped intake (project name, goal, nature, conversion location,
 * target audience). Currently campaign-creative and copywriting-ads.
 *
 * Pure presentational — reads `draft` and calls `updateDraft` only.
 * The owning step renders this inside ProjectWizardShell with the
 * appropriate stepper + actions.
 *
 * Layout matches the product mock:
 *   Row 1 (desktop): שם הפרויקט | מטרת הקמפיין
 *   Row 2 (desktop): אופי הקמפיין | מיקום המרה | מי קהל היעד?
 *
 * RTL DOM order = reading order. No column-reverse hacks. */
export function ProjectSettingsForm({ draft, updateDraft }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-x-5 gap-y-5">
      <ProjectWizardField
        label="שם הפרויקט"
        value={draft.name}
        max={PROJECT_NAME_MAX}
        className="lg:col-span-3"
      >
        <input
          type="text"
          value={draft.name}
          onChange={(e) => updateDraft({ name: e.target.value })}
          maxLength={PROJECT_NAME_MAX}
          placeholder="תנו שם לפרויקט שלכם!"
          dir="rtl"
          className={cn(
            'w-full rounded-xl border-2 border-brand-300 bg-white',
            'px-4 py-2.5 text-md text-ink placeholder:text-ink-soft text-right',
            'focus:border-brand-500 focus:outline-none focus:shadow-focus'
          )}
        />
      </ProjectWizardField>

      <ProjectWizardField label="מטרת הקמפיין" className="lg:col-span-3">
        <Dropdown
          options={CAMPAIGN_GOALS}
          value={draft.goalId}
          onChange={(id) => updateDraft({ goalId: id })}
          placeholder="מטרת הקמפיין"
          ariaLabel="מטרת הקמפיין"
        />
      </ProjectWizardField>

      <ProjectWizardField label="אופי הקמפיין" className="lg:col-span-2">
        <Dropdown
          options={CAMPAIGN_NATURES}
          value={draft.natureId}
          onChange={(id) => updateDraft({ natureId: id })}
          placeholder="אופי הקמפיין"
          ariaLabel="אופי הקמפיין"
        />
      </ProjectWizardField>

      <ProjectWizardField label="מיקום המרה" className="lg:col-span-2">
        <Dropdown
          options={CONVERSION_LOCATIONS}
          value={draft.conversionLocationId}
          onChange={(id) => updateDraft({ conversionLocationId: id })}
          placeholder="מיקום המרה"
          ariaLabel="מיקום המרה"
        />
      </ProjectWizardField>

      <ProjectWizardField label="מי קהל היעד?" className="md:col-span-2 lg:col-span-2">
        <Dropdown
          options={TARGET_AUDIENCES}
          value={draft.audienceId}
          onChange={(id) => updateDraft({ audienceId: id })}
          placeholder="קהל היעד"
          ariaLabel="קהל היעד"
        />
      </ProjectWizardField>
    </div>
  );
}
