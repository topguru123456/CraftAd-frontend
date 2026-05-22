import { useEffect, useState } from 'react';
import { Refresh, Trash } from 'iconsax-react';
import { Drawer, Dropdown } from '@components/ui';
import { cn } from '@lib/cn';
import EditIcon from '@assets/icons/edit.svg';

/* Edit drawer for one avatar — slides in from the RTL end (visual
 * left), same chrome as CopywritingEditModal so the "open a detail
 * panel without losing page context" pattern reads as one across
 * the app.
 *
 * Layout matches the spec mock:
 *   • Sticky top bar: X close (visual right) + "שמירת שינויים"
 *     primary action (visual left)
 *   • Brand-name header — context only (the drawer is scoped to one
 *     brand's avatar; showing the brand name reminds the user which
 *     persona they're editing)
 *   • Two-column row: גיל (age) on the right, מגדר (gender) on the
 *     left. Gender is the Dropdown component (not a text input) —
 *     constrained to זכר / נקבה / זכר ונקבה per the new spec.
 *   • Full-width sections below for audience / interests / pains /
 *     dreams / free text. Each shows a char counter on its end-aligned
 *     corner.
 *   • Bottom row: regenerate-portrait + delete actions — secondary
 *     to the edit form, tucked below the fields so they don't compete
 *     visually with the save button at the top. */

const GENDER_OPTIONS = [
  { id: 'זכר',         label: 'זכר' },
  { id: 'נקבה',        label: 'נקבה' },
  { id: 'זכר ונקבה',   label: 'זכר ונקבה' },
];

const MAX = {
  targetAudience: 25,
  interests: 200,
  pains: 200,
  dreamsGoals: 200,
  moreDetails: 800,
};

export function AvatarEditModal({
  open,
  avatar,
  brandName,
  onClose,
  onSave,
  onRegeneratePortrait,
  onDelete,
  regenerating,
}) {
  const [form, setForm] = useState(() => toFormState(avatar));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(avatar));
    setIsSaving(false);
    setError(null);
  }, [open, avatar?.id]);

  const handleSave = async () => {
    if (!avatar) return;
    setIsSaving(true);
    setError(null);
    const { error: err } = (await onSave?.(avatar.id, fromFormState(form))) ?? {};
    setIsSaving(false);
    if (err) {
      setError(err.message ?? 'שמירת האווטאר נכשלה. נסו שוב.');
      return;
    }
    onClose?.();
  };

  const handleClose = () => {
    if (isSaving) return;
    onClose?.();
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      ariaLabel="עריכת אווטאר"
      showCloseButton={false}
      closeOnBackdrop={!isSaving}
      closeOnEsc={!isSaving}
    >
      <div dir="rtl" className="h-full flex flex-col">
        <TopBar
          onClose={handleClose}
          onSave={handleSave}
          isSaving={isSaving}
        />

        <div className="flex-1 overflow-y-auto scrollbar-brand">
          <div className="p-6 sm:p-8 space-y-6">
            {brandName && (
              <div>
                <p className="text-xs text-ink-soft mb-1">אווטאר עבור</p>
                <h2 className="text-2xl sm:text-[28px] font-extrabold text-ink">
                  {brandName}
                </h2>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AgeField
                ageMin={form.ageMin}
                ageMax={form.ageMax}
                onChangeMin={(v) => setForm((s) => ({ ...s, ageMin: v }))}
                onChangeMax={(v) => setForm((s) => ({ ...s, ageMax: v }))}
              />
              <GenderField
                value={form.gender}
                onChange={(v) => setForm((s) => ({ ...s, gender: v }))}
              />
            </div>

            <TextField
              label="מיהו קהל היעד במילה אחת?"
              value={form.targetAudience}
              onChange={(v) => setForm((s) => ({ ...s, targetAudience: v }))}
              maxLength={MAX.targetAudience}
            />

            <ListField
              label="תחומי עניין (להפריד בפסיקים)"
              value={form.interests}
              onChange={(v) => setForm((s) => ({ ...s, interests: v }))}
              maxLength={MAX.interests}
            />

            <ListField
              label="כאבים, בעיות ואתגרים"
              value={form.pains}
              onChange={(v) => setForm((s) => ({ ...s, pains: v }))}
              maxLength={MAX.pains}
            />

            <ListField
              label="חלומות, מטרות"
              value={form.dreamsGoals}
              onChange={(v) => setForm((s) => ({ ...s, dreamsGoals: v }))}
              maxLength={MAX.dreamsGoals}
            />

            <TextareaField
              label="טקסט חופשי על קהל היעד"
              value={form.moreDetails}
              onChange={(v) => setForm((s) => ({ ...s, moreDetails: v }))}
              maxLength={MAX.moreDetails}
            />

            {error && <p className="text-sm text-danger text-right">{error}</p>}

            <SecondaryActions
              onRegeneratePortrait={onRegeneratePortrait}
              onDelete={onDelete}
              regenerating={regenerating}
              disabled={isSaving}
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function TopBar({ onClose, onSave, isSaving }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-white" dir="rtl">
      <button
        type="button"
        onClick={onClose}
        aria-label="סגור"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-5 h-10',
          'text-sm font-bold transition-opacity',
          isSaving
            ? 'bg-brand-100 text-brand-300 cursor-not-allowed'
            : 'bg-brand-gradient text-white shadow-brand hover:opacity-95',
        )}
      >
        {isSaving ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
          />
        ) : (
          <img src={EditIcon} alt="" className="w-4 h-4 brightness-0 invert" />
        )}
        <span>{isSaving ? 'שומר...' : 'שמירת שינויים'}</span>
      </button>
    </div>
  );
}

