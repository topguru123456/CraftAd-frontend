/* Character step taxonomy.
 *
 * Frozen in code rather than fetched from the backend because:
 *   - The list is a fixed product taxonomy, not user data — it doesn't
 *     vary per-user, per-brand, or per-locale.
 *   - Every brand record will reference these `id`s, so the ids ARE the
 *     contract between the UI, persistence, and downstream features
 *     (creative-score, copy generation, etc.). Rotating ids without a
 *     migration would orphan saved data.
 *   - Server round-trip on every wizard load would buy nothing.
 *
 * If the taxonomy ever needs to be admin-editable, that's a future
 * migration to a `character_taxonomy` table — but the shape stays the
 * same.
 *
 * Conventions:
 *   - id     — kebab-case English slug, stable forever once shipped.
 *   - label  — Hebrew display string. Safe to refine.
 *   - Keep `BRAND_VALUES` ordered visually (the way they read on the
 *     screen). Keep `BRAND_TONES` short — the user picks exactly one.
 */

export const BRAND_VALUES = Object.freeze([
  { id: 'minimal',       label: 'מינימליסטי' },
  { id: 'optimistic',    label: 'אופטימי' },
  { id: 'reliable',      label: 'אמין' },
  { id: 'personal',      label: 'אישי' },
  { id: 'elegant',       label: 'אלגנטי' },
  { id: 'efficient',     label: 'יעיל' },
  { id: 'prestigious',   label: 'יוקרתי' },
  { id: 'innovative',    label: 'חדשני' },
  { id: 'friendly',      label: 'חברותי' },
  { id: 'technological', label: 'טכנולוגי' },
  { id: 'bold',          label: 'נועז' },
  { id: 'accessible',    label: 'נגיש' },
  { id: 'in-depth',      label: 'מעומק' },
  { id: 'fast',          label: 'מהיר' },
  { id: 'precise',       label: 'מדויק' },
  { id: 'powerful',      label: 'עוצמתי' },
  { id: 'competitive',   label: 'תחרותי' },
  { id: 'serious',       label: 'רציני' },
  { id: 'attentive',     label: 'קשוב' },
  { id: 'youthful',      label: 'צעיר' },
  { id: 'humorous',      label: 'עם הומור' },
  { id: 'calming',       label: 'מרגיע' },
  { id: 'professional',  label: 'מקצועי' },
  { id: 'quality',       label: 'איכותי' },
]);

export const BRAND_TONES = Object.freeze([
  { id: 'witty',          label: 'שנון' },
  { id: 'funny',          label: 'מצחיק' },
  { id: 'authoritative',  label: 'סמכותי' },
  { id: 'verbose',        label: 'וורבלי' },
  { id: 'high-language',  label: 'שפה גבוהה' },
  { id: 'concise',        label: 'קצר ולעניין' },
  { id: 'educational',    label: 'מלמד' },
  { id: 'creative',       label: 'יצירתי' },
  { id: 'unique',         label: 'יוצא דופן' },
]);

/* Required minimum on the values multi-select (per design copy). The
 * step's submit button is disabled until this is met. */
export const MIN_BRAND_VALUES = 3;

/* Lookup helpers — keep the rest of the codebase (e.g. brand summary
 * cards) from importing the arrays directly when all they need is the
 * label for an id. */
const VALUES_BY_ID = Object.freeze(
  Object.fromEntries(BRAND_VALUES.map((v) => [v.id, v]))
);
const TONES_BY_ID = Object.freeze(
  Object.fromEntries(BRAND_TONES.map((t) => [t.id, t]))
);

export const getValueLabel = (id) => VALUES_BY_ID[id]?.label ?? id;
export const getToneLabel  = (id) => TONES_BY_ID[id]?.label  ?? id;
