import { useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';

/**
 * Keys of failures already surfaced this browser session (survives
 * route changes; keyed by variant id + updatedAt so a new failure
 * after retry can toast again).
 */
const toastedFailureKeys = new Set();

function genFailureKey(variant) {
  return `gen:${variant.id}:${variant.updatedAt ?? 'unknown'}`;
}

function editFailureKey(variant) {
  return `edit:${variant.id}:${variant.updatedAt ?? 'unknown'}`;
}

/**
 * Surfaces generation / edit failures as toasts when a row is newly
 * failed (or failed again with a newer updatedAt). Does not re-toast
 * after navigating away and back.
 */
export function useGenerationFailureToasts(variants, { enabled = true } = {}) {
  const toast = useToast();

  useEffect(() => {
    if (!enabled || !Array.isArray(variants)) return;

    for (const v of variants) {
      if (!v?.id) continue;

      if (v.status === 'failed' && v.errorMessage) {
        const key = genFailureKey(v);
        if (!toastedFailureKeys.has(key)) {
          toastedFailureKeys.add(key);
          toast.warning(v.errorMessage, {
            description: 'זו לא תקלה באפליקציה — ניתן לנסות שוב.',
            duration: 9000,
          });
        }
      }

      if (v.editStatus === 'failed' && v.editErrorMessage) {
        const key = editFailureKey(v);
        if (!toastedFailureKeys.has(key)) {
          toastedFailureKeys.add(key);
          toast.warning(v.editErrorMessage, {
            description: 'העריכה לא הושלמה — ניתן לנסות שוב.',
            duration: 9000,
          });
        }
      }
    }
  }, [variants, enabled, toast]);
}

/** Toast for a single variant row (CreativeEditPage). */
export function useVariantFailureToasts(variant, { enabled = true } = {}) {
  useGenerationFailureToasts(variant ? [variant] : [], { enabled });
}
