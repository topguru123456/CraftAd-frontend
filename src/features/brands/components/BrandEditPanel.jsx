import { useEffect, useRef, useState } from 'react';
import { Edit2 } from 'iconsax-react';
import PaintBucket from '@assets/icons/paint-bucket.svg?react';
import { cn } from '@lib/cn';
import { useBrandEditor } from '../hooks/useBrandEditor';
import {
  BRAND_TONES,
  BRAND_VALUES,
} from '../creation/config/character.config';
import { TaxonomySelect } from './TaxonomySelect';

/* Editable form view of a brand inside the drawer.
 *
 * The component is a thin renderer over `useBrandEditor` — that hook
 * owns the draft, the pending-uploads tracking, and the save/cancel
 * cleanup. This file is just inputs wired to setters.
 *
 * Logo flow:
 *   - Tile is a click target. While idle: shows the current logo + a
 *     "click to edit" prompt overlay.
 *   - On file pick: hook uploads to storage, swaps the URL in the
 *     draft, and remembers the old URL for cleanup on save.
 *
 * Save:
 *   - Disabled while name is empty or a save is in flight.
 *   - On success the parent (BrandDrawer) closes the drawer and the
 *     brands list refreshes via BrandsContext.refresh.
 *
 * Save / cancel cleanup of pending storage uploads happens inside the
 * hook — neither this component nor BrandDrawer need to think about it. */
const ACCEPTED_LOGO_TYPES = 'image/png,image/jpeg,image/webp,image/svg+xml';

export function BrandEditPanel({ brand, onSaved, onCancel: onCancelProp }) {
  const editor = useBrandEditor(brand);
  const [logoError, setLogoError] = useState(null);

  /* Expose `cancel` to the parent through a ref-like callback. The
   * parent calls editor.cancel() when the user closes the drawer
   * mid-edit so storage doesn't leak. */
  useEffect(() => {
    if (typeof onCancelProp === 'function') {
      onCancelProp.current = editor.cancel;
    }
    /* No need to clean up — parent's ref.current is overwritten next
     * mount, and the function-form callback is only used during open. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor.cancel]);

  const handleSave = async () => {
    setLogoError(null);
    const result = await editor.save();
    /* Always notify the parent so it can pick the right toast (success
     * vs error). The drawer also closes itself on success — leaving
     * those choices outside this panel keeps the UX consistent across
     * brand mutations. */
    onSaved?.(result);
  };

  /* Save is allowed when the user has actually changed something AND
   * the brand still meets its required fields (name, logo, ≥ 1 color).
   * The hook re-asserts these, but disabling at the button stops the
   * user from clicking into a known failure. */
  const canSave =
    editor.isDirty &&
    !editor.isSaving &&
    Boolean(editor.draft.name?.trim()) &&
    Boolean(editor.draft.logoUrl) &&
    Array.isArray(editor.draft.colors) && editor.draft.colors.length > 0;

  return (
    <div className="px-6 sm:px-8 pt-16 pb-8 space-y-6 text-right" dir="rtl">
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            'btn-primary inline-flex items-center justify-center px-5 py-2.5 text-md',
            !canSave && !editor.isSaving && 'opacity-60 cursor-not-allowed'
          )}
        >
          {editor.isSaving ? (
            <span
              aria-hidden="true"
              className="h-5 w-5 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
            />
          ) : (
            'שמירת השינויים'
          )}
        </button>
      </div>

      {editor.error && (
        <p className="text-md text-danger" role="alert">
          {editor.error.message}
        </p>
      )}

      <LogoEditor
        url={editor.draft.logoUrl}
        onUpload={async (file) => {
          setLogoError(null);
          const { error } = await editor.uploadLogo(file);
          if (error) setLogoError(error.message ?? 'העלאת הלוגו נכשלה');
        }}
        onClear={editor.removeLogo}
        error={logoError}
      />

      <Field label={null} value={editor.draft.name} max={40}>
        <TextInput
          value={editor.draft.name}
          onChange={editor.setName}
          ariaLabel="שם המותג"
          maxLength={40}
        />
      </Field>

      <Field
        label="פרטים על המותג"
        value={editor.draft.description}
        max={5000}
      >
        <textarea
          value={editor.draft.description}
          onChange={(e) => editor.setDescription(e.target.value)}
          maxLength={5000}
          rows={6}
          dir="rtl"
          className={cn(
            'w-full rounded-xl border border-line bg-white',
            'px-4 py-3 text-md text-ink placeholder:text-ink-soft text-right',
            'focus:border-brand-300 focus:outline-none focus:shadow-focus',
            'resize-y min-h-[140px]'
          )}
        />
      </Field>

      <Field label="צבעי המותג">
        <ColorEditor
          colors={editor.draft.colors}
          onAdd={editor.addColor}
          onUpdate={editor.updateColor}
          onRemove={editor.removeColor}
        />
      </Field>

      <Field label="טון המותג">
        <TaxonomySelect
          mode="single"
          options={BRAND_TONES}
          value={editor.draft.tone}
          onChange={editor.setTone}
          placeholder="בחר טון מותג"
          ariaLabel="טון המותג"
        />
      </Field>

      <Field label="ערכי המותג">
        <TaxonomySelect
          mode="multi"
          options={BRAND_VALUES}
          value={editor.draft.values}
          onChange={editor.setValues}
          placeholder="בחר ערכי מותג"
          ariaLabel="ערכי המותג"
        />
      </Field>
    </div>
  );
}

/* ----------------------------- Logo ----------------------------- */

