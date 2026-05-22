import { useEffect, useRef, useState } from 'react';
import { Modal } from '@components/ui';
import { cn } from '@lib/cn';
import { PROJECT_NAME_MAX } from '@features/projects/config/project-fields.config';

/* Rename-project modal.
 *
 * Opened from a project card's edit (pencil) button. Single-field
 * form — currently only the project name is editable on the backend
 * (see UpdateProjectDto / ProjectsService.update). When more
 * editable fields land, extend this modal rather than introducing
 * a per-field dialog; the form-grid layout absorbs new rows
 * naturally.
 *
 * Lifecycle:
 *   • `project` prop drives the modal's identity. Opening with a
 *     different project resets the input to that project's name.
 *   • Save calls the parent's `onSave(name)` which is expected to
 *     return `{ data, error }` (matching the api-client envelope).
 *     The parent does the actual PATCH + state update; this
 *     component only displays the in-flight + error states.
 *   • Closing while saving is blocked — we don't want a stale
 *     in-flight PATCH succeeding into a modal that's already gone
 *     (it'd leave the parent's optimistic state mismatched).
 *
 * Validation:
 *   • Trimmed name must be non-empty.
 *   • Max length matches PROJECT_NAME_MAX (200) which the backend
 *     also enforces via class-validator.
 *   • If the trimmed name didn't actually change, close without
 *     calling onSave — saves a PATCH round-trip and a render. */
export function EditProjectModal({ open, project, onClose, onSave }) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  /* Reset state every time the modal opens for a new project. Keyed
   * on (open, project.id) so reopening for the same project doesn't
   * clobber the user's in-progress edit on a re-render. */
  useEffect(() => {
    if (!open) return;
    setName(project?.name ?? '');
    setError(null);
    setIsSaving(false);
    /* Defer focus a tick so the modal's enter animation has time
     * to mount the input. preventScroll keeps the page from
     * jumping when the dialog opens. */
    const id = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, project?.id]);

  const handleClose = () => {
    if (isSaving) return;
    onClose?.();
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('שם הפרויקט לא יכול להיות ריק.');
      return;
    }
    if (trimmed.length > PROJECT_NAME_MAX) {
      setError(`שם הפרויקט יכול להכיל עד ${PROJECT_NAME_MAX} תווים.`);
      return;
    }
    if (trimmed === (project?.name ?? '').trim()) {
      onClose?.();
      return;
    }

    setIsSaving(true);
    setError(null);
    const { error: err } = (await onSave?.(trimmed)) ?? {};
    setIsSaving(false);
    if (err) {
      setError(err.message ?? 'שמירת השם נכשלה. נסו שוב.');
      return;
    }
    onClose?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      ariaLabel="עריכת פרויקט"
      panelClassName="bg-white"
      closeOnBackdrop={!isSaving}
      closeOnEsc={!isSaving}
    >
      <div dir="rtl" className="p-6 sm:p-8 space-y-5">
        <header className="text-center space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink">
            עריכת פרויקט
          </h2>
          <p className="text-sm text-ink-muted">
            תיאור: אנא הזינו את שם הפרויקט שברצונכם לערוך.
          </p>
        </header>

        <div className="space-y-2">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={PROJECT_NAME_MAX}
            placeholder="שם הפרויקט"
            dir="rtl"
            disabled={isSaving}
            className={cn(
              'w-full rounded-xl border bg-brand-50/40',
              'px-4 py-3 text-md text-ink placeholder:text-ink-soft text-right',
              'focus:outline-none focus:shadow-focus',
              error
                ? 'border-danger focus:border-danger'
                : 'border-brand-200 focus:border-brand-300',
              isSaving && 'opacity-70 cursor-not-allowed',
            )}
          />
          {error && (
            <p className="text-sm text-danger text-right">{error}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className={cn(
              'flex-1 h-11 inline-flex items-center justify-center rounded-xl',
              'text-sm font-bold border border-brand-300 text-brand-500 bg-white',
              'transition-colors',
              isSaving
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:bg-brand-50',
            )}
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className={cn(
              'flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl',
              'text-sm font-bold transition-opacity',
              isSaving || !name.trim()
                ? 'bg-brand-100 text-brand-300 cursor-not-allowed'
                : 'bg-brand-gradient text-white shadow-brand hover:opacity-95',
            )}
          >
            {isSaving && (
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin"
              />
            )}
            <span>{isSaving ? 'שומר...' : 'שמירה'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
