import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown2, MagicStar } from 'iconsax-react';
import { Drawer } from '@components/ui';
import { cn } from '@lib/cn';
import { copywritingGenerationsApi } from '../api/copywriting-generations.api';
import { REFINEMENT_PRESETS } from '../config/refinement-presets.config';
import EditIcon from '@assets/icons/edit.svg';

/* Edit drawer for a single copywriting variant. Slides in from the
 * visual left (RTL end) — same chrome as the brand-view drawer so the
 * "open a detail panel without losing page context" pattern reads as
 * one across the app.
 *
 * Composed of:
 *   1. Read-only metadata strip (framework / keywords / tones / score)
 *   2. Editable textarea (the source of truth for the saved text)
 *   3. AI refine panel — instruction input + presets dropdown +
 *      Generate; after a generation lands, an Undo + Accept row
 *      replaces the dropdown so the user can checkpoint or revert
 *   4. Sticky footer with Cancel + Save
 *
 * RTL: every container that participates in layout carries an explicit
 * `dir="rtl"` — defensive, because portal subtrees can lose
 * inherited-dir in edge cases, and the difference between "DOM[0] on
 * the right" (correct) and "DOM[0] on the left" (broken) is a class of
 * bug we keep paying for. Cheap to over-annotate.
 *
 * Saving lives at the footer ("שמירה" → PATCH /:id via onSave). The
 * refine endpoint is stateless on the server — the AI returns a
 * preview that sits in local state until the user accepts it or saves.
 *
 * Undo semantics: SINGLE-LEVEL. Each Generate replaces `previousText`
 * with the immediately-prior editor contents. Undo restores that. If
 * the user types in the textarea while a refinement is pending, we
 * KEEP previousText so they can still revert the AI's contribution
 * (typing-on-top will be lost on undo — labeled "ביטול פעולה אחרונה"
 * so they know what they're undoing). Accept clears previousText,
 * locking in the current text as the new baseline. */

