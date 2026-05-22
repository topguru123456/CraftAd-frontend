import { cn } from '@lib/cn';

/* Branded icon tile.
 *
 * The "white icon on pink-gradient rounded square" mark shows up across
 * the product (creation cards, modals, future onboarding callouts), so
 * it lives as a single primitive instead of being re-implemented inline.
 *
 * Pass any React-renderable icon (e.g. a `?react`-imported SVG, an
 * iconsax component, or plain JSX). Sizes scale tile + glyph together so
 * the visual proportion stays constant.
 *
 * Usage:
 *   import BrushIcon from '@assets/icons/brush.svg?react';
 *   <IconTile icon={BrushIcon} size="lg" />
 *
 *   <IconTile size="md">
 *     <SomeJSXIcon />
 *   </IconTile>
 *
 * The SVGs used here ship with `fill="white"` baked in, which is why no
 * color override is applied to the glyph — the pink tile + white glyph
 * is the design intent.
 */
const SIZES = {
  sm: { tile: 'h-10 w-10 rounded-xl',           glyph: 'h-5 w-5'  },
  md: { tile: 'h-14 w-14 rounded-2xl',          glyph: 'h-7 w-7'  },
  lg: { tile: 'h-[72px] w-[72px] rounded-2xl',  glyph: 'h-9 w-9'  },
  xl: { tile: 'h-20 w-20 rounded-[22px]',       glyph: 'h-10 w-10' },
};

export function IconTile({ icon: Icon, size = 'md', className, children }) {
  const cls = SIZES[size] ?? SIZES.md;
  const glyph = Icon ? <Icon className={cls.glyph} aria-hidden="true" /> : children;

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex items-center justify-center shrink-0 ring-8 ring-brand-200',
        'bg-gradient-to-br from-brand-300 to-brand-500',
        'shadow-[0_8px_18px_rgba(215,78,124,0.30)]',
        cls.tile,
        className
      )}
    >
      {glyph}
    </span>
  );
}
