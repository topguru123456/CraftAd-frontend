import { LottieProgressModal, Modal } from '@components/ui';
import { useBrandCreation } from '../context/BrandCreationContext';

const BULB_ANIMATION_LOADER = () => import('@assets/animations/bulb.json');

/* Loading modal shown while we scrape the user's website to seed the
 * brand draft.
 *
 * Driven by `isFetching` in BrandCreationContext — opens when the auto
 * fetch starts and closes when it resolves (success → wizard advances to
 * identity; error → fetch error surfaces and the user can retry).
 *
 * Two visual states share the same trigger but render very different
 * surfaces:
 *   - FETCHING: shared LottieProgressModal (no close, blocking, bulb
 *     animation, "אוסף מידע..." status). Same primitive the scoring
 *     flow uses — keeps in-progress UX coherent across the app.
 *   - ERROR:    plain Modal with a dismiss button. The user needs an
 *     explicit way to acknowledge the failure and retry, so the
 *     closable Modal is right here.
 *
 * The branch keeps the "no close while fetching" guarantee — backdrop
 * + Esc + X are all disabled during fetch because cancelling mid-scrape
 * leaves the wizard in an awkward limbo (we'd have a half-spent
 * context.dev quota call with no result row). */
export function AutoFetchModal() {
  const { isFetching, fetchError, dismissFetchError } = useBrandCreation();

  if (fetchError) {
    return (
      <Modal
        open
        onClose={dismissFetchError}
        size="sm"
        closeOnEsc
        closeOnBackdrop
        showCloseButton
        ariaLabel="שגיאה באיסוף מידע"
      >
        <div dir="rtl" className="px-6 sm:px-8 py-8 sm:py-10 text-center">
          <ErrorState error={fetchError} onDismiss={dismissFetchError} />
        </div>
      </Modal>
    );
  }

  return (
    <LottieProgressModal
      open={isFetching}
      title="אוסף את פרטי המותג שלך"
      titleClassName="text-brand-500"
      statusText="אוסף מידע..."
      animationLoader={BULB_ANIMATION_LOADER}
      ariaLabel="אוסף את פרטי המותג"
    />
  );
}

function ErrorState({ error, onDismiss }) {
  return (
    <>
      <h2 className="text-lg sm:text-xl font-extrabold text-ink mb-2">
        לא הצלחנו לאסוף את פרטי המותג
      </h2>
      <p className="text-sm text-ink-muted mb-6">
        {error?.message ?? 'נסו שוב או עברו ליצירה ידנית'}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="btn-primary inline-flex items-center justify-center px-5 py-2.5 text-base"
      >
        סגור
      </button>
    </>
  );
}
