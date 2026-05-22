/* DD/MM/YY formatter — matches the date format shown in the brands grid.
 * Pulled out so any future card/list view stays consistent. */
export function formatBrandDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = d.getDate();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}
