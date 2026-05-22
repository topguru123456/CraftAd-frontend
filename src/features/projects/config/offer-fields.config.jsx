/* Frozen taxonomies for the "offer features" step shared by every
 * project-creation wizard whose visible step 2 asks for the same
 * product/service intake (sale type, audience temperature, item name,
 * brand tone, brief). Currently campaign-creative and copywriting-ads.
 *
 * Same conventions as the sibling `project-fields.config.jsx`:
 *   id    — kebab-case English slug; persisted on the project record;
 *           stable forever once shipped.
 *   label — Hebrew display string; refinable.
 *
 * Order in the arrays matches the screenshot's visual order — RTL
 * SegmentedControls render DOM[0] on the right (start) which is the
 * reading order in Hebrew. */

export const SALE_TYPES = Object.freeze([
  { id: 'service', label: 'שירות' },
  { id: 'product', label: 'מוצר' },
]);

export const AUDIENCE_TEMPERATURES = Object.freeze([
  { id: 'hot',  label: 'חם' },
  { id: 'cold', label: 'קר' },
]);

/* Field caps. Single source of truth for both `<input maxLength>` and
 * the visible counter so a paste over the limit is silently truncated
 * AND the counter shows the correct denominator. */
export const ITEM_NAME_MAX = 80;
export const BRIEF_MAX = 5000;
export const URL_MAX = 500;

/* Lookup helpers — used by read views (project card, summary drawer)
 * that have a stored id and want the display label. */
const VALUE_LOOKUPS = {
  saleType:    Object.fromEntries(SALE_TYPES.map((s) => [s.id, s])),
  temperature: Object.fromEntries(AUDIENCE_TEMPERATURES.map((a) => [a.id, a])),
};

export const getSaleTypeLabel            = (id) => VALUE_LOOKUPS.saleType[id]?.label ?? id;
export const getAudienceTemperatureLabel = (id) => VALUE_LOOKUPS.temperature[id]?.label ?? id;
