import PortraitIcon   from '@assets/icons/ratio/4vs5.svg?react';
import SquareIcon     from '@assets/icons/ratio/1vs1.svg?react';
import StoryIcon      from '@assets/icons/ratio/9vs16.svg?react';
import LandscapeIcon  from '@assets/icons/ratio/16vs9.svg?react';

/* Aspect-ratio catalogue shared by every project flow whose output is
 * a sized image asset (campaign-creative, product-images, …).
 *
 * Each entry pairs a Hebrew label with a `ratio` like `'4:5'` for
 * display, plus the actual `width`/`height` (in pixels) used by the
 * downstream image-generation step. Keep ratios as strings so design
 * decisions ("we want 4:5 rendered as 1080x1350") don't bleed into the
 * URL or DB column type.
 *
 * Each `Icon` is the project-owned SVG mockup from
 * `src/assets/icons/ratio/`. The asset's outer dimensions include a
 * built-in drop-shadow filter — the visible card frame inside is
 * smaller (~48×64 for portrait). Sizing in the picker should target
 * the asset's natural width/height so the shadow doesn't get clipped. */

export const RATIOS = Object.freeze([
  {
    id: 'story',
    label: 'סטורי',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    Icon: StoryIcon,
  },
  {
    id: 'square',
    label: 'מרובע',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    Icon: SquareIcon,
  },
  {
    /* `portrait` was historically labeled 4:5 in this catalogue and
     * everywhere else in the app. But Imagen's accepted ratios are
     * {1:1, 9:16, 16:9, 3:4, 4:3} — 4:5 isn't valid as a wire value,
     * so the dispatcher was silently coercing it to 1:1 (square) and
     * the user got square images back when they expected portrait.
     * We now declare 3:4 here so the picker, the wire value, and the
     * generated image all agree. The icon asset is still the 4vs5
     * mock — close enough proportionally that it doesn't need a new
     * file. */
    id: 'portrait',
    label: 'פורטרט',
    ratio: '3:4',
    width: 1080,
    height: 1440,
    Icon: PortraitIcon,
  },
  {
    id: 'landscape',
    label: 'אופקי',
    ratio: '16:9',
    width: 1920,
    height: 1080,
    Icon: LandscapeIcon,
  },
]);

export const RATIOS_BY_ID = Object.freeze(
  Object.fromEntries(RATIOS.map((r) => [r.id, r]))
);

/* Ratios offered by the IMAGE-generating flows (campaign-creative,
 * product-images). Excludes `landscape` (16:9) because that ratio
 * was added exclusively for video-creative — the image generator
 * isn't tuned for 16:9 output and historical projects rely on the
 * story/square/portrait trio. Add a new id here only if the image
 * pipeline gains real support for the additional shape. */
export const IMAGE_RATIOS = Object.freeze(
  RATIOS.filter((r) => r.id !== 'landscape')
);
