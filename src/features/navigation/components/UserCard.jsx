import { useEffect, useRef, useState } from 'react';
import { Profile } from 'iconsax-react';
import RocketIcon from '@assets/icons/sidebar/rocket.svg?react';
import { cn } from '@lib/cn';
import { LightningIcon, LogoutIcon } from './icons';
import { QuotaPopover } from './QuotaPopover';

export function UserCard({ user, planName = 'Starter', onChangePlan, onSignOut }) {
  const displayName = user?.user_metadata?.name || 'ללא שם';
  const email = user?.email || '';
  const avatarUrl = user?.user_metadata?.avatar_url;

  /* Quota popover state — opens on bolt click, closes on outside
   * click / ESC. Mirrors the ActiveBrandCard + BrandPickerPopover
   * pattern so both sidebar popovers feel identical. */
  const [quotaOpen, setQuotaOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!quotaOpen) return;
    /* mousedown beats click → outside-click handler fires before the
     * inside click finishes, preventing a re-open race when the user
     * clicks the bolt while the popover is already open. */
    const onMouseDown = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (popoverRef.current?.contains(e.target)) return;
      setQuotaOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setQuotaOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [quotaOpen]);

  return (
    <div className="w-full rounded-card bg-white border border-line p-4 space-y-3">
      <div className="flex items-center gap-3">
        {/* RTL: first DOM = right. Lightning badge on the right (brand
            accent), name+email expand in the middle, avatar on the left. */}
        <Avatar src={avatarUrl} alt={displayName} />

        <div className="flex-1 min-w-0 text-right">
          <p className="font-bold text-ink text-base leading-tight truncate">{displayName}</p>
          <p className="text-xs text-ink-muted truncate">{email}</p>
        </div>

        {/* Bolt now opens the quota popover. The wrapper is `relative`
            so the popover's `absolute` positioning anchors here, not
            to the outer card. */}
        <div className="relative shrink-0">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setQuotaOpen((v) => !v)}
            aria-label="הצגת מכסות החבילה"
            aria-haspopup="dialog"
            aria-expanded={quotaOpen}
            className={cn(
              'inline-flex h-6 w-6 items-center justify-center rounded-full',
              'bg-brand-gradient text-white shadow-[0_4px_10px_rgba(237,86,153,0.35)]',
              'hover:opacity-95 active:translate-y-[1px] transition-all',
              'focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2',
            )}
          >
            <LightningIcon className="h-3 w-3" />
          </button>

          {quotaOpen && <QuotaPopover ref={popoverRef} />}
        </div>
      </div>

      {/* Action buttons. Each row: text first (right-aligned, expands),
          icon last (lands on LEFT in RTL — matches the screenshot). */}
      <button
        type="button"
        onClick={onChangePlan}
        className="w-full flex items-center justify-between text-base gap-2 rounded-lg border border-brand-200 hover:border-brand-300 hover:bg-brand-50 px-4 py-3 mb-2 transition-colors"
      >
        <div className='flex gap-1 items-center'>
          <RocketIcon className="h-4 w-4 text-brand-500" />
          <span className="text-ink">{planName}</span>
        </div>
        <span className="text-brand-500 font-bold">לשנות</span>{' '}
      </button>

      <button
        type="button"
        onClick={onSignOut}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-brand-200 hover:border-brand-300 hover:bg-brand-50 px-4 py-3 transition-colors"
      >
        <span className="flex-1 text-right text-base font-bold text-ink">התנתק</span>
        <LogoutIcon className="h-4 w-4 text-brand-500" />
      </button>
    </div>
  );
}

function Avatar({ src, alt }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="h-10 w-10 shrink-0 rounded-md object-cover bg-surface-muted"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted text-ink-soft"
    >
      <Profile size={30} color="currentColor" variant="Bold" />
    </span>
  );
}
