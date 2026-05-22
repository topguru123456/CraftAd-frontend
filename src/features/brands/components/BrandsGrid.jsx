import { BrandCard } from './BrandCard';

/* Responsive grid of brand cards. RTL grid puts the first DOM child on
 * the right — same convention as the plans grid. Two columns on tablet,
 * three on desktop, one on mobile. */
export function BrandsGrid({ brands, onOpen, onDelete, onCreateProject }) {
  return (
    <div
      dir="rtl"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {brands.map((brand) => (
        <BrandCard
          key={brand.id}
          brand={brand}
          onOpen={onOpen}
          onDelete={onDelete}
          onCreateProject={onCreateProject}
        />
      ))}
    </div>
  );
}