function LogoEditor({ url, onUpload, onClear, error }) {
  const inputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const pick = () => inputRef.current?.click();

  const handleChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setIsUploading(true);
    await onUpload(file);
    setIsUploading(false);
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={pick}
        disabled={isUploading}
        className={cn(
          'w-full rounded-2xl border-2 border-dashed border-brand-200 bg-white',
          'p-5 sm:p-6 flex items-center justify-between gap-4',
          'min-h-[140px] text-right hover:border-brand-300 transition-colors',
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

        {/* Right (RTL start): copy + edit affordance.
            Left  (RTL end):   logo preview / placeholder. */}
        <div className="flex-1 min-w-0">
          {isUploading ? (
            <div className="flex items-center gap-2 text-ink-muted">
              <span className="h-5 w-5 rounded-full border-[3px] border-brand-100 border-t-brand-500 animate-spin" />
              <span className="text-md font-bold">מעלה…</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-ink">
                <Edit2 size="18" variant="Linear" color="currentColor" />
                <span className="text-md font-bold">לחץ כאן כדי לערוך את הלוגו</span>
              </div>
              <p className="text-sm text-ink-soft">סוגי קבצים נתמכים: PNG, JPG, WEBP</p>
            </div>
          )}
        </div>

        <div className="h-20 w-20 rounded-xl bg-white border border-line flex items-center justify-center overflow-hidden shrink-0">
          {url ? (
            <img src={url} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-xs text-ink-soft">אין לוגו</span>
          )}
        </div>
      </button>

      {url && (
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-danger hover:underline"
        >
          הסרת הלוגו
        </button>
      )}

      {error && (
        <p className="text-md text-danger" role="alert">{error}</p>
      )}
    </div>
  );
}

/* --------------------------- Colors editor --------------------------- */

function ColorEditor({ colors, onAdd, onUpdate, onRemove }) {
  /* The last remaining color isn't deletable — a brand record needs at
   * least one color. The X is hidden (not just disabled) on the lone
   * swatch; users can still edit the hex. Hiding rather than disabling
   * keeps the row visually clean once you've narrowed down to your
   * primary color. */
  const canRemove = colors.length > 1;
  return (
    <div className="flex flex-wrap gap-2.5">
      {colors.map((c) => (
        <Swatch
          key={c.id}
          color={c}
          canRemove={canRemove}
          onRemove={() => onRemove(c.id)}
          onUpdate={(hex) => onUpdate(c.id, hex)}
        />
      ))}
      <AddColorButton onAdd={onAdd} />
    </div>
  );
}

function Swatch({ color, canRemove, onRemove, onUpdate }) {
  const [inputValue, setInputValue] = useState(stripHex(color.hex));

  /* Re-sync if the parent updates the color externally (dedupe revert,
   * undo, etc.). Compares stripped values so we don't fight typing. */
  useEffect(() => {
    setInputValue(stripHex(color.hex));
  }, [color.hex]);

  const commit = () => {
    const normalized = normalizeHex(`#${inputValue}`);
    if (normalized && normalized !== color.hex.toLowerCase()) {
      onUpdate(normalized);
    } else {
      setInputValue(stripHex(color.hex));
    }
  };

  const livePreview = normalizeHex(`#${inputValue}`) ?? color.hex;

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1.5">
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`הסרת הצבע ${color.hex}`}
          className="inline-flex h-5 w-5 items-center justify-center rounded text-ink-soft hover:text-danger transition-colors"
        >
          <Trash />
        </button>
      )}
      {/* Swatch preview matches the view panel's 8x8 box so users see
          the same proportions in both modes. */}
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
          'w-[68px] bg-transparent text-right font-mono text-sm lowercase',
          'rounded outline-none focus:bg-surface-muted/40 focus:ring-1 focus:ring-brand-300'
        )}
      />
      <span className="text-sm text-ink-muted font-mono">#</span>
      <span
        className="h-8 w-8 rounded border border-line"
        style={{ backgroundColor: livePreview }}
        aria-hidden="true"
      />
    </div>
  );
}

/* Native color picker reused from VisualsStep. Same `change`-event
 * pattern (avoids React's continuous `onChange` firing while the user
 * drags through the picker). Different visual — here it's a compact
 * card matching the swatch row height. */
function AddColorButton({ onAdd }) {
  const inputRef = useRef(null);
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
    <label className="relative inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 cursor-pointer hover:border-brand-300 transition-colors">
      <PaintBucket className="h-5 w-5" />
      <span className="text-sm font-bold text-ink-muted">הוספה</span>
      <input
        ref={inputRef}
        type="color"
        aria-label="הוספת צבע"
        tabIndex={-1}
        className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
      />
    </label>
  );
}

/* ------------------------------ helpers ------------------------------ */

/* Field wrapper. Optional `value` + `max` enable a character counter
 * underneath the input (used for name + description). When either is
 * undefined the counter doesn't render — keeps Field usable for
 * dropdowns / color pickers that have no character cap. */
function Field({ label, value, max, children }) {
  const showCounter = typeof max === 'number' && typeof value === 'string';
  const length = value?.length ?? 0;
  return (
    <div className="space-y-2">
      {label && <label className="block text-[16px] font-bold text-ink-muted">{label}</label>}
      {children}
      {showCounter && (
        <div className="flex justify-end">
          <span
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

function TextInput({ value, onChange, ariaLabel, maxLength }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        dir="rtl"
        aria-label={ariaLabel}
        className={cn(
          'w-full rounded-xl border-2 border-brand-300 bg-white',
          'px-4 py-2.5 pe-10 text-md text-ink placeholder:text-ink-soft text-right',
          'focus:border-brand-500 focus:outline-none focus:shadow-focus'
        )}
      />
      <span className="absolute inset-y-0 end-3 flex items-center text-brand-400 pointer-events-none">
        <Edit2 size="16" variant="Linear" color="currentColor" />
      </span>
    </div>
  );
}

function Trash() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

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
