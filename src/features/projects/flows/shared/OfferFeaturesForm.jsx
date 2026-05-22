import { useEffect } from 'react';
import { Dropdown, SegmentedControl } from '@components/ui';
import { cn } from '@lib/cn';
import { BRAND_TONES } from '@features/brands';
import { useActiveBrand } from '@/contexts/BrandsContext';
import {
  AUDIENCE_TEMPERATURES,
  BRIEF_MAX,
  ITEM_NAME_MAX,
  SALE_TYPES,
  URL_MAX,
} from '@features/projects/config/offer-fields.config';

/* "Offer features" field block — shared by every project-creation
 * wizard whose visible step 2 asks for the same product/service intake
 * (sale type, audience temperature, item name, brand tone, brief, and
 * an optional landing-page URL). Currently campaign-creative and
 * copywriting-ads.
 *
 * Pure presentational — reads `draft`, calls `updateDraft`. The owning
 * step renders this inside ProjectWizardShell with the appropriate
 * stepper + actions.
 *
 * Customization knobs:
 *   briefLabel          — copy override for the textarea label; flows
 *                         that talk about "copy" instead of "campaign
 *                         brief" pass a different string.
 *   showLandingPageUrl  — toggles the URL row; copywriting hides it
 *                         because the wire it produces doesn't take a
 *                         landing-page input.
 *
 * Tone seeding:
 *   The dropdown's *initial* value comes from the active brand's tone
 *   the first time we mount with no tone selected. After that the
 *   field is user-owned — flipping back through wizard steps won't
 *   reset a deliberate change. The effect lives here (not in each
 *   step) so every flow gets the same behavior for free.
 *
 * Layout:
 *   Row 1 (4 small fields, lg=4-col, md=2-col, mobile=1-col):
 *     מה מוכרים | סוג הקהל | שם המוצר/השירות | טון המותג
 *   Row 2 (own row): brief textarea, full width.
 *   Row 3 (own row, optional): landing-page URL input, full width.
 *
 * Why brief and URL aren't side-by-side:
 *   The textarea wants vertical room (rows=6) and the URL is a single
 *   line. Pairing them left a tall textarea next to a stubby input
 *   with awkward dead space below the URL. Stacking gives both the
 *   full content width and keeps the visual rhythm of "one thoughtful
 *   field per row" once we leave the small-fields strip.
 *
 * Validation lives in the owning step — every field except
 * `landingPageUrl` is required wherever the brief textarea is shown. */
const DEFAULT_BRIEF_LABEL = 'בריף קמפיין והסבר על המוצר/שירות';

export function OfferFeaturesForm({
  draft,
  updateDraft,
  briefLabel = DEFAULT_BRIEF_LABEL,
  showLandingPageUrl = true,
}) {
  const { activeBrand } = useActiveBrand();

  useEffect(() => {
    if (!draft.offerToneId && activeBrand?.tone) {
      updateDraft({ offerToneId: activeBrand.tone });
    }
  }, [draft.offerToneId, activeBrand?.tone, updateDraft]);

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* Row 1: 4 small fields. md = 2 cols, lg = 4 cols. */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-5">
        <Field label="מה מוכרים">
          <SegmentedControl
            options={SALE_TYPES}
            value={draft.saleType}
            onChange={(id) => updateDraft({ saleType: id })}
            ariaLabel="מה מוכרים"
          />
        </Field>

        <Field label="סוג הקהל">
          <SegmentedControl
            options={AUDIENCE_TEMPERATURES}
            value={draft.audienceType}
            onChange={(id) => updateDraft({ audienceType: id })}
            ariaLabel="סוג הקהל"
          />
        </Field>

        <Field label="שם המוצר או השירות">
          <input
            type="text"
            value={draft.itemName}
            onChange={(e) => updateDraft({ itemName: e.target.value })}
            maxLength={ITEM_NAME_MAX}
            placeholder="כתבו פה את שם המוצר או השירות"
            dir="rtl"
            className={cn(
              'w-full rounded-xl border border-line bg-white',
              'px-4 py-2.5 text-md text-ink placeholder:text-ink-soft text-right',
              'focus:border-brand-300 focus:outline-none focus:shadow-focus'
            )}
          />
        </Field>

        <Field label="טון המותג">
          <Dropdown
            options={BRAND_TONES}
            value={draft.offerToneId}
            onChange={(id) => updateDraft({ offerToneId: id })}
            placeholder="בחרו טון"
            ariaLabel="טון המותג"
          />
        </Field>
      </div>

      {/* Row 2: brief textarea, full width. */}
      <Field label={briefLabel} value={draft.brief} max={BRIEF_MAX}>
        <textarea
          value={draft.brief}
          onChange={(e) => updateDraft({ brief: e.target.value })}
          maxLength={BRIEF_MAX}
          rows={6}
          dir="rtl"
          placeholder="פרטו על השירותים והמוצרים של העסק (לדוגמה: קראפטאד היא חברה של בינה מלאכותית המייצרת תוכן לרשתות בצורה חכמה, אפשר לייצר בה...)"
          className={cn(
            'w-full rounded-xl border border-line bg-white',
            'px-4 py-3 text-md text-ink placeholder:text-ink-soft text-right',
            'focus:border-brand-300 focus:outline-none focus:shadow-focus',
            'resize-y min-h-[160px]'
          )}
        />
      </Field>

      {/* Row 3: landing-page URL, full width. dir="ltr" so the URL
       * reads naturally — the label stays RTL because Hebrew copy. */}
      {showLandingPageUrl && (
        <Field label="קישור לדף נחיתה של המוצר/שירות (לא חובה)">
          <input
            type="url"
            value={draft.landingPageUrl ?? ''}
            onChange={(e) => updateDraft({ landingPageUrl: e.target.value })}
            maxLength={URL_MAX}
            placeholder="הדביקו כאן..."
            dir="ltr"
            className={cn(
              'w-full rounded-xl border border-line bg-white',
              'px-4 py-2.5 text-md text-ink placeholder:text-ink-soft text-left',
              'focus:border-brand-300 focus:outline-none focus:shadow-focus'
            )}
          />
        </Field>
      )}
    </div>
  );
}

/* Local Field wrapper — same visual treatment as ProjectWizardField,
 * but with the counter rendered UNDERNEATH (`length / max`) instead of
 * an overlay badge. The two flavors live side-by-side because the
 * settings-form mock uses the overlay style and the offer-form mock
 * uses the underneath counter; merging them into one switchable field
 * isn't worth the prop noise for a 25-line component. `dir="ltr"` on
 * the counter span keeps "0 / 5000" reading correctly inside an RTL
 * paragraph (BiDi otherwise position-reverses the two number runs). */
function Field({ label, value, max, className, children }) {
  const showCounter = typeof max === 'number' && typeof value === 'string';
  const length = value?.length ?? 0;
  return (
    <div className={cn('space-y-2', className)}>
      <label className="block text-[16px] font-bold text-ink-muted">
        {label}
      </label>
      {children}
      {showCounter && (
        <div className="flex justify-end">
          <span
            dir="ltr"
            className={cn(
              'text-xs',
              length >= max ? 'text-danger font-bold' : 'text-ink-soft'
            )}
          >
            {length} / {max}
          </span>
        </div>
      )}
    </div>
  );
}
