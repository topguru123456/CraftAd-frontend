import StarsIcon                  from '@assets/icons/sidebar/stars.svg?react';
import StarsIconActive            from '@assets/icons/sidebar/stars_selected.svg?react';
import MegaphoneIcon              from '@assets/icons/sidebar/megaphone.svg?react';
import MegaphoneIconActive        from '@assets/icons/sidebar/megaphone_selected.svg?react';
import AiUserIcon                 from '@assets/icons/sidebar/ai-user.svg?react';
import AiUserIconActive           from '@assets/icons/sidebar/ai-user_selected.svg?react';
import DashboardSpeedIcon         from '@assets/icons/sidebar/dashboard-speed.svg?react';
import DashboardSpeedIconActive   from '@assets/icons/sidebar/dashboard-speed_selected.svg?react';
import InspiredCreationIcon       from '@assets/icons/sidebar/inspired-creation.svg?react';
import InspiredCreationIconActive from '@assets/icons/sidebar/inspired-creation_selected.svg?react';
import SettingsIcon               from '@assets/icons/sidebar/settings.svg?react';
import SettingsIconActive         from '@assets/icons/sidebar/settings_selected.svg?react';
import { ROUTES } from '@config/routes';

/* Each nav row owns BOTH its default + active SVG. NavItem swaps between
 * them based on the route's active state — gives the rows their pink
 * "selected" appearance the user designed without any CSS recoloring.
 *
 * `requiresBrand: true` marks rows that only make sense once the user has
 * an active brand. SidebarNav greys them out and the linked routes show a
 * "create a brand first" empty state if the user navigates there directly. */
export const SIDEBAR_NAV = [
  { id: 'brands',   href: ROUTES.app.brands,            label: 'מותגים',          Icon: StarsIcon,            IconActive: StarsIconActive },
  { id: 'projects', href: ROUTES.app.projects.list,     label: 'פרויקטים',        Icon: MegaphoneIcon,        IconActive: MegaphoneIconActive,         requiresBrand: true },
  { id: 'avatars',  href: ROUTES.app.avatars,           label: 'אווטארים',        Icon: AiUserIcon,           IconActive: AiUserIconActive,            requiresBrand: true },
  { id: 'score',    href: ROUTES.app.creativeScore,     label: 'ציון קריאייטיב',  Icon: DashboardSpeedIcon,   IconActive: DashboardSpeedIconActive,    requiresBrand: true },
  { id: 'inspired', href: ROUTES.app.inspiredCreation,  label: 'יצירה מהשראה',    Icon: InspiredCreationIcon, IconActive: InspiredCreationIconActive,  requiresBrand: true },
];

export const SIDEBAR_SETTINGS_GROUP = {
  id: 'settings',
  label: 'הגדרות',
  Icon: SettingsIcon,
  IconActive: SettingsIconActive,
  matchPath: ROUTES.app.settings.root,
  children: [
    { id: 'account', href: ROUTES.app.settings.account, label: 'חשבון' },
    { id: 'invoice', href: ROUTES.app.settings.invoice, label: 'חשבונית' },
    { id: 'payment', href: ROUTES.app.settings.payment, label: 'תשלום' },
  ],
};
