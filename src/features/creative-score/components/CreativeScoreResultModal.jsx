import { Modal } from '@components/ui';
import { cn } from '@lib/cn';

/* Score result for the /app/creative-score upload flow.
 *
 * Layout (matches the product mockup):
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  ┌─────────────────────────────────────────╮                 │
 *   │  │  ציון מודעות:   │   ציון ביצועים:        │  ← shaped       │
 *   │  │     88%         │      74%               │    sub-card     │
 *   │  └─────────────────────────────────────────╯                 │
 *   │                                                              │
 *   │  המלצות AI לשיפור ביצועים           (heading, RTL start)     │
 *   │  [מומלץ מאוד]                       (badge, RTL end)         │
 *   │  ─────────────────────                                       │
 *   │  rec 1 (right-aligned, Hebrew natural)                       │
 *   │  ─────────────────────                                       │
 *   │  rec 2 ...                                                   │
 *   │                                                              │
 *   │                              [סגור]   ← pill, bottom-right    │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * In RTL the visual right is the "start" — so DOM order is
 *   1) ContentCard (renders visual right)
 *   2) ImageCard   (renders visual left)
 *
 * The scores live in a shaped sub-card whose right edge tucks inward
 * (drawn as a single SVG outline, not a CSS-bordered box — the
 * asymmetric curve can't be done with border-radius alone).
 *
 * Tier label ("מומלץ מאוד" / "טוב" / "בינוני" / "דורש שיפור") is derived
 * client-side from the average of the two scores — §8.4 doesn't return a
 * label but the mockup shows a badge, so we compute one from the same
 * rubric the BE prompt uses. */

const TIERS = [
  { min: 75, label: 'מומלץ מאוד', tone: 'success' },
  { min: 60, label: 'טוב',         tone: 'good' },
  { min: 40, label: 'בינוני',      tone: 'warn' },
  { min: 0,  label: 'דורש שיפור',  tone: 'danger' },
];

const TONE_CLASSES = {
  success: 'bg-brand-100 text-brand-600',
  good:    'bg-brand-50  text-brand-500',
  warn:    'bg-amber-100 text-amber-700',
  danger:  'bg-red-100   text-red-600',
};

function tierFor(score) {
  return TIERS.find((t) => score >= t.min) ?? TIERS[TIERS.length - 1];
}

export function CreativeScoreResultModal({ open, result, onClose }) {
  // First render before the parent has anything — render an empty Modal so
  // the open/close transition still works without an undefined-access crash.
  if (!result) {
    return (
      <Modal open={open} onClose={onClose} size="2xl" ariaLabel="תוצאת ציון קריאייטיב" />
    );
  }

  const { previewUrl, creativeScore, performanceScore, recommendations } = result;
  const average = Math.round((creativeScore + performanceScore) / 2);
  const overallTier = tierFor(average);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      ariaLabel="תוצאת ציון קריאייטיב"
      /* Force-close-via-button only. The score is ephemeral (no DB row),
         so an accidental backdrop click would silently throw the result
         away and force the user to re-upload + re-pay the GPT-4o call.
         Same reason the corner X is hidden — סגור is the only exit. */
      closeOnBackdrop={false}
      showCloseButton={false}
    >
      <div dir="rtl" className="p-4 sm:p-6 lg:p-7">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
          {/* DOM order matters: in RTL the first child renders on the
              visual right. ContentCard goes first so it sits on the right;
              ImageCard renders on the visual left, matching the mockup. */}
          <ContentCard
            creative={creativeScore}
            performance={performanceScore}
            recommendations={recommendations}
            tier={overallTier}
            onClose={onClose}
          />
          <ImageCard previewUrl={previewUrl} />
        </div>
      </div>
    </Modal>
  );
}

function ImageCard({ previewUrl }) {
  return (
    <div
      className={cn(
        'rounded-3xl overflow-hidden bg-surface-muted border border-brand-100',
        'shadow-[0_10px_30px_rgba(237,86,153,0.12)]',
        /* Mobile keeps a square aspect; from lg up the card stretches to
           match the right column's height so both rails read as one
           composition. */
        'aspect-square lg:aspect-auto lg:h-full'
      )}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="המודעה שהועלתה"
          /* object-contain so the whole creative is visible — cropping
             here would be misleading since the score reflects the FULL
             frame the user uploaded. Letterbox bars fall back to the
             card's surface-muted fill, which looks intentional. */
          className="w-full h-full object-contain block"
        />
      ) : null}
    </div>
  );
}

