import { Trash } from 'iconsax-react';
import { cn } from '@lib/cn';
import { LottieIcon } from '@components/ui';
import { getProjectType } from '@features/projects/config/project-types.config';
import EditIcon from '@assets/icons/edit.svg';

/* Project list card.
 *
 * Layout (RTL):
 *   - Top row: stacked-thumbnail (visual right) + type chip (left of it)
 *   - Project name
 *   - Brief / text-output preview (1–3 lines, truncated)
 *   - Footer: edit/delete actions (visual right) + last-updated date (left)
 *
 * Thumbnail behavior:
 *   - Image flows (campaign-creative / advertising-package / product-
 *     images) layer up to MAX_STACK preview thumbnails BEHIND the type
 *     icon. Each visible layer represents one "create" click — the
 *     parent samples one image per dispatch batch via
 *     pickPreviewFromVariants in service-type-output.js.
 *   - Non-image flows (copywriting / video / stock-photos / etc.) just
 *     show the type icon — no stack.
 *   - The type icon is the project-types animated Lottie (paused unless
 *     the card is hovered, via playMode='on-hover'); coming-soon types
 *     and unknown ids fall back to the iconsax `Icon` exposed by the
 *     catalogue. */

const IMAGE_STACK_TYPES = new Set([
  'campaign-creative',
  'advertising-package',
  'product-images',
]);

export function ProjectCard({ project, preview, onOpen, onEdit, onDelete }) {
  const name = (project.name ?? '').trim() || 'פרויקט ללא שם';
  const meta = getProjectType(project.serviceType);
  const typeLabel = meta?.shortTitle ?? meta?.title ?? 'פרויקט';

  const isTextOutput = preview.kind === 'text';
  const previewText = getPreviewText(preview, project, isTextOutput);

  // role=button + keyboard handler (not a real <button>) so we can
  // nest the edit/delete <button>s legally.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      dir="rtl"
      className={cn(
        'group relative w-full text-right rounded-2xl bg-white border border-line cursor-pointer',
        'p-5 min-h-[180px] flex flex-col',
        'shadow-[0_4px_16px_rgba(237,86,153,0.08)]',
        'hover:-translate-y-1.5 hover:border-brand-200',
        'hover:shadow-[0_14px_32px_rgba(237,86,153,0.18)]',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-brand-300',
      )}
    >
      <div className="flex items-start gap-3">
        <Thumbnail
          serviceType={project.serviceType}
          preview={preview}
          meta={meta}
          alt={name}
        />
        <span className="inline-flex items-center rounded-full px-2.5 py-1 bg-brand-50 text-brand-500 text-xs font-bold">
          {typeLabel}
        </span>
      </div>

      <h3 className="mt-3 text-lg sm:text-xl font-extrabold text-ink truncate">
        {name}
      </h3>

      {previewText && (
        <p
          className={cn(
            'mt-1 text-sm text-ink-muted',
            // text-output previews carry LLM newlines worth preserving
            isTextOutput ? 'line-clamp-3 whitespace-pre-wrap' : 'line-clamp-2',
          )}
        >
          {previewText}
        </p>
      )}

      <div className="mt-auto pt-4 border-t border-line flex items-center justify-between">
        <span className="text-[14px] text-ink-soft" dir="ltr">
          עודכן בתאריך: {formatDate(project.updatedAt)}
        </span>
        <CardActions onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

function CardActions({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-1.5">
      <IconButton
        icon={<img src={EditIcon} alt="" className="w-3.5 h-3.5" />}
        label="עריכת שם הפרויקט"
        onClick={onEdit}
        hoverClass="hover:text-brand-500 hover:border-brand-300"
      />
      <IconButton
        icon={
          <Trash
            size="16"
            variant="Linear"
            color="currentColor"
            className="text-brand-400 group-hover/btn:text-danger transition-colors"
          />
        }
        label="מחיקת פרויקט"
        onClick={onDelete}
        hoverClass="hover:text-danger hover:border-danger"
      />
    </div>
  );
}

function IconButton({ icon, label, onClick, hoverClass }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={label}
      title={label}
      className={cn(
        'group/btn inline-flex h-8 w-8 items-center justify-center rounded-lg',
        'border border-line text-ink-muted transition-colors',
        hoverClass,
      )}
    >
      {icon}
    </button>
  );
}

