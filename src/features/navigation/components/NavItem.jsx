import { NavLink } from 'react-router-dom';
import { cn } from '@lib/cn';

/* Single sidebar row. Always renders as a NavLink — every destination
 * is navigable. Brand-scoped pages handle the no-brand case at the
 * page layer (see `<NoActiveBrandState />`), so there's no value in a
 * dead-click disabled state here. */
export function NavItem({ item }) {
  return (
    <NavLink
      to={item.href}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-1 py-2.5 rounded-lg transition-colors',
          'text-md text-ink',
          isActive
            ? 'bg-surface-muted font-bold'
            : 'hover:bg-surface-muted/60'
        )
      }
    >
      {({ isActive }) => {
        // Swap to the _selected SVG when this row is the active route.
        // Both icons live on the item's config — see sidebar.config.js.
        const Icon = isActive && item.IconActive ? item.IconActive : item.Icon;
        return (
          <>
            {/* DOM order in RTL flex: first child = RIGHT.
                Icon first → lands on the right; text expands left and
                right-aligns against it. */}
            <Icon className="h-6 w-6 shrink-0" />
            <span className="flex-1 text-right">{item.label}</span>
          </>
        );
      }}
    </NavLink>
  );
}
