import { useEffect, useRef, useState } from 'react';
import { ConfirmDialog, Drawer } from '@components/ui';
import { useActiveBrand } from '@/contexts/BrandsContext';
import { useToast } from '@/contexts/ToastContext';
import { BrandViewPanel } from './BrandViewPanel';
import { BrandEditPanel } from './BrandEditPanel';

/* Brand drawer — view + edit modes for a single brand record.
 *
 * Mounted by BrandsPage when the user clicks a card. Owns:
 *   - the local `mode` toggle ('view' | 'edit')
 *   - the unsaved-changes guard (close-while-dirty triggers a confirm)
 *   - the mode-switch flow (entering edit / leaving edit)
 *
 * Both panels are dumb renderers — the state machine for edit lives
 * inside `useBrandEditor` (see BrandEditPanel). The drawer just:
 *   1. switches between panels based on `mode`
 *   2. asks the panel to clean up (cancel) when the drawer closes
 *      mid-edit
 *
 * `brand` is allowed to be null (drawer simply renders nothing); this
 * matches the parent pattern of toggling state via `selectedBrand`.
 */
export function BrandDrawer({ brand, open, onClose }) {
  const { activeBrand, setActiveBrand } = useActiveBrand();
  const toast = useToast();

  const [mode, setMode] = useState('view');
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  /* The edit panel hangs its `cancel` (storage-cleanup) on this ref so
   * the drawer can call it when the user dismisses while editing.
   * Using a ref instead of a callback prop avoids re-rendering the
   * panel every time we'd want to read it. */
  const editCancelRef = useRef(null);

  /* Reset to view mode whenever the drawer opens fresh (or the brand
   * underneath changes). Skipping this would carry a previous edit
   * session's mode onto an unrelated brand. */
  useEffect(() => {
    if (open) setMode('view');
  }, [open, brand?.id]);

  if (!brand) return null;

  const isActive = activeBrand?.id === brand.id;
  const isEditing = mode === 'edit';

  const requestClose = async () => {
    if (isEditing) {
      /* In edit mode, we need to clean up any pending uploads even
       * when the user just hits ESC. The hook's cancel is async; we
       * don't block close on it (orphan delete is best-effort). */
      const cancelFn = editCancelRef.current;
      editCancelRef.current = null;
      if (typeof cancelFn === 'function') {
        cancelFn();
      }
    }
    onClose?.();
  };

  /* Drawer's onClose path. If the user is editing and the form is
   * dirty, ask before discarding. The dirty signal lives in the hook,
   * but propagating it up here is overkill for v1 — we treat any
   * mid-edit close as "may have changes" and confirm. */
  const handleDrawerClose = () => {
    if (isEditing) {
      setConfirmDiscardOpen(true);
      return;
    }
    requestClose();
  };

  const confirmDiscard = async () => {
    setConfirmDiscardOpen(false);
    await requestClose();
  };

  const handleSetActive = () => {
    setActiveBrand(brand.id);
    onClose?.();
  };

  const handleEnterEdit = () => setMode('edit');

  /* Save outcome from BrandEditPanel comes back with `{ error }`. We
   * surface the result via toast here (rather than inside the panel)
   * so the same toast voice is used for every brand mutation —
   * delete, update, future bulk actions — and the panel stays focused
   * on form rendering. */
  const handleSaved = (result) => {
    if (result?.error) {
      toast.error(result.error.message ?? 'שמירה נכשלה');
      return;
    }
    toast.success('השינויים נשמרו בהצלחה');
    /* After save the brand list refreshes (BrandsContext.updateBrand
     * → refresh); the drawer closes so the user sees the updated row
     * in the list. If we wanted to stay in the drawer with the new
     * data we'd need to re-source `brand` from context — punted. */
    onClose?.();
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={handleDrawerClose}
        ariaLabel={`פרטי המותג ${brand.name}`}
      >
        {isEditing ? (
          <BrandEditPanel
            brand={brand}
            onSaved={handleSaved}
            onCancel={editCancelRef}
          />
        ) : (
          <BrandViewPanel
            brand={brand}
            isActive={isActive}
            onSetActive={handleSetActive}
            onEdit={handleEnterEdit}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={confirmDiscardOpen}
        onCancel={() => setConfirmDiscardOpen(false)}
        onConfirm={confirmDiscard}
        title="לבטל את העריכה?"
        description="השינויים שביצעת לא יישמרו."
        confirmLabel="בטל שינויים"
        cancelLabel="המשך עריכה"
        variant="danger"
      />
    </>
  );
}
