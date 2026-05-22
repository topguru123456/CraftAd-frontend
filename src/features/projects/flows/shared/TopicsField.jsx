import { useState } from 'react';
import { Trash } from 'iconsax-react';
import { cn } from '@lib/cn';
import { WizardTextInput } from './WizardTextInput';

/* Topics input — a text box + Add button that pushes the value as a
 * chip into a controlled list, with per-chip remove buttons.
 *
 * Used today by copywriting-ads' TopicsStep; lives in shared/ because
 * the same "add a few keywords" pattern reads naturally for any future
 * flow that wants the same intake.
 *
 * Controlled by the caller:
 *   topics   — string[]; the chip list
 *   onChange — (next: string[]) => void; called on add + remove
 *
 * Internal-only state:
 *   The pending input string. We don't lift it into the wizard draft
 *   because half-typed text isn't part of the project record — only
 *   committed chips are.
 *
 * Add rules:
 *   - Trim before comparing/storing (whitespace-only inputs are no-ops).
 *   - Dedupe case-sensitively against existing chips so re-adding the
 *     same word doesn't grow a noisy list.
 *   - Enter key adds (same path as the button).
 *
 * Layout matches the spec mock:
 *   • Label on its own line, right-aligned.
 *   • Input row uses the shared `WizardTextInput` (pencil on the right,
 *     char-cap hint on the left, dir-immune positioning).
 *   • Centered gradient Add button below.
 *   • Chip strip aligned to the right (RTL start), wraps as it grows;
 *     each chip is plain text with a trash button to its visual left. */
const DEFAULT_LABEL = 'נושאים מרכזיים בתוכן';
const DEFAULT_PLACEHOLDER =
  'הוסיפו מילות מפתח או נושאים שחישוב שהתוכן יתמקד בהם (למשל: נדל"ן, אקדמיה, בריאות)';
const DEFAULT_ADD_LABEL = 'להוסיף';

export function TopicsField({
  topics,
  onChange,
  maxLength = 20,
  label = DEFAULT_LABEL,
  placeholder = DEFAULT_PLACEHOLDER,
  addLabel = DEFAULT_ADD_LABEL,
  removeAriaLabel = 'הסר נושא',
}) {
  const [input, setInput] = useState('');

  const trimmed = input.trim();
  const canAdd = trimmed.length > 0 && !topics.includes(trimmed);

  const handleAdd = () => {
    if (!canAdd) return;
    onChange([...topics, trimmed]);
    setInput('');
  };

  const handleRemove = (topic) => {
    onChange(topics.filter((t) => t !== topic));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-[16px] font-bold text-ink-muted">
        {label}
      </label>

      <WizardTextInput
        value={input}
        onChange={setInput}
        maxLength={maxLength}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        ariaLabel={label}
      />

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className={cn(
            'min-w-[140px] rounded-xl py-2.5 px-6 font-bold text-md transition-colors',
            canAdd
              ? 'bg-brand-gradient text-white shadow-brand hover:opacity-95'
              : 'bg-brand-100 text-brand-300 cursor-not-allowed'
          )}
        >
          {addLabel}
        </button>
      </div>

      {topics.length > 0 && (
        <ul className="flex flex-wrap justify-start gap-x-6 gap-y-2 pt-1">
          {topics.map((topic) => (
            <li key={topic} className="inline-flex items-center gap-1.5">
              <span className="text-sm text-ink">{topic}</span>
              <button
                type="button"
                onClick={() => handleRemove(topic)}
                aria-label={`${removeAriaLabel}: ${topic}`}
                className={cn(
                  'inline-flex h-7 w-7 items-center justify-center',
                  'rounded-md text-danger hover:bg-rose-50 transition-colors'
                )}
              >
                <Trash size="16" variant="Linear" color="currentColor" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
