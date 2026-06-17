import { ListPageToolbar } from '@components/ui';

/* Use the shared ListPageToolbar default — no per-page padding/text
 * overrides. The brands button should look identical to the projects
 * button; size + spacing live in GradientCreateButton so a tweak there
 * propagates to both pages at once. */
export function BrandsToolbar({ search, onSearchChange, onCreate }) {
  return (
    <ListPageToolbar
      createLabel="ליצור מותג חדש"
      onCreate={onCreate}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="חיפוש מותגים"
    />
  );
}