function ContentCard({ creative, performance, recommendations, tier, onClose }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-line bg-white',
        'shadow-[0_10px_30px_rgba(237,86,153,0.08)]',
        /* Larger vertical gap so the scores frame and the recommendations
           heading read as distinct sections, matching the mockup. */
        'p-5 sm:p-7 flex flex-col gap-6 sm:gap-8'
      )}
    >
      <ScoresFrame creative={creative} performance={performance} />
      <Recommendations items={recommendations} tier={tier} />

      {/* Close pill sits at the RTL start (visual right) of the card to
          match the mockup, which places it at the bottom-right corner. */}
      <div className="mt-auto pt-1 flex justify-start">
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'inline-flex items-center justify-center',
            'rounded-full px-10 h-12 min-w-[140px]',
            'font-bold text-base bg-brand-gradient text-white',
            'shadow-brand hover:opacity-95 transition-opacity'
          )}
        >
          סגור
        </button>
      </div>
    </div>
  );
}
function ScoresFrame({ creative, performance }) {
  return (
    /* Outer div is just a positioning context — no border, full width.
       We use flex with justify-end (which is visual-left in RTL) to push
       the bordered cluster to the visual left. */
    <div className="flex justify-end">
      {/* The border lives HERE on the inner cluster, so it only spans
          the width of the scores — not the full card width.
          inline-flex shrinks to content; border-b + border-r + rounded-br
          give the hook shape from the mockup. */}
      <div
        className={cn(
          'inline-flex items-stretch text-center gap-5 sm:gap-8',
          /* Border thickness scales down on mobile — 8px on a 320–375px
             screen reads as a slab and crowds the score numbers. */
          'border-b-[5px] border-r-[5px] sm:border-b-[8px] sm:border-r-[8px] border-line/80',
          'rounded-br-[1.5rem] sm:rounded-br-[2rem]',
          'px-3 sm:px-5 py-2 sm:py-3'
        )}
      >
        {/* DOM-first cell = RTL start = visual right */}
        <ScoreCell label="ציון ביצועים" value={performance} />
        <div aria-hidden="true" className="w-px self-stretch bg-line/80" />
        <ScoreCell label="ציון מודעות" value={creative} />
      </div>
    </div>
  );
}


function ScoreCell({ label, value }) {
  // No `flex-1` here: with the parent being inline-flex, `flex: 1 1 0%`
  // forces each cell to start at min-content width, which word-breaks the
  // Hebrew label ("ציון ביצועים:") onto two lines. Natural content width
  // + whitespace-nowrap on the label keeps it on a single row at 20px.
  return (
    <div className="space-y-1.5">
      <p className="text-base sm:text-[20px] text-ink-muted whitespace-nowrap">
        {label}:
      </p>
      <p className="text-4xl sm:text-5xl font-medium text-pink-600 tabular-nums leading-none">
        {value}%
      </p>
    </div>
  );
}

function Recommendations({ items, tier }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (list.length === 0) return null;
  return (
    <section className="space-y-3">
      {/* Heading sits at the RTL start (visual right), Hebrew natural. */}
      <h3 className="text-lg sm:text-xl font-extrabold text-pink-600 text-right">
        המלצות AI לשיפור ביצועים
      </h3>

      {/* Badge sits on the RTL end (visual left), matching the mockup. */}
      <div className="flex justify-end">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3.5 py-1 text-xs font-bold',
            TONE_CLASSES[tier.tone]
          )}
        >
          {tier.label}
        </span>
      </div>

      <ul className="divide-y divide-line">
        {list.map((rec, i) => (
          <li
            key={i}
            className="py-3.5 text-sm sm:text-[15px] text-ink leading-relaxed text-right"
          >
            {rec}
          </li>
        ))}
      </ul>
    </section>
  );
}