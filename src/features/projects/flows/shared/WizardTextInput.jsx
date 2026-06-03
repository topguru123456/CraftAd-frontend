import { Edit2 } from 'iconsax-react';
import { cn } from '@lib/cn';
import { CharCounter } from './CharCounter';

/* Single-line text input with a leading pencil hint and a remaining-
 * characters helper below. Used by every step whose mock shows the
 * same chrome (copywriting topics + advanced steps so far).
 *
 * Why a dedicated component instead of inlining the pencil in each step:
 *   The pencil is decorative-but-positionally touchy — the input needs
 *   reserved right padding to keep placeholders from sliding under it.
 *   Re-deriving that number per step invites drift; one component owns it.
 *
 * Positioning note:
 *   The pencil uses *explicit* `right` (not logical `start`). This is
 *   an RTL-only app and hard-coding the physical side makes the layout
 *   immune to inherited-dir bugs; flipping to LTR would require
 *   re-evaluation, but that's not a current product direction.
 *
 * Controlled value contract: caller passes `value` + `onChange(value)`.
 * `onChange` receives the new string directly, not the event — keeps
 * step files free of event-unwrapping boilerplate. */
export function WizardTextInput({
  value,
  onChange,
  maxLength,
  placeholder,
  type = 'text',
  onKeyDown,
  ariaLabel,
}) {
  const showMax = typeof maxLength === 'number';
  const length = value?.length ?? 0;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Edit2
          size="18"
          variant="Linear"
          color="currentColor"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-brand-400"
        />

        <input
          type={type}
          /* Always-controlled: callers occasionally pass `undefined` on
           * very first render before draft state hydrates. Coercing here
           * keeps React from flipping uncontrolled→controlled on the
           * second pass, which surfaces as a console warning. */
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          dir="rtl"
          aria-label={ariaLabel}
          className={cn(
            'w-full rounded-xl border border-line bg-white',
            'py-2.5 pr-11 pl-4 text-md text-ink placeholder:text-ink-soft text-right',
            'focus:border-brand-300 focus:outline-none focus:shadow-focus'
          )}
        />
      </div>

      {showMax && <CharCounter length={length} max={maxLength} />}
    </div>
  );
}
