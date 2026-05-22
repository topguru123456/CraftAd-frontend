import { useCallback, useMemo, useRef, useState } from 'react';
import { useBrands } from '@/contexts/BrandsContext';
import { brandsApi } from '../api/brands.api';

/* Brand-edit session state machine.
 *
 * Owns everything the BrandEditPanel UI needs:
 *   - the working `draft` (mirrors the brand record + pending edits)
 *   - imperative setters for every field (with id-based keying for colors)
 *   - the logo flow: upload, replace, track every URL produced this
 *     session so we can clean up orphans on save / cancel
 *   - save / cancel terminators that handle storage cleanup atomically
 *     enough that we never lose a logo without having its replacement
 *
 * Why a hook (not state in the panel component):
 *   - Keeps BrandEditPanel a thin renderer. The hook is unit-testable
 *     in isolation if/when we add tests.
 *   - The edit session has lifecycle that outlives any single render
 *     (pending uploads, refs to the original logo); a hook keeps that
 *     wired to React's lifecycle without the component owning it.
 *
 * Lifecycle:
 *   const editor = useBrandEditor(brand);
 *   // ... user edits ...
 *   await editor.save();    // persists, cleans replaced/intermediate logos
 *   editor.cancel();        // discards, cleans pending logos
 *
 * Returns:
 *   {
 *     draft,                   // current edit state, same shape as brand
 *     isDirty,                 // any field changed vs the original brand?
 *     isSaving, error,
 *     setName, setDescription,
 *     uploadLogo, removeLogo,  // logo flow
 *     addColor, removeColor, updateColor,
 *     setTone, setValues,
 *     save, cancel,
 *   }
 */
export function useBrandEditor(brand) {
  const { updateBrand } = useBrands();

  /* `original` is captured at construction time and never reassigned.
   * It's the source of truth for "what was on disk when we started"
   * — both the dirty check and the cleanup logic depend on it. */
  const original = useMemo(() => snapshot(brand), [brand?.id]);

  const [draft, setDraft] = useState(() => snapshot(brand));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  /* Every URL the user produced via uploadLogo this session, in upload
   * order. On save we delete every entry that didn't end up the saved
   * value (intermediate uploads). On cancel we delete every entry
   * (none of them got saved). */
  const pendingLogosRef = useRef([]);

  /* ------------------------------ scalars ------------------------------ */

  const setName = useCallback((name) => {
    setDraft((d) => ({ ...d, name }));
  }, []);

  const setDescription = useCallback((description) => {
    setDraft((d) => ({ ...d, description }));
  }, []);

  const setTone = useCallback((tone) => {
    setDraft((d) => ({ ...d, tone }));
  }, []);

  const setValues = useCallback((values) => {
    setDraft((d) => ({ ...d, values: Array.isArray(values) ? values : [] }));
  }, []);

  /* -------------------------------- logo ------------------------------- */

  /* Pushes the file to storage, swaps the URL into the draft, and
   * records the new URL on the pending stack so cleanup knows about it. */
  const uploadLogo = useCallback(async (file) => {
    const { data, error: err } = await brandsApi.uploadLogo(file);
    if (err) return { error: err };
    pendingLogosRef.current = [...pendingLogosRef.current, data.url];
    setDraft((d) => ({ ...d, logoUrl: data.url }));
    return { data };
  }, []);

  const removeLogo = useCallback(() => {
    setDraft((d) => ({ ...d, logoUrl: null }));
  }, []);

  /* ------------------------------- colors ------------------------------ */

  const addColor = useCallback(({ hex, name = '' }) => {
    const normalized = normalizeHex(hex);
    if (!normalized) return;
    setDraft((d) => {
      if (d.colors.some((c) => c.hex.toLowerCase() === normalized)) return d;
      return {
        ...d,
        colors: [...d.colors, { id: makeColorId(), hex: normalized, name }],
      };
    });
  }, []);

  const removeColor = useCallback((id) => {
    setDraft((d) => ({ ...d, colors: d.colors.filter((c) => c.id !== id) }));
  }, []);

  const updateColor = useCallback((id, nextHex) => {
    const normalized = normalizeHex(nextHex);
    if (!normalized) return;
    setDraft((d) => {
      if (d.colors.some((c) => c.id !== id && c.hex.toLowerCase() === normalized)) return d;
      return {
        ...d,
        colors: d.colors.map((c) => (c.id === id ? { ...c, hex: normalized } : c)),
      };
    });
  }, []);

  /* ----------------------------- terminators --------------------------- */

  const isDirty = useMemo(() => !shallowEqualBrand(draft, original), [draft, original]);

  const save = useCallback(async () => {
    /* Hard requirements before we hit the API. The button itself is
     * already gated on these, but enforcing again here means any
     * future programmatic call site (keyboard shortcut, dirty-on-close
     * "save then close" flow) gets the same guards. */
    if (!draft.name?.trim()) {
      const err = { message: 'שם המותג נדרש' };
      setError(err);
      return { error: err };
    }
    if (!draft.logoUrl) {
      const err = { message: 'נדרש לוגו לשמירה' };
      setError(err);
      return { error: err };
    }
    if (!Array.isArray(draft.colors) || draft.colors.length === 0) {
      const err = { message: 'נדרש לפחות צבע אחד לשמירה' };
      setError(err);
      return { error: err };
    }

    setIsSaving(true);
    setError(null);

    const patch = {
      name: draft.name.trim(),
      description: draft.description ?? '',
      logoUrl: draft.logoUrl ?? null,
      colors: draft.colors,
      tone: draft.tone ?? null,
      values: draft.values ?? [],
    };
    const { data, error: err } = await updateBrand(original.id, patch);
    if (err) {
      setIsSaving(false);
      setError(err);
      return { error: err };
    }

    /* Storage cleanup is best-effort. By the time we're here the row
     * is saved and the canonical URL is known; orphaned blobs are a
     * minor billing cost, never a data-integrity issue, so a failed
     * delete shouldn't fail the save. */
    const savedUrl = patch.logoUrl;
    const toDelete = computeAssetGarbage({
      original: original.logoUrl,
      pending: pendingLogosRef.current,
      saved: savedUrl,
    });
    if (toDelete.length) {
      await Promise.allSettled(toDelete.map((url) => brandsApi.deleteAsset(url)));
    }
    pendingLogosRef.current = [];

    setIsSaving(false);
    return { data };
  }, [draft, original, updateBrand]);

  const cancel = useCallback(async () => {
    /* Anything we uploaded but didn't save is an orphan — drop them. */
    const toDelete = pendingLogosRef.current;
    pendingLogosRef.current = [];
    if (toDelete.length) {
      await Promise.allSettled(toDelete.map((url) => brandsApi.deleteAsset(url)));
    }
  }, []);

  return {
    draft,
    isDirty,
    isSaving,
    error,
    setName,
    setDescription,
    uploadLogo,
    removeLogo,
    addColor,
    removeColor,
    updateColor,
    setTone,
    setValues,
    save,
    cancel,
  };
}

