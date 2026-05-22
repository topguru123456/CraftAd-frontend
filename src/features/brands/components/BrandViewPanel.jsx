import { Edit2 } from 'iconsax-react';
import { cn } from '@lib/cn';
import {
  BRAND_TONES,
  BRAND_VALUES,
  getValueLabel,
  getToneLabel,
} from '../creation/config/character.config';

/* Read-only render of a brand inside the drawer. Two CTAs at the top:
 *   - "set as active" → primary, calls back to BrandDrawer
 *   - "edit"          → outline, switches the drawer into edit mode
 *
 * Sections mirror the edit form so users can scan the same shape in both
 * modes (logo, name, description, colors, tone, values). Tone/values
 * pills reuse the same look as TaxonomySelect's pills so the
 * read-vs-edit transition is visually quiet. */
export function BrandViewPanel({
  brand,
  isActive,
  onSetActive,
  onEdit,
}) {
  return (
    <div className="px-6 sm:px-8 pt-16 pb-8 space-y-6 text-right" dir="rtl">
      <div className = "flex items-start justify-between">
        {/* Logo */}
        <div className="flex flex-col items-start gap-3">
          <div className="h-32 w-32 rounded-2xl bg-white border border-line flex items-center justify-center overflow-hidden">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <span className="text-3xl font-extrabold text-brand-500">
                {brand.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-ink">{brand.name}</h2>
        </div>

        {/* Top action row. DOM [setActive, edit] in RTL → setActive is on
          the right (start), edit on the left (end). */}
        <div className="flex items-center justify-start gap-3">
          <button
            type="button"
            onClick={onSetActive}
            disabled={isActive}
            className={cn(
              'btn-primary inline-flex items-center justify-center px-5 py-2.5 text-md',
              isActive && 'opacity-60 cursor-default'
            )}
          >
            {isActive ? 'המותג הפעיל' : 'בחר כמותג הפעיל'}
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="btn-outline inline-flex items-center gap-2 px-4 py-2.5 text-md"
          >
            <span>ערוך</span>
            <Edit2 size="16" variant="Linear" color="currentColor" />
          </button>
        </div>

        
      </div>

      {/* Description */}
      <Section label="פרטים על המותג">
        <p className="text-md text-ink leading-relaxed whitespace-pre-wrap">
          {brand.description || (
            <span className="text-ink-soft">אין תיאור</span>
          )}
        </p>
      </Section>

      {/* Colors */}
      <Section label="צבעי המותג">
        {brand.colors?.length ? (
          <ul className="flex flex-wrap gap-2">
            {brand.colors.map((c) => (
              <li
                key={c.id ?? c.hex}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1.5"
              >
                
                <span className="font-mono text-sm lowercase text-ink-muted">
                   {(c.hex ?? '').replace(/^#/, '')}#
                </span>
                <span
                  className="h-8 w-8 rounded border border-line"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden="true"
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">לא הוגדרו צבעים</p>
        )}
      </Section>

      {/* Tone */}
      <Section label="טון המותג">
        {brand.tone ? (
          <span className="inline-flex items-center rounded-md px-3 py-1 border border-gray-200 text-[18px] text-ink">
            {getToneLabel(brand.tone)}
          </span>
        ) : (
          <p className="text-sm text-ink-soft">לא נבחר טון</p>
        )}
      </Section>

      {/* Values */}
      <Section label="ערכי המותג">
        {brand.values?.length ? (
          <ul className="flex flex-wrap gap-2">
            {brand.values.map((id) => (
              <li
                key={id}
                className="inline-flex items-center rounded-md px-3 py-1 border border-gray-200 text-[18px] text-ink"
              >
                {getValueLabel(id)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">לא נבחרו ערכים</p>
        )}
      </Section>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[16px] font-bold text-ink-muted">{label}</h3>
      {children}
    </div>
  );
}

/* Re-exported so consumers don't need a deep import path for the few
 * cases (debugging, brand-card hover preview) that want raw taxonomy. */
export { BRAND_TONES, BRAND_VALUES };
