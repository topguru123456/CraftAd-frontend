import { useEffect, useRef, useState } from 'react';
import { InfoCircle } from 'iconsax-react';
import PaintBucket from '@assets/icons/paint-bucket.svg?react';
import { cn } from '@lib/cn';
import { BrandsHeader } from '../../components/BrandsHeader';
import { brandsApi } from '../../api/brands.api';
import { useBrandCreation, STEP_IDS } from '../context/BrandCreationContext';
import { WizardStepper } from '../components/WizardStepper';
import { WizardActions } from '../components/WizardActions';

/* Step 2 — visuals (logo + brand colors).
 *
 * Auto path: arrives with `draft.logoUrl` (best logo from context.dev) and
 * `draft.colors` (extracted palette) already populated.
 * Manual path: arrives empty — user uploads a logo from disk and adds
 * colors one by one.
 *
 * Logo:
 *   - Uploads go through Supabase Storage (`brand-assets` bucket, per-
 *     user folder enforced by RLS — see migration 20260507130000…). The
 *     public URL is what gets persisted to the brand record.
 *   - Auto-fetched logos keep their context.dev URL as-is for now.
 *     Re-uploading them to our storage is a future improvement that
 *     needs to happen server-side (CORS prevents a browser-side fetch
 *     of media.brand.dev blobs).
 *
 * Colors:
 *   - Each entry has a stable `id`. Without it, keying the swatch by
 *     `hex` would re-mount the component every time the user edits the
 *     hex, blowing away input focus mid-typing.
 *   - The hex is editable inline. Local draft state lets the user type
 *     freely; the swatch preview updates live for valid 6-char hex,
 *     keeps the previous color for invalid input. Commit on blur / Enter.
 *
 * Validation: a logo is required to proceed. Forward gates on
 * `draft.logoUrl`. Colors are optional.
 */
const ACCEPTED_LOGO_TYPES = 'image/png,image/jpeg,image/webp,image/svg+xml';

export function VisualsStep() {
  const { draft, updateDraft, next, cancel } = useBrandCreation();

  const logoUrl = draft.logoUrl;
  const colors = draft.colors ?? [];
  /* Both required to advance — same rule the edit drawer enforces.
   * Forward gates on a logo AND at least one color. */
  const canContinue = Boolean(logoUrl) && colors.length > 0;

  const removeLogo = () => updateDraft({ logoUrl: null });
  const setLogo = (url) => updateDraft({ logoUrl: url });

  const addColor = ({ hex, name = '' }) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    /* Dedupe by hex so the same color can't appear twice. */
    if (colors.some((c) => c.hex.toLowerCase() === normalized)) return;
    updateDraft({
      colors: [...colors, { id: makeColorId(), hex: normalized, name }],
    });
  };

  const removeColor = (id) => {
    updateDraft({ colors: colors.filter((c) => c.id !== id) });
  };

  const updateColor = (id, nextHex) => {
    const normalized = normalizeHex(nextHex);
    if (!normalized) return;
    /* Block edits that would create a duplicate (matching another
     * swatch's hex). The swatch component reverts visually since the
     * draft never changes. */
    if (colors.some((c) => c.id !== id && c.hex.toLowerCase() === normalized)) return;
    updateDraft({
      colors: colors.map((c) => (c.id === id ? { ...c, hex: normalized } : c)),
    });
  };

  return (
    <div dir="rtl" className="space-y-6 sm:space-y-8">
      <BrandsHeader
        title="הקימו מותג חדש"
        subtitle="בחרו אם להקים את המותג אוטומטית באמצעות צירוף קישור לאתר המותג או ידנית בכמה שלבים מהירים"
        onBack={cancel}
      />

      <section className="bg-white border border-line rounded-3xl shadow-soft p-5 sm:p-7 lg:p-8 space-y-6 sm:space-y-8">
        <div className="flex justify-center">
          <WizardStepper currentStepId={STEP_IDS.visuals} />
        </div>

        <div className="grid gap-8 lg:gap-10">
          <LogoSection logoUrl={logoUrl} onSelect={setLogo} onRemove={removeLogo} />
          <ColorsSection
            colors={colors}
            onAdd={addColor}
            onRemove={removeColor}
            onUpdate={updateColor}
          />
        </div>

        <WizardActions
          onBack={cancel}
          onNext={next}
          canContinue={canContinue}
        />
      </section>
    </div>
  );
}

/* -------------------- Logo -------------------- */

