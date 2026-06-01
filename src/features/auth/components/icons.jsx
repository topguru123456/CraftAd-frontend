import MailSvg from '@assets/icons/auth/email.svg?react';
import LockSvg from '@assets/icons/auth/lock.svg?react';

/* Auth form field icons — sourced from the Figma design system.
 *
 * The SVG files carry their own stroke colors (#F98FB3 with selective
 * opacity for visual hierarchy) baked in, so the icons render the
 * exact pink the designer specified regardless of the surrounding
 * `text-*` color on the Input's icon slot. That's intentional: Figma
 * keeps the icon color stable across normal/error states; the
 * surrounding Input border turns red on invalid, which is enough
 * error signaling without recoloring the icon itself.
 *
 * Default size = 20 matches the native viewBox the designer drew at.
 * Passing a different size scales proportionally. */

export function MailIcon({ className, size = 20 }) {
  return <MailSvg className={className} width={size} height={size} aria-hidden="true" />;
}

export function LockIcon({ className, size = 20 }) {
  return <LockSvg className={className} width={size} height={size} aria-hidden="true" />;
}
