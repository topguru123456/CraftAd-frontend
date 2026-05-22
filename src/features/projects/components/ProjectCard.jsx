import { Trash } from 'iconsax-react';
import { cn } from '@lib/cn';
import { getProjectType } from '@features/projects/config/project-types.config';
import EditIcon from '@assets/icons/edit.svg';

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
        <Thumbnail preview={preview} Icon={meta?.Icon} alt={name} />
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

function Thumbnail({ preview, Icon, alt }) {
  if (preview.kind === 'image' && preview.url) {
    return <Tile src={preview.url} alt={alt} />;
  }
  if (preview.kind === 'video' && preview.posterUrl) {
    return <Tile src={preview.posterUrl} alt={alt} />;
  }
  if (Icon) {
    return (
      <div className="relative shrink-0 w-14 h-14 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
        <Icon className="h-8 w-8" />
      </div>
    );
  }
  return <div className="relative shrink-0 w-14 h-14 rounded-lg bg-surface-muted border border-line" />;
}

function Tile({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      className="relative shrink-0 w-14 h-14 rounded-lg object-cover border border-line bg-white"
    />
  );
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
