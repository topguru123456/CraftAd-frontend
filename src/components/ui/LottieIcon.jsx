import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { cn } from '@lib/cn';

/* Animated icon wrapper.
 *
 * Why this exists:
 *   - Sets app-wide defaults (autoplay + loop) so consumers don't repeat
 *     the same prop set everywhere.
 *   - Adds a "play on hover" mode for the project-type chooser cards.
 *     Without it, six animated icons all looping simultaneously becomes
 *     visually noisy and competes with the user reading descriptions.
 *   - LAZY-LOADS both the player AND the animation JSON. lottie-web is
 *     ~250KB and each animation is 50-200KB — eagerly bundled they
 *     bloated the main chunk by ~800KB. Loading them only on the page
 *     that actually uses them keeps first-paint fast for every other
 *     route.
 *
 * Two prop shapes for the animation source:
 *   loader        — function returning a promise that resolves to either
 *                   the JSON or { default: JSON }. Use this in app
 *                   config so Vite chunks the JSON as a separate file:
 *                       loader: () => import('@/.../foo.json')
 *   animationData — synchronous JSON object. Use only when the data is
 *                   already in memory (rare; mostly for tests).
 *
 * Other props:
 *   playMode  — 'always' (autoplay + loop forever) or 'on-hover' (paused
 *               until isActive flips true). Default 'always'.
 *   isActive  — external play state for playMode='on-hover' when the
 *               parent owns hover detection (e.g. the project card uses
 *               a group-hover style on the whole button — we reflect
 *               that into the player imperatively via this boolean).
 */

const LottiePlayer = lazy(() => import('lottie-react'));

const HOVER_GRACE_MS = 60;
const DEFAULT_LOTTIE_SPEED = 0.65;

export function LottieIcon({
  loader,
  animationData,
  className,
  playMode = 'always',
  isActive = false,
  speed = DEFAULT_LOTTIE_SPEED,
}) {
  const [data, setData] = useState(animationData ?? null);

  /* If a loader was passed, resolve it on mount. Handles both the
   * default-export shape (`{ default: {...} }` — what Vite gives for
   * `import('./foo.json')`) and the bare-object shape (some loaders
   * return the JSON directly). */
  useEffect(() => {
    if (!loader || data) return;
    let cancelled = false;
    loader().then((mod) => {
      if (cancelled) return;
      setData(mod?.default ?? mod ?? null);
    });
    return () => { cancelled = true; };
  }, [loader, data]);

  /* While the player chunk and the animation JSON are loading, render a
   * subtle pulse so the layout doesn't shift in. Same dimensions as the
   * eventual player by relying on the parent's sizing. */
  if (!data) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'h-full w-full rounded-xl bg-rose-100/40 animate-pulse',
          className,
        )}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          className={cn(
            'h-full w-full rounded-xl bg-rose-100/40 animate-pulse',
            className,
          )}
        />
      }
    >
      <LottiePlayerInner
        animationData={data}
        className={className}
        playMode={playMode}
        isActive={isActive}
        speed={speed}
      />
    </Suspense>
  );
}

function LottiePlayerInner({ animationData, className, playMode, isActive, speed }) {
  const lottieRef = useRef(null);

  useEffect(() => {
    lottieRef.current?.setSpeed(speed);
  }, [speed]);

  /* For playMode='on-hover': drive play/pause via the player ref off the
   * isActive prop. A tiny grace window prevents rapid flicker when the
   * cursor brushes the boundary. */
  useEffect(() => {
    if (playMode !== 'on-hover') return;
    const ref = lottieRef.current;
    if (!ref) return;
    const id = setTimeout(() => {
      if (isActive) ref.play();
      else ref.pause();
    }, HOVER_GRACE_MS);
    return () => clearTimeout(id);
  }, [playMode, isActive]);

  return (
    <LottiePlayer
      lottieRef={lottieRef}
      animationData={animationData}
      autoplay={playMode === 'always' || playMode === 'once'}
      loop={playMode === 'always'}
      className={cn('h-full w-full', className)}
      /* SVG renderer keeps strokes crisp at HiDPI without canvas
       * blurring. Performance is fine for icon-sized animations. */
      rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
    />
  );
}