/* Small icon overlaid on top of an image stack that shares the same
 * box. Icon and stack do NOT step apart horizontally — they occupy the
 * same XY space; the icon (smaller, top-left) covers most of the stack
 * and only the rotated corners of deeper stack layers peek out around
 * it. Each layer rotates a further STACK_ROTATE_DEG counter-clockwise,
 * so deeper layers fan their top-right corners up-and-out.
 *
 * Image URLs go through `supabaseRenderUrl` so the browser fetches an
 * 80×80 transformed copy from Supabase Storage's render endpoint
 * (Pro-plan feature) instead of the full-size watermarked creative.
 * Cuts each thumbnail from MBs to a few KB. */
const TILE = 80;              // stack tile size (also the container size when stacked)
const ICON_SIZE = 56;         // small icon overlay
const STACK_ROTATE_DEG = 12;  // rotation added per layer of depth

function Thumbnail({ serviceType, preview, meta, alt }) {
  const stackUrls =
    IMAGE_STACK_TYPES.has(serviceType) && Array.isArray(preview?.urls)
      ? preview.urls.slice(0, 3)
      : [];

  const Icon = meta?.Icon;
  const animationLoader = meta?.animationLoader;
  const hasStack = stackUrls.length > 0;

  /* No stack → container is just the icon. With stack → container is
   * the TILE size; rotated layers extend a few px past the edges but
   * the parent flex gap absorbs that. */
  const containerSize = hasStack ? TILE : ICON_SIZE;

  return (
    <div
      className="relative shrink-0"
      style={{ width: containerSize, height: containerSize }}
    >
      {/* Stack layers — all at left=0/top=0; deeper = more rotation.
          Render deepest first so the closest (least-rotated) layer
          paints on top of the others, covering them mostly except for
          the rotated corners. */}
      {stackUrls.map((url, idx) => {
        // depth: 0 = closest (least rotation); larger = deeper
        const depth = stackUrls.length - 1 - idx;
        return (
          <img
            key={`${idx}-${url}`}
            src={supabaseRenderUrl(url, TILE)}
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={TILE}
            height={TILE}
            className="absolute rounded-xl object-cover bg-white border-2 border-white shadow-[0_4px_10px_rgba(15,23,42,0.15)]"
            style={{
              width: TILE,
              height: TILE,
              left: 0,
              top: 0,
              transformOrigin: 'center',
              // negative = counter-clockwise → top-right swings up-and-out
              transform: `rotate(${depth * -STACK_ROTATE_DEG}deg)`,
              zIndex: 10 + (stackUrls.length - depth),
            }}
          />
        );
      })}

      {/* Icon overlay — smaller, pinned to top-left of the box so it
          covers the closest stack layer's top-left and lets the
          stack's rotated corners peek out around the bottom/right. */}
      <div
        className={cn(
          'absolute left-0 bottom-0 rounded-xl',
          'bg-white border border-line shadow-[0_2px_8px_rgba(15,23,42,0.08)]',
          'flex items-center justify-center overflow-hidden',
        )}
        style={{ width: ICON_SIZE, height: ICON_SIZE, zIndex: 30 }}
        aria-label={alt}
      >
        {animationLoader ? (
          <LottieIcon
            loader={animationLoader}
            playMode="on-hover"
            className="h-10 w-10"
          />
        ) : Icon ? (
          <Icon className="h-7 w-7 text-brand-500" />
        ) : (
          <div className="w-7 h-7 rounded-md bg-brand-50 border border-brand-100" />
        )}
      </div>
    </div>
  );
}

/* Rewrite a Supabase Storage public URL into the `render/image/public`
 * endpoint so the CDN returns a resized + reencoded copy. Pro plan
 * feature. Non-Supabase URLs (or strings that don't match the public-
 * object shape) pass through unchanged so the card still works for
 * any pasted external URL. */
function supabaseRenderUrl(url, size = 96) {
  if (typeof url !== 'string' || !url) return url;
  const marker = '/storage/v1/object/public/';
  if (!url.includes(marker)) return url;
  const rendered = url.replace(marker, '/storage/v1/render/image/public/');
  const sep = rendered.includes('?') ? '&' : '?';
  return `${rendered}${sep}width=${size}&height=${size}&resize=cover&quality=80`;
}

function getPreviewText(preview, project, isTextOutput) {
  if (isTextOutput) return (preview.text ?? '').trim();
  if (preview.kind === 'video') {
    return (
      project.draft?.videoDescription ??
      project.draft?.description ??
      ''
    ).trim();
  }
  return (project.draft?.brief ?? '').trim();
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