/* --------------------------------- helpers --------------------------------- */

/* The fields the editor cares about. Mirrored from the brand record but
 * narrowed — anything not here is read-only at the API layer too. */
function snapshot(brand) {
  if (!brand) {
    return {
      id: null,
      name: '',
      description: '',
      logoUrl: null,
      colors: [],
      tone: null,
      values: [],
    };
  }
  return {
    id: brand.id,
    name: brand.name ?? '',
    description: brand.description ?? '',
    logoUrl: brand.logoUrl ?? null,
    colors: Array.isArray(brand.colors) ? brand.colors.map(ensureColorId) : [],
    tone: brand.tone ?? null,
    values: Array.isArray(brand.values) ? brand.values : [],
  };
}

function ensureColorId(c) {
  if (c && typeof c === 'object' && c.id) return c;
  return { id: makeColorId(), hex: c?.hex ?? '#000000', name: c?.name ?? '' };
}

/* Computes which logo URLs to delete after a save. The original gets
 * deleted iff it changed; pending uploads get deleted unless the user
 * actually saved them. The saved value is always preserved. */
function computeAssetGarbage({ original, pending, saved }) {
  const set = new Set();
  if (original && original !== saved) set.add(original);
  for (const url of pending) {
    if (url !== saved) set.add(url);
  }
  return [...set];
}

function shallowEqualBrand(a, b) {
  return (
    a.name === b.name &&
    a.description === b.description &&
    a.logoUrl === b.logoUrl &&
    a.tone === b.tone &&
    sameValues(a.values, b.values) &&
    sameColors(a.colors, b.colors)
  );
}

function sameValues(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function sameColors(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if ((a[i].hex || '').toLowerCase() !== (b[i].hex || '').toLowerCase()) return false;
  }
  return true;
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

function makeColorId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
