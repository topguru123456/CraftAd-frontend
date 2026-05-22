import { NavItem } from './NavItem';
import { NavGroup } from './NavGroup';
import { SIDEBAR_NAV, SIDEBAR_SETTINGS_GROUP } from '../config/sidebar.config';

/* Top-level sidebar nav.
 *
 * Every row is always navigable. Brand-scoped destinations
 * (projects / avatars / creative-score / inspired-creation) handle
 * their own no-brand state at the page level via NoActiveBrandState
 * — letting the user navigate AND see exactly what's missing reads
 * better than a dead-click on a sidebar item with no explanation.
 *
 * The `requiresBrand` flag in `sidebar.config.js` is kept around as a
 * data hint for any future feature that wants to surface brand-
 * scoping ("locked until you have a brand" tooltip, etc.) without
 * wiring through every page.
 */
export function SidebarNav() {
  return (
    <nav aria-label="ניווט ראשי" className="space-y-1">
      {SIDEBAR_NAV.map((item) => (
        <NavItem key={item.id} item={item} />
      ))}
      <NavGroup group={SIDEBAR_SETTINGS_GROUP} />
    </nav>
  );
}