export function CopywritingEditModal({ open, variant, onClose, onSave }) {
  const original = variant?.adText ?? '';

  // Editor state — `text` is what's in the textarea; `previousText`
  // is the snapshot right before the most recent AI generate (null
  // when no refine is pending).
  const [text, setText] = useState(original);
  const [previousText, setPreviousText] = useState(null);

  // AI panel state — separate so refining doesn't block saving and
  // saving doesn't block refining.
  const [instruction, setInstruction] = useState('');
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState(null);

  // Save state — narrower scope so a save error doesn't blow away a
  // refine in progress.
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Reset when the drawer opens (or reopens with a different variant).
  // Without this the textarea would carry the previous variant's text
  // on the second open and the AI panel would carry stale state.
  useEffect(() => {
    if (open) {
      setText(original);
      setPreviousText(null);
      setInstruction('');
      setPresetsOpen(false);
      setIsRefining(false);
      setRefineError(null);
      setIsSaving(false);
      setSaveError(null);
    }
  }, [open, original]);

  const trimmedText = text.trim();
  const isDirty = trimmedText !== original.trim();
  const canSave = trimmedText.length > 0 && isDirty && !isSaving && !isRefining;
  const trimmedInstruction = instruction.trim();
  const canGenerate =
    trimmedInstruction.length > 0 && trimmedText.length > 0 && !isRefining;

  const handlePickPreset = useCallback((preset) => {
    setInstruction(preset.instruction);
    setPresetsOpen(false);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !variant?.id) return;
    setIsRefining(true);
    setRefineError(null);
    const snapshot = text;
    const { data, error } = await copywritingGenerationsApi.refine(
      variant.id,
      snapshot,
      trimmedInstruction,
    );
    setIsRefining(false);
    if (error) {
      setRefineError(error.message ?? 'שיפור הטקסט נכשל');
      return;
    }
    setPreviousText(snapshot);
    setText(data.refinedText);
    // Clear the instruction so the next refine starts fresh — the
    // previous instruction was already applied, and re-running it on
    // the refined text would compound the effect (e.g., "shorten"
    // twice).
    setInstruction('');
  }, [canGenerate, variant?.id, text, trimmedInstruction]);

  const handleUndo = useCallback(() => {
    if (previousText === null) return;
    setText(previousText);
    setPreviousText(null);
    setRefineError(null);
  }, [previousText]);

  const handleAccept = useCallback(() => {
    setPreviousText(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setIsSaving(true);
    setSaveError(null);
    const { error } = await onSave(text);
    setIsSaving(false);
    if (error) {
      setSaveError(error.message ?? 'שמירת הטקסט נכשלה');
      return;
    }
    onClose();
  }, [canSave, onSave, text, onClose]);

  const isBusy = isSaving || isRefining;
  const hasPending = previousText !== null;

  return (
    <Drawer
      open={open}
      onClose={isBusy ? () => {} : onClose}
      ariaLabel="עריכת וריאציית קופי"
      closeOnBackdrop={!isBusy}
      closeOnEsc={!isBusy}
    >
      <div dir="rtl" className="flex flex-col min-h-full">
        {/* Top padding clears the drawer's close-X button (positioned
            at top-4 start-4 = top-right). Main content scrolls inside
            the drawer's overflow-y-auto; the footer sticks to the
            bottom so Save is always reachable in long-text mode. */}
        <main className="flex-1 px-6 sm:px-7 pt-14 pb-8 space-y-5">
          <header dir="rtl" className="space-y-1 text-right">
            <h2 className="text-xl font-extrabold text-ink">עריכת וריאציה</h2>
            <p className="text-sm text-ink-muted">
              ערכו את הטקסט בעצמכם או בעזרת ה-AI. השינויים נשמרים על הוריאציה הזאת בלבד.
            </p>
          </header>

          {variant && (
            <div
              dir="rtl"
              className="rounded-xl border border-line bg-surface-subtle p-4 space-y-1 text-[13px] leading-snug text-right"
            >
              <MetaRow label="אסטרטגיה" value={variant.frameworkHe} />
              <MetaRow
                label="מילות מפתח"
                value={(variant.keywords ?? []).join(', ') || '—'}
              />
              <MetaRow
                label="סגנון"
                value={(variant.tonesUsed ?? []).join(', ') || '—'}
              />
              {variant.conversionScore != null && (
                <MetaRow label="ציון המרה" value={`${variant.conversionScore}%`} />
              )}
            </div>
          )}

          <div dir="rtl" className="space-y-2">
            <label
              htmlFor="copywriting-edit-text"
              className="block text-[15px] font-bold text-ink-muted text-right"
            >
              טקסט הקופי
            </label>
            <textarea
              id="copywriting-edit-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              dir="rtl"
              rows={12}
              disabled={isBusy}
              className={cn(
                'w-full rounded-xl border border-line bg-white',
                'px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft text-right',
                'focus:border-brand-300 focus:outline-none focus:shadow-focus',
                'resize-y min-h-[240px]',
                isBusy && 'opacity-60 cursor-wait'
              )}
            />
          </div>

          <RefinePanel
            instruction={instruction}
            onInstructionChange={setInstruction}
            presetsOpen={presetsOpen}
            onTogglePresets={() => setPresetsOpen((v) => !v)}
            onPickPreset={handlePickPreset}
            onClosePresets={() => setPresetsOpen(false)}
            onGenerate={handleGenerate}
            canGenerate={canGenerate}
            isRefining={isRefining}
            refineError={refineError}
            hasPending={hasPending}
            onUndo={handleUndo}
            onAccept={handleAccept}
          />
        </main>

        <footer
          dir="rtl"
          className={cn(
            'sticky bottom-0 z-10 bg-white border-t border-line',
            'px-6 sm:px-7 py-4',
            'flex flex-col gap-3'
          )}
        >
          {saveError && (
            <p role="alert" className="text-sm text-danger text-right">
              {saveError}
            </p>
          )}

          {/* DOM order [Cancel, Save] — in RTL with justify-end, the
              GROUP pushes to the visual left edge; within the group
              DOM[0] (Cancel) sits on the right and DOM[1] (Save) on
              the left. Save is the primary action, last in reading
              order → visual far-left, same convention as the wizard's
              WizardActions footer. */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className={cn(
                'inline-flex items-center justify-center rounded-xl px-5 py-2.5',
                'text-sm font-bold border border-line text-ink-muted bg-white',
                'hover:text-ink hover:border-ink-muted transition-colors',
                isBusy && 'opacity-60 cursor-not-allowed'
              )}
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={cn(
                'inline-flex items-center justify-center rounded-xl px-6 py-2.5 min-w-[140px]',
                'text-sm font-bold transition-opacity',
                canSave
                  ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
                  : 'bg-brand-100 text-brand-300 cursor-not-allowed'
              )}
            >
              {isSaving ? (
                <span
                  aria-hidden="true"
                  className="h-5 w-5 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
                />
              ) : (
                'שמירה'
              )}
            </button>
          </div>
        </footer>
      </div>
    </Drawer>
  );
}

/* AI refine panel — sits between the editable textarea and the drawer
 * footer. Layout (DOM order = reading order in RTL):
 *
 *   Row A: [instruction input + presets chevron] [Generate button]
 *          DOM[0] = input wrapper, DOM[1] = button
 *          → in RTL flex-row, DOM[0] renders on the RIGHT (start),
 *            DOM[1] on the LEFT. Matches the spec mock: input on the
 *            right, pink ג'נרט button on the left.
 *
 *   Row B: either the presets popover (when the chevron is open) or
 *          the Undo + Accept controls (when a refinement is pending).
 *          Never both — popover is for picking, controls are for
 *          managing a pending preview.
 *
 *          Undo/Accept DOM order is [Undo, Accept]:
 *          → RTL renders Undo on the RIGHT (a reversal/back semantic
 *            anchors on the start side), Accept on the LEFT
 *            (a forward/commit semantic anchors at the end). */
function RefinePanel({
  instruction,
  onInstructionChange,
  presetsOpen,
  onTogglePresets,
  onPickPreset,
  onClosePresets,
  onGenerate,
  canGenerate,
  isRefining,
  refineError,
  hasPending,
  onUndo,
  onAccept,
}) {
  const containerRef = useRef(null);

  // Close the presets popover on outside click. ESC closes the entire
  // drawer (handled by Drawer's keydown trap) — we don't intercept.
  useEffect(() => {
    if (!presetsOpen) return;
    const onMouseDown = (e) => {
      if (containerRef.current?.contains(e.target)) return;
      onClosePresets();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [presetsOpen, onClosePresets]);

  return (
    <section ref={containerRef} dir="rtl" className="space-y-3">
      <h3 className="text-[15px] font-bold text-ink-muted text-right">
        פעולות מהירות לעריכת הטקסט באמצעות AI
      </h3>

      <div dir="rtl" className="flex items-stretch gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={instruction}
            onChange={(e) => onInstructionChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canGenerate) {
                e.preventDefault();
                onGenerate();
              }
            }}
            disabled={isRefining}
            placeholder="לקצר את הטקסט"
            dir="rtl"
            className={cn(
              'w-full h-11 rounded-xl border border-brand-200 bg-white',
              'pr-4 pl-10 text-[15px] text-ink placeholder:text-ink-soft text-right',
              'focus:border-brand-400 focus:outline-none focus:shadow-focus',
              isRefining && 'opacity-60 cursor-wait'
            )}
          />
          {/* Chevron pinned to the input's visual LEFT (RTL end) — same
              convention as the shared Dropdown component, so a user
              who's seen one trigger learns the other for free. */}
          <button
            type="button"
            onClick={onTogglePresets}
            disabled={isRefining}
            aria-label="פתח רשימת הצעות"
            aria-expanded={presetsOpen}
            className={cn(
              'absolute top-1/2 left-2 -translate-y-1/2',
              'inline-flex h-7 w-7 items-center justify-center rounded-md',
              'text-ink-muted hover:text-brand-500 hover:bg-brand-50 transition-colors',
              isRefining && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ArrowDown2
              size="16"
              color="currentColor"
              className={cn('transition-transform', presetsOpen && 'rotate-180')}
            />
          </button>

          {/* Presets popover: absolute-positioned overlay so it doesn't
              push surrounding content and — critically — sits above the
              drawer's sticky footer (z-10). Without this it was getting
              clipped behind the footer the moment it opened. Scoped to
              the input wrapper's width so the popover lines up under
              the field a user is already focused on. */}
          {presetsOpen && (
            <ul
              dir="rtl"
              role="listbox"
              aria-label="הצעות לפעולה"
              className={cn(
                'absolute top-full inset-x-0 mt-1.5 z-30',
                'rounded-xl border border-line bg-white shadow-card',
                'max-h-64 overflow-y-auto py-1 animate-fade-in'
              )}
            >
              {REFINEMENT_PRESETS.map((preset) => (
                <li key={preset.id} role="option" aria-selected="false">
                  <button
                    type="button"
                    onClick={() => onPickPreset(preset)}
                    className="w-full px-4 py-2 text-right text-[15px] text-ink hover:bg-surface-muted/70 transition-colors"
                  >
                    {preset.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className={cn(
            'inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl min-w-[120px]',
            'text-sm font-bold transition-opacity shrink-0',
            canGenerate
              ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
              : 'bg-brand-100 text-brand-300 cursor-not-allowed'
          )}
        >
          {isRefining ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full border-[3px] border-white/40 border-t-white animate-spin"
            />
          ) : (
            <>
              <MagicStar size="16" variant="Bold" color="currentColor" />
              <span>ג'נרט</span>
            </>
          )}
        </button>
      </div>

      {refineError && (
        <p role="alert" className="text-sm text-danger text-right">
          {refineError}
        </p>
      )}

      {hasPending && !presetsOpen && (
        <div dir="rtl" className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={isRefining}
            className={cn(
              'inline-flex items-center justify-center rounded-xl px-5 h-11 min-w-[170px]',
              'text-sm font-bold border border-line text-ink-muted bg-white',
              'hover:text-ink hover:border-ink-muted transition-colors',
              isRefining && 'opacity-60 cursor-not-allowed'
            )}
          >
            ביטול פעולה אחרונה
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={isRefining}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl px-5 h-11 min-w-[200px]',
              'text-sm font-bold border border-brand-300 text-brand-500 bg-white',
              'hover:bg-brand-50 transition-colors',
              isRefining && 'opacity-60 cursor-not-allowed'
            )}
          >
            <img src={EditIcon} alt="" className="w-4 h-4" />
            <span>שמירת שינויים בטקסט</span>
          </button>
        </div>
      )}
    </section>
  );
}

function MetaRow({ label, value }) {
  return (
    <p dir="rtl" className="text-right">
      <span className="text-ink-muted">{label}: </span>
      <span className="text-ink">{value}</span>
    </p>
  );
}
