import { cn } from '@lib/cn';

/* Remaining-characters helper text used under every wizard text input
 * with a character cap. Shows "נותרו N תווים" decreasing as the user
 * types; flips to danger/bold at 0. `aria-live="polite"` so screen
 * readers hear the count update without interrupting typing. */
export function CharCounter({ length, max, className }) {
  const remaining = Math.max(0, max - length);
  return (
    <p
      aria-live="polite"
      className={cn(
        'text-xs text-end',
        remaining === 0 ? 'text-danger font-bold' : 'text-ink-soft',
        className,
      )}
    >
      נותרו <span className="tabular-nums">{remaining}</span> תווים
    </p>
  );
}
