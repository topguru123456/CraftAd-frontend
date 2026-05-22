import { useNavigate } from 'react-router-dom';
import { Modal } from '@components/ui/Modal';
import { ROUTES } from '@config/routes';

/* Plan-quota wall.
 *
 * Shown when QuotaContext blocks an action because the user has hit the
 * limit for one of their plan's resources (brands, projects, etc.).
 *
 * Single source of truth for "you need to upgrade" UX — any feature that
 * exceeds quota lands here, so copy/styling stays consistent.
 *
 * RTL DOM-order rule for the button row: `[Upgrade, Close]` puts Upgrade
 * (primary) on the right and Close (secondary) on the left visually,
 * matching the screenshot.
 */
export function QuotaLimitModal({ open, onClose }) {
  const navigate = useNavigate();

  const goToPlans = () => {
    onClose();
    navigate(ROUTES.app.settings.payment);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      ariaLabel="הגעת למכסת החבילה"
      showCloseButton={false}
    >
      <div dir="rtl" className="px-6 sm:px-8 py-8 text-center">
        <BlockedIcon className="mx-auto mb-5 h-16 w-16 text-ink" />

        <h2 className="text-xl sm:text-2xl font-extrabold text-ink mb-2">
          הגעת למכסת החבילה
        </h2>
        <p className="text-sm sm:text-base text-ink-muted mb-6">
          יש לשדרג את המסלול להמשך השימוש במערכת
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={goToPlans}
            className="btn-primary inline-flex items-center justify-center px-5 py-2.5 text-base"
          >
            לבחירת מסלול
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-outline inline-flex items-center justify-center px-5 py-2.5 text-base"
          >
            סגור
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* Inline SVG kept dependency-free — iconsax has Forbidden variants but
 * the screenshot's exact stroke weight and proportions are simpler to
 * match by hand. */
function BlockedIcon({ className }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="26" />
      <line x1="14" y1="14" x2="50" y2="50" />
    </svg>
  );
}