function LogoSection({ logoUrl, onSelect, onRemove }) {
  const [error, setError] = useState(null);

  return (
    <div className="space-y-2 w-fit mx-auto sm:mx-0 sm:float-right">
      <label className="block text-sm font-bold text-ink-muted text-center sm:text-start">
        לוגו (נדרש)
      </label>

      {logoUrl ? (
        <LogoPreview url={logoUrl} onRemove={onRemove} />
      ) : (
        <LogoUploader
          onSelect={(url) => {
            setError(null);
            onSelect(url);
          }}
          onError={setError}
        />
      )}

      {error && (
        <p className="text-xs sm:text-sm text-danger text-center sm:text-start" role="alert">
          {error}
        </p>
      )}
      <p className="text-xs sm:text-sm text-ink-muted text-center sm:text-start">
        העלו לוגו באיכות גבוהה, ללא רקע מאחוריו.
      </p>
    </div>
  );
}

function LogoPreview({ url, onRemove }) {
  return (
    <div className="relative bg-white border-2 border-dashed border-line rounded-2xl py-0 px-12 sm:px-16 flex items-center justify-center min-h-[180px]">
      <button
        type="button"
        onClick={onRemove}
        aria-label="הסרת הלוגו"
        className={cn(
          'absolute top-3 start-3 inline-flex h-8 w-8 items-center justify-center',
          'rounded-full text-danger hover:bg-rose-50 transition-colors'
        )}
      >
        <CrossIcon className="h-4 w-4" />
      </button>
      {/* No `crossOrigin` here on purpose — browsers happily render
          cross-origin images via <img src>. CORS is only needed when
          we read pixels (canvas/WebGL), which we don't. */}
      <img
        src={url}
        alt="לוגו המותג"
        className="max-h-[180px] max-w-full object-contain"
      />
    </div>
  );
}

function LogoUploader({ onSelect, onError }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  /* Real upload: pushes the file to Supabase Storage's brand-assets
   * bucket and uses the returned public URL. The bucket's RLS
   * (migration 20260507130000…) enforces that the first path segment
   * matches auth.uid(), so this can't write into another user's folder. */
  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploading(true);
    const { data, error } = await brandsApi.uploadLogo(file);
    setIsUploading(false);

    if (error) {
      onError?.(error.message ?? 'העלאת הלוגו נכשלה — נסו שוב');
      return;
    }
    onSelect(data.url);
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={isUploading}
      className={cn(
        'w-full rounded-2xl border-2 border-dashed border-brand-200 bg-white',
        'p-8 sm:p-10 flex flex-col items-center justify-center gap-2',
        'min-h-[180px] text-center cursor-pointer',
        'hover:border-brand-300 hover:bg-brand-50/30 transition-colors',
        isUploading && 'cursor-wait opacity-80'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_LOGO_TYPES}
        onChange={handleChange}
        className="hidden"
      />
      {isUploading ? (
        <>
          <span
            aria-hidden="true"
            className="h-8 w-8 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin"
          />
          <span className="text-sm font-bold text-ink-muted">מעלה…</span>
        </>
      ) : (
        <>
          <span className="text-base font-bold text-ink">העלו לוגו</span>
          <span className="text-xs text-ink-soft">PNG, JPG, WEBP, SVG</span>
        </>
      )}
    </button>
  );
}

/* -------------------- Colors -------------------- */

function ColorsSection({ colors, onAdd, onRemove, onUpdate }) {
  /* Last color can't be deleted — brand needs at least one. Hidden
   * rather than disabled so the lone swatch stays visually clean. */
  const canRemove = colors.length > 1;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 justify-center sm:justify-start">
        <label className="text-sm font-bold text-ink-muted">צבעי המותג</label>
        <InfoCircle size="16" variant="Linear" color="#8A98A6" />
      </div>

      {colors.length > 0 && (
        <p className="text-xs text-ink-soft text-center sm:text-start">צבע ראשי</p>
      )}

      <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
        {colors.map((color) => (
          <ColorSwatch
            key={color.id}
            color={color}
            canRemove={canRemove}
            onRemove={() => onRemove(color.id)}
            onUpdate={(hex) => onUpdate(color.id, hex)}
          />
        ))}
        <AddColorButton onAdd={onAdd} />
      </div>
    </div>
  );
}

