import { useEffect, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';

/**
 * Surfaces generation / edit failures as toasts only for failures that
 * occur while the page is mounted. The first snapshot seeds whatever is
 * already failed into a "seen" set without toasting — those are
 * historical, not events the user is witnessing.
 *
 * Dedup keys include `updatedAt` so a fresh fail on the same row (e.g.
 * user clicks Apply again) does fire a new toast. Within a single
 * snapshot we also dedupe by message text, so N sibling variants
 * failing with the same Gemini error don't stack into N identical
 * toasts.
 *
 * State is held in component-local refs (not a module-level Set), so
 * navigating away and back re-primes from the latest snapshot — that's
 * the fix for "old toasts re-fire on revisit".
 */
export function useGenerationFailureToasts(variants, { enabled = true } = {}) {
  const toast = useToast();
  const seenRef = useRef(new Set());
  const primedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !Array.isArray(variants)) return;

    const seen = seenRef.current;

    if (!primedRef.current) {
      for (const v of variants) {
        if (!v?.id) continue;
        if (v.status === 'failed' && v.errorMessage) {
          seen.add(genKey(v));
        }
        if (v.editStatus === 'failed' && v.editErrorMessage) {
          seen.add(editKey(v));
        }
      }
      primedRef.current = true;
      return;
    }

    const toastedThisRun = new Set();

    for (const v of variants) {
      if (!v?.id) continue;

      if (v.status === 'failed' && v.errorMessage) {
        const key = genKey(v);
        if (!seen.has(key)) {
          seen.add(key);
          if (!toastedThisRun.has(v.errorMessage)) {
            toastedThisRun.add(v.errorMessage);
            toast.warning(v.errorMessage, {
              description: 'זו לא תקלה באפליקציה — ניתן לנסות שוב.',
              duration: 9000,
            });
          }
        }
      }

      if (v.editStatus === 'failed' && v.editErrorMessage) {
        const key = editKey(v);
        if (!seen.has(key)) {
          seen.add(key);
          if (!toastedThisRun.has(v.editErrorMessage)) {
            toastedThisRun.add(v.editErrorMessage);
            toast.warning(v.editErrorMessage, {
              description: 'העריכה לא הושלמה — ניתן לנסות שוב.',
              duration: 9000,
            });
          }
        }
      }
    }
  }, [variants, enabled, toast]);
}

/** Toast for a single variant row (CreativeEditPage). */
export function useVariantFailureToasts(variant, { enabled = true } = {}) {
  useGenerationFailureToasts(variant ? [variant] : [], { enabled });
}

function genKey(v) {
  return `gen:${v.id}:${v.updatedAt ?? 'unknown'}`;
}

function editKey(v) {
  return `edit:${v.id}:${v.updatedAt ?? 'unknown'}`;
}
