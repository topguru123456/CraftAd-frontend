import { Link } from 'react-router-dom';
import { ROUTES } from '@config/routes';

/* Shown on every brand-scoped page (projects, avatars, creative-score,
 * inspired-creation) when there's no active brand. Rather than letting
 * each page render its own variation, we route them through this shared
 * component so the copy + CTA stay consistent.
 *
 * Acts as a soft gate: the routes themselves remain navigable (so
 * deep-linking + bookmarks still work) but the page content is replaced
 * by this until a brand is picked. The sidebar separately disables
 * brand-scoped rows so casual nav doesn't land here.
 *
 * `subject` lets the heading personalize per-page ("פרויקטים", etc).
 */
export function NoActiveBrandState({ subject }) {
  return (
    <div
      dir="rtl"
      className="rounded-card border border-dashed border-line bg-white p-10 sm:p-12 text-center text-ink-muted"
    >
      <h2 className="text-lg sm:text-xl font-extrabold text-ink mb-2">
        בחרו מותג כדי להמשיך
      </h2>
      <p className="text-sm sm:text-base mb-6">
        {subject ? `${subject} משוייכים למותג. ` : ''}
        צרו מותג חדש או בחרו מתוך המותגים הקיימים שלכם.
      </p>
      <Link
        to={ROUTES.app.brands}
        className="btn-primary inline-flex items-center gap-2 px-5 py-3 text-md"
      >
        ניהול מותגים
      </Link>
    </div>
  );
}