function ColorSwatch({ color, canRemove, onRemove, onUpdate }) {
  /* Local draft so the user can type freely. We commit on blur / Enter
   * via `commit()`. Keeping a separate `inputValue` lets us show the
   * user's in-progress text even when it's invalid hex (the swatch
   * preview falls back to the last committed value in that case). */
  const [inputValue, setInputValue] = useState(stripHex(color.hex));

  /* Sync the input when the parent updates the color externally
   * (e.g. dedupe revert, undo). Compares stripped values so we don't
   * fight the user's keystrokes. */
  useEffect(() => {
    setInputValue(stripHex(color.hex));
  }, [color.hex]);

  const commit = () => {
    const normalized = normalizeHex(`#${inputValue}`);
    if (normalized && normalized !== color.hex.toLowerCase()) {
      onUpdate(normalized);
    } else {
      /* Invalid or unchanged — revert visual to committed value. */
      setInputValue(stripHex(color.hex));
    }
  };

  /* Live preview: show typed value if it parses, otherwise the
   * committed value. Avoids the swatch flashing transparent while the
   * user is mid-keystroke. */
  const livePreview = normalizeHex(`#${inputValue}`) ?? color.hex;

  return (
    <div className="relative border border-dotted border-line p-1.5 rounded-md">
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`הסרת הצבע ${color.hex}`}
          className={cn(
            'absolute -top-2 -start-2 z-10 inline-flex h-5 w-5 items-center justify-center',
            'rounded-full bg-rose-100 text-danger shadow-sm',
            'hover:bg-rose-200 transition-colors'
          )}
        >
          <CrossIcon className="h-2.5 w-2.5" />
        </button>
      )}
      <div
        className="h-[72px] w-[100px] rounded-xl border border-line"
        style={{ backgroundColor: livePreview }}
        aria-hidden="true"
      />
      <div className="mt-1.5 flex items-center justify-center gap-1 text-xs text-ink-muted">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
          maxLength={6}
          spellCheck={false}
          aria-label="ערך הצבע"
          className={cn(
            'w-[60px] bg-transparent text-center font-mono text-xs lowercase',
            'rounded outline-none focus:bg-white focus:ring-1 focus:ring-brand-300'
          )}
        />
        <span aria-hidden="true">#</span>
      </div>
    </div>
  );
}

/* Native color picker, wrapped as a button-shaped <label>.
 *
 * Two subtle things matter here:
 *
 * 1. React's `onChange` for `<input type="color">` is mapped to the
 *    `input` event, which fires CONTINUOUSLY while the user drags
 *    through the picker — using it would add a new color on every
 *    pixel of cursor movement. We listen to the native `change` event
 *    instead, which fires exactly once when the user commits a color.
 *
 * 2. The input must visually overlay the visible button (not be
 *    `display: none`) so the OS picker pops up on top of the trigger
 *    instead of at the document origin. We use `<label>` so a click
 *    anywhere on the tile activates the input natively — no
 *    `inputRef.click()` shim, no risk of missing the picker.
 *
 * Resetting `input.value` after each pick lets the user re-pick the
 * same color (otherwise the second selection wouldn't fire `change`
 * because the value didn't change). */
function AddColorButton({ onAdd }) {
  const inputRef = useRef(null);
  /* Stash the latest onAdd so the imperative listener doesn't need to
   * be torn down + re-attached on every parent re-render. */
  const onAddRef = useRef(onAdd);
  useEffect(() => { onAddRef.current = onAdd; }, [onAdd]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const handleNativeChange = () => {
      const hex = input.value;
      if (hex) onAddRef.current?.({ hex, name: '' });
      input.value = '';
    };
    input.addEventListener('change', handleNativeChange);
    return () => input.removeEventListener('change', handleNativeChange);
  }, []);

  return (
    <div className="relative border border-dotted border-line p-1.5 rounded-md hover:border-brand-300 transition-colors">
      <label
        className={cn(
          'relative h-[94px] w-[100px] rounded-xl',
          'flex flex-col items-center justify-center gap-1',
          'cursor-pointer'
        )}
      >
        {/* Paint-bucket asset ships with a pink gradient — render as-is. */}
        <PaintBucket className="h-6 w-6" />
        <span className="text-xs font-bold text-ink-muted">צבע נוסף</span>
        <input
          ref={inputRef}
          type="color"
          aria-label="הוספת צבע"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
        />
      </label>
    </div>
  );
}

/* -------------------- helpers -------------------- */

/* Returns a normalized `#xxxxxx` (lowercase, 6 chars + leading `#`) or
 * `null` if the input doesn't parse. Accepts:
 *   #abcdef  → #abcdef
 *   abcdef   → #abcdef
 *   #abc     → #aabbcc (3-digit shorthand expanded)
 *   foo      → null
 */
function normalizeHex(input) {
  if (typeof input !== 'string') return null;
  const stripped = input.trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{6}$/.test(stripped)) return `#${stripped}`;
  if (/^[0-9a-f]{3}$/.test(stripped)) {
    return `#${stripped.split('').map((c) => c + c).join('')}`;
  }
  return null;
}

function stripHex(hex) {
  return (hex ?? '').replace(/^#/, '').toLowerCase();
}

function makeColorId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function CrossIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
