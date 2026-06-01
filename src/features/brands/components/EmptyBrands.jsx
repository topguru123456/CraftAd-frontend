/* Empty state — full-page treatment per QA. Fills the page-content
 * area vertically (min-h-[440px]) and centers both axes, so the toolbar
 * above sits over a substantial placeholder instead of a thin strip.
 * No CTA inside the empty state — the "create new brand" button is
 * already in the toolbar above; a duplicate here would clutter.
 *
 * Two copy modes: empty (no brands at all) vs filtered (search returned
 * nothing). Each gets its own primary line + supporting subtitle.
 */
export function EmptyBrands({ mode = 'empty' }) {
  const isFiltered = mode === 'filtered';

  const title = isFiltered
    ? 'לא נמצאו מותגים התואמים לחיפוש'
    : 'אין מותגים להציג';

  const subtitle = isFiltered
    ? 'נסו מילת חיפוש אחרת'
    : 'התחילו ביצירת המותג הראשון שלכם דרך הכפתור למעלה';

  return (
    <div
      dir="rtl"
      className="rounded-card border border-dashed border-line bg-white flex flex-col items-center justify-center text-center min-h-[440px] px-6 py-16 sm:py-20"
    >
      <p className="text-lg sm:text-xl font-bold text-ink">{title}</p>
      <p className="text-sm sm:text-base text-ink-muted mt-2 max-w-md leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}
