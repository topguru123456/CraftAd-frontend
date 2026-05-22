/* Empty state — same dashed-card pattern as ProjectsPage so the two
 * sibling pages read identically when there's nothing to show. One line
 * of copy, no CTA (the toolbar above already has the create button). */
export function EmptyBrands({ mode = 'empty' }) {
  const isFiltered = mode === 'filtered';
  return (
    <div
      dir="rtl"
      className="rounded-card border border-dashed border-line bg-white p-12 text-center text-ink-muted"
    >
      <p className="text-base">
        {isFiltered ? 'לא נמצאו מותגים התואמים לחיפוש' : 'אין מותגים להציג'}
      </p>
    </div>
  );
}
