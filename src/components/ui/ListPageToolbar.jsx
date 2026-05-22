import { GradientCreateButton } from './GradientCreateButton';
import { Input } from './Input';
import { SearchIcon } from '@features/navigation';
import { cn } from '@lib/cn';

/**
 * Projects / brands list header row: create CTA + search.
 * Stacks on mobile; inline from sm.
 */
export function ListPageToolbar({
  createLabel,
  onCreate,
  search,
  onSearchChange,
  searchPlaceholder = 'חיפוש',
  createButtonClassName,
}) {
  return (
    <div dir="rtl" className="flex flex-col sm:flex-row sm:items-center gap-3 w-full min-w-0">
      <GradientCreateButton
        onClick={onCreate}
        className={cn('w-full sm:w-auto justify-center', createButtonClassName)}
      >
        {createLabel}
      </GradientCreateButton>

      <div className="w-full sm:flex-1 sm:max-w-md min-w-0">
        <Input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          autoComplete="off"
          leftIcon={<SearchIcon className="h-4 w-4 text-ink-soft" />}
        />
      </div>
    </div>
  );
}
