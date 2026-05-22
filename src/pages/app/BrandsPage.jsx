import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog, PageContainer } from '@components/ui';
import { ROUTES } from '@config/routes';
import { useBrands } from '@/contexts/BrandsContext';
import { useQuota } from '@/contexts/QuotaContext';
import { useToast } from '@/contexts/ToastContext';
import {
  BrandsHeader,
  BrandsToolbar,
  BrandsGrid,
  EmptyBrands,
  BrandCreationFlow,
  BrandDrawer,
} from '@features/brands';

/* /app/brands
 *
 * Brand is the spine of the app — projects, avatars, and creative-score
 * runs all hang off the active brand. This page is where users see and
 * manage that spine.
 *
 * Composition:
 *   - Default view: list (header + toolbar + grid / empty state).
 *   - Creation view: <BrandCreationFlow /> takes over the page until the
 *     user cancels or completes. The flow owns its own multi-step state
 *     internally (BrandCreationProvider) — BrandsPage just decides
 *     whether to mount it.
 *
 * Quota gates the entry point: clicking "create new brand" goes through
 * `runWithQuota('brands', ...)`, so the upgrade modal pops globally when
 * the user is at their plan cap, and `creating` never flips to true.
 *
 * Delete uses ConfirmDialog rather than `window.confirm()` so the prompt
 * matches the rest of the in-app modals (focus trap, RTL layout, brand
 * styling). `pendingDelete` doubles as the dialog's "open" state and
 * the source of the brand-name in the description copy.
 */
export default function BrandsPage() {
  const { brands, loading, deleteBrand, setActiveBrand, activeBrandId } = useBrands();
  const { runWithQuota } = useQuota();
  const toast = useToast();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  /* Holds the brand id (not the object) so the drawer always reads the
   * latest record from BrandsContext after a save refreshes the list. */
  const [openBrandId, setOpenBrandId] = useState(null);
  const openBrand = useMemo(
    () => brands.find((b) => b.id === openBrandId) ?? null,
    [brands, openBrandId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, search]);

  const handleOpenBrand = (brand) => {
    /* Click on a card opens the drawer with that brand. "Set as active"
     * is now an explicit action inside the drawer rather than an
     * implicit side-effect of clicking. */
    setOpenBrandId(brand.id);
  };

  const handleStartCreate = () => {
    runWithQuota('brands', () => setCreating(true));
  };

  const handleDeleteBrand = (brand) => {
    setPendingDelete(brand);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    const { error } = await deleteBrand(id);
    if (error) {
      toast.error(error.message ?? 'מחיקת המותג נכשלה');
      return;
    }
    if (activeBrandId === id) setActiveBrand(null);
    setPendingDelete(null);
    toast.success(`המותג "${name}" נמחק`);
  };

  const handleCreateProject = (brand) => {
    /* The project creation flow reads the active brand from BrandsContext,
     * so we set it here BEFORE navigating. Without this, clicking "פרויקט
     * חדש" on a non-active brand would silently create the project under
     * whatever brand happens to be active. */
    if (brand?.id && brand.id !== activeBrandId) {
      setActiveBrand(brand.id);
    }
    navigate(ROUTES.app.projects.new);
  };

  if (creating) {
    return (
      <PageContainer>
        <BrandCreationFlow
          onCancel={() => setCreating(false)}
          onComplete={() => setCreating(false)}
        />
      </PageContainer>
    );
  }

  const showEmpty = !loading && filtered.length === 0;
  const emptyMode = search.trim() ? 'filtered' : 'empty';

  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8">
        <BrandsHeader />

        <BrandsToolbar
          search={search}
          onSearchChange={setSearch}
          onCreate={handleStartCreate}
        />

        {showEmpty ? (
          <EmptyBrands mode={emptyMode} />
        ) : (
          <BrandsGrid
            brands={filtered}
            onOpen={handleOpenBrand}
            onDelete={handleDeleteBrand}
            onCreateProject={handleCreateProject}
          />
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="מחיקת המותג"
        description={
          pendingDelete
            ? `המותג "${pendingDelete.name}" יימחק לצמיתות. הפעולה אינה הפיכה.`
            : ''
        }
        confirmLabel="מחק"
        cancelLabel="ביטול"
        variant="danger"
      />

      <BrandDrawer
        brand={openBrand}
        open={openBrand !== null}
        onClose={() => setOpenBrandId(null)}
      />
    </PageContainer>
  );
}
