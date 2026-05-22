/* Navigation icons.
 *
 * Convention: anything that maps to a real iconsax icon comes from the
 * library — keeps icons consistent across the app and removes ~40 lines of
 * inline SVG noise. Brand-specific marks (WhatsApp glyph, the Deploy logo
 * placeholder) stay inline because iconsax doesn't ship them and they
 * shouldn't be redrawn anyway.
 */

import {
  ArrowDown2,
  Flash,
  VideoSquare,
  SearchNormal1,
  Add,
  Category,
  RowVertical,
  Logout,
  HambergerMenu,
} from 'iconsax-react';
import Deploy from '@assets/images/deploy.png';

const wrap = (Component, defaults = {}) =>
  function WrappedIcon({ className = 'h-5 w-5', ...rest }) {
    return (
      <Component
        color="currentColor"
        variant="Linear"
        {...defaults}
        {...rest}
        className={className}
      />
    );
  };

export const ChevronDownIcon = wrap(ArrowDown2);
export const LightningIcon   = wrap(Flash, { variant: 'Bold' });
export const VideoIcon       = wrap(VideoSquare);
export const SearchIcon      = wrap(SearchNormal1);
export const PlusIcon        = wrap(Add);
export const GridIcon        = wrap(Category);
export const ListIcon        = wrap(RowVertical);
export const LogoutIcon      = wrap(Logout);
export const MenuIcon        = wrap(HambergerMenu);

/* Plain X — iconsax ships CloseSquare/CloseCircle but not a borderless X. */
export function CloseIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

/* Brand-specific marks — kept inline. */

export function WhatsAppGlyph({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16 .4C7.4.4.4 7.4.4 16c0 2.8.7 5.5 2.1 7.9L.3 31.7l8-2.1c2.3 1.3 4.9 1.9 7.6 1.9 8.6 0 15.6-7 15.6-15.6S24.6.4 16 .4zm0 28.4c-2.4 0-4.8-.6-6.9-1.9l-.5-.3-4.7 1.3 1.3-4.6-.3-.5C3.5 20.7 2.8 18.4 2.8 16 2.8 8.7 8.7 2.8 16 2.8S29.2 8.7 29.2 16 23.3 28.8 16 28.8zm7.3-9.9c-.4-.2-2.4-1.2-2.7-1.3-.4-.1-.6-.2-.9.2-.3.4-1 1.3-1.3 1.6-.2.3-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-1.2-1-2-2.3-2.2-2.7-.2-.4 0-.6.2-.8.2-.2.4-.5.6-.7.2-.2.3-.4.4-.7.1-.3.1-.5 0-.7-.1-.2-.9-2.2-1.3-3-.3-.8-.7-.7-.9-.7h-.7c-.3 0-.7.1-1 .5-.4.4-1.4 1.3-1.4 3.3s1.4 3.9 1.6 4.1c.2.3 2.8 4.4 6.9 6.1.9.4 1.7.6 2.2.8.9.3 1.7.3 2.4.2.7-.1 2.3-.9 2.6-1.9.3-.9.3-1.8.2-1.9-.1-.2-.4-.3-.7-.5z" />
    </svg>
  );
}

export function DeployBrandPlaceholder({ className = 'h-8 w-8' }) {
  return (
    <img src={Deploy} alt="Deploy" className={className} /> /* fallback for non-SVG contexts, and to preserve the original colors which are part of the brand identity. */
  );
}
