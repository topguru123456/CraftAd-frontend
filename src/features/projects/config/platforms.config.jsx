import InstagramIcon from '@assets/icons/social/instagram.svg?react';
import TwitterIcon   from '@assets/icons/social/twitter.svg?react';
import LinkedInIcon  from '@assets/icons/social/linkedin.svg?react';
import PinterestIcon from '@assets/icons/social/pinterest.svg?react';
import FacebookIcon  from '@assets/icons/social/facebook.svg?react';

/* Social-platform catalogue.
 *
 * Used by every project-type flow that needs to ask "which platform is
 * this ad for?" — currently campaign-creative and copywriting-ads.
 *
 * Frozen — `id` strings are the contract for downstream features
 * (which sizes are available, what scoring rubric the creative-score
 * uses, etc.). Refining a `label` is safe; rotating an `id` is a
 * migration. Add new platforms by appending entries.
 *
 * Each `Icon` is the project-owned SVG from `src/assets/icons/social/`
 * — these ship with the brand-pink gradient baked in, so cards render
 * them as-is without color overrides. */

export const PLATFORMS = Object.freeze([
  { id: 'linkedin',  label: 'לינקדאין',   Icon: LinkedInIcon  },
  { id: 'twitter',   label: 'X - טוויטר', Icon: TwitterIcon   },
  { id: 'instagram', label: 'אינסטגרם',   Icon: InstagramIcon },
  { id: 'facebook',  label: 'פייסבוק',    Icon: FacebookIcon  },
  { id: 'pinterest', label: 'פינטרסט',    Icon: PinterestIcon },
]);

export const PLATFORMS_BY_ID = Object.freeze(
  Object.fromEntries(PLATFORMS.map((p) => [p.id, p]))
);
