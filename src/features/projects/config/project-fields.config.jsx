/* Frozen taxonomies for project-creation wizards.
 *
 * Shared by every flow whose first visible step asks for project
 * settings (campaign-creative, copywriting-ads, and any future type
 * that follows the same campaign-shaped intake). One place to add or
 * relabel an option; all flows pick it up.
 *
 * Conventions match `character.config.js` in brand creation:
 *   id     — kebab-case English slug. Stable forever once shipped;
 *            this is what gets persisted on the project record.
 *   label  — Hebrew display string. Refinable.
 *
 * Adding a new value is appending to the array. Renaming an `id` is
 * a migration (existing project records reference it).
 *
 * Order in the arrays follows the screenshot's listed order. RTL
 * dropdowns render this list top-to-bottom regardless of writing mode.
 */

export const CAMPAIGN_GOALS = Object.freeze([
  { id: 'leads',           label: 'לידים' },
  { id: 'onsite-sales',    label: 'מכירות באתר' },
  { id: 'brand-awareness', label: 'מודעות למותג' },
  { id: 'engagement',      label: 'מעורבות' },
]);

export const CAMPAIGN_NATURES = Object.freeze([
  { id: 'conversions',  label: 'המרות' },
  { id: 'webinar',      label: 'וובינר' },
  { id: 'free-product', label: 'מוצר חינם' },
  { id: 'other',        label: 'אחר' },
]);

export const CONVERSION_LOCATIONS = Object.freeze([
  { id: 'messages',          label: 'הודעות' },
  { id: 'lead-form',         label: 'טופס לידים' },
  { id: 'website-or-landing',label: 'אתר או דף נחיתה' },
  { id: 'website-traffic',   label: 'תנועה לאתר' },
  { id: 'no-conversion',     label: 'ללא המרה' },
]);

export const TARGET_AUDIENCES = Object.freeze([
  { id: 'researchers', label: 'חוקרים' },
]);

/* Project name limit. The DB column mirrors this; surfacing it here
 * lets both the input's `maxLength` and the counter UI read from a
 * single source. */
export const PROJECT_NAME_MAX = 25;

/* Lookup helpers — used by read views (project card, summary drawer)
 * + by submit-time `draft.context` builders that have a stored `id`
 * and want the display label without importing the arrays. */
const VALUE_LOOKUPS = {
  goal:               Object.fromEntries(CAMPAIGN_GOALS.map((g) => [g.id, g])),
  nature:             Object.fromEntries(CAMPAIGN_NATURES.map((n) => [n.id, n])),
  conversionLocation: Object.fromEntries(CONVERSION_LOCATIONS.map((c) => [c.id, c])),
  audience:           Object.fromEntries(TARGET_AUDIENCES.map((a) => [a.id, a])),
};

export const getCampaignGoalLabel       = (id) => VALUE_LOOKUPS.goal[id]?.label ?? id;
export const getCampaignNatureLabel     = (id) => VALUE_LOOKUPS.nature[id]?.label ?? id;
export const getConversionLocationLabel = (id) => VALUE_LOOKUPS.conversionLocation[id]?.label ?? id;
export const getTargetAudienceLabel     = (id) => VALUE_LOOKUPS.audience[id]?.label ?? id;
