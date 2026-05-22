import { ListPageToolbar } from '@components/ui';

export function BrandsToolbar({ search, onSearchChange, onCreate }) {
  return (
    <ListPageToolbar
      createLabel="ליצור מותג חדש"
      onCreate={onCreate}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="חיפוש מותגים"
      createButtonClassName="px-3 sm:px-5 text-sm sm:text-md"
    />
  );
}
