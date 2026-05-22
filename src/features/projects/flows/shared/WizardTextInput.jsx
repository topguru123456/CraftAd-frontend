import { Edit2 } from 'iconsax-react';
import { cn } from '@lib/cn';

/* Single-line text input with a leading pencil hint and trailing max-
 * char indicator. Used by every step whose mock shows the same chrome
 * (copywriting topics + advanced steps so far).
 *
 * Why a dedicated component instead of inlining the icons in each step:
 *   The pencil + max-overlay pair are decorative-but-positionally
 *   touchy — the input needs reserved left/right padding to keep
 *   placeholders from sliding under either glyph. Re-deriving those
 *   numbers per step invites drift; one component owns them.
 *
 * Positioning note:
 *   The pencil and the max indicator use *explicit* `right`/`left`
 *   (not logical `start`/`end`). This is an RTL-only app, and earlier
 *   we hit a visual collision when both glyphs resolved to the same
 *   physical side under certain inherited-dir conditions. Hard-coding
 *   right (pencil) + left (max) makes the layout dir-independent and
 *   immune to that class of bug; flipping to LTR would require
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
  /* When the user hits the cap we flip the badge to danger/bold —
   * matches ProjectWizardField's behavior on the project-name input so
   * every wizard surface signals "you're at the limit" the same way. */
  const atLimit = showMax && (value?.length ?? 0) >= maxLength;

  return (
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
          'py-2.5 pr-11 pl-12 text-md text-ink placeholder:text-ink-soft text-right',
          'focus:border-brand-300 focus:outline-none focus:shadow-focus'
        )}
      />

      {showMax && (
        <span
          dir="ltr"
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute top-1/2 left-3 -translate-y-1/2',
            'text-sm tabular-nums',
            atLimit ? 'text-danger font-bold' : 'text-ink-soft'
          )}
        >
          {maxLength}
        </span>
      )}
    </div>
  );
}