// Two number inputs separated by "עד" (Hebrew "to"). DOM order under
// dir=rtl: min first (RTL start = visual right) → "עד" → max (RTL end
// = visual left). Reads as "מ-X עד Y" in natural Hebrew.
function AgeField({ ageMin, ageMax, onChangeMin, onChangeMax }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-ink-muted">גיל</label>
      <div className="flex items-center gap-2">
        <NumberInput value={ageMin} onChange={onChangeMin} placeholder="מ-" />
        <span className="text-sm text-ink-muted shrink-0">עד</span>
        <NumberInput value={ageMax} onChange={onChangeMax} placeholder="עד" />
      </div>
    </div>
  );
}

function GenderField({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-ink-muted">מגדר</label>
      <Dropdown
        options={GENDER_OPTIONS}
        value={value || null}
        onChange={onChange}
        placeholder="בחרו מגדר"
        ariaLabel="מגדר"
      />
    </div>
  );
}

function TextField({ label, value, onChange, maxLength }) {
  return (
    <FieldShell label={label} count={value.length} max={maxLength}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        dir="rtl"
        className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-md text-ink focus:border-brand-300 focus:outline-none focus:shadow-focus"
      />
    </FieldShell>
  );
}

// Array editor backed by a single comma-separated text input. The
// shape on disk is text[] (interests, pains, dreams_goals); the
// drawer flattens to CSV for v1 since the GPT output is typically a
// short flat list and per-chip add/remove would be friction the user
// doesn't need yet.
function ListField({ label, value, onChange, maxLength }) {
  const joined = value.join(', ');
  return (
    <FieldShell label={label} count={joined.length} max={maxLength}>
      <input
        type="text"
        value={joined}
        onChange={(e) => onChange(splitCsv(e.target.value))}
        maxLength={maxLength}
        dir="rtl"
        className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-md text-ink focus:border-brand-300 focus:outline-none focus:shadow-focus"
      />
    </FieldShell>
  );
}

function TextareaField({ label, value, onChange, maxLength }) {
  return (
    <FieldShell label={label} count={value.length} max={maxLength}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        rows={4}
        dir="rtl"
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-md text-ink resize-y min-h-[100px] focus:border-brand-300 focus:outline-none focus:shadow-focus"
      />
    </FieldShell>
  );
}

/* Label above + input below + char counter positioned in the visual-
 * LEFT corner of the input row (RTL end). The counter sits in flow at
 * the row level, not floating inside the input — simpler, no
 * pseudo-element trickery, accessible to screen readers. */
function FieldShell({ label, count, max, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-ink-muted">{label}</label>
      <div className="relative">
        {children}
        <span
          dir="ltr"
          className={cn(
            'absolute bottom-2 start-3 text-xs tabular-nums pointer-events-none',
            count >= max ? 'text-danger font-bold' : 'text-ink-soft',
          )}
        >
          {count}
        </span>
      </div>
    </div>
  );
}

function NumberInput({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      min={0}
      max={120}
      value={value === null ? '' : value}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === '' ? null : Number(v));
      }}
      placeholder={placeholder}
      dir="ltr"
      className="w-full rounded-xl border border-line bg-white px-4 py-2.5 text-md text-ink text-right placeholder:text-ink-soft focus:border-brand-300 focus:outline-none focus:shadow-focus"
    />
  );
}

function SecondaryActions({ onRegeneratePortrait, onDelete, regenerating, disabled }) {
  return (
    <div className="pt-4 border-t border-line flex items-center justify-between flex-wrap gap-3">
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        className={cn(
          'group/del inline-flex items-center gap-2 rounded-xl px-4 h-10',
          'text-sm font-bold border border-line text-ink-muted bg-white',
          'hover:text-danger hover:border-danger transition-colors',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <Trash
          size="16"
          variant="Linear"
          color="currentColor"
          className="text-brand-400 group-hover/del:text-danger transition-colors"
        />
        <span>מחק אווטאר</span>
      </button>

      <button
        type="button"
        onClick={onRegeneratePortrait}
        disabled={disabled || regenerating}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl px-4 h-10',
          'text-sm font-bold border border-brand-200 text-brand-500 bg-white',
          'hover:border-brand-300 hover:bg-brand-50/40 transition-colors',
          (disabled || regenerating) && 'opacity-60 cursor-wait',
        )}
      >
        <Refresh
          size="16"
          variant="Linear"
          color="currentColor"
          className={cn('text-brand-500', regenerating && 'animate-spin')}
        />
        <span>{regenerating ? 'יוצר דיוקן...' : 'ייצור דיוקן מחדש'}</span>
      </button>
    </div>
  );
}

function toFormState(avatar) {
  return {
    gender: avatar?.gender ?? '',
    ageMin: avatar?.ageMin ?? null,
    ageMax: avatar?.ageMax ?? null,
    targetAudience: avatar?.targetAudience ?? '',
    moreDetails: avatar?.moreDetails ?? '',
    interests: avatar?.interests ?? [],
    pains: avatar?.pains ?? [],
    dreamsGoals: avatar?.dreamsGoals ?? [],
  };
}

function fromFormState(form) {
  return {
    gender: form.gender,
    ageMin: form.ageMin ?? 0,
    ageMax: form.ageMax ?? 0,
    targetAudience: form.targetAudience.trim(),
    moreDetails: form.moreDetails.trim(),
    interests: form.interests,
    pains: form.pains,
    dreamsGoals: form.dreamsGoals,
  };
}

function splitCsv(str) {
  return str
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
