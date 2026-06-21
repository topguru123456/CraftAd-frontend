import { useMemo } from 'react';
import { PageContainer } from '@components/ui';
import { cn } from '@lib/cn';
import { InvoicesTable } from '@features/settings/components/InvoicesTable';
import { useInvoices } from '@features/settings/hooks/useInvoices';
import { useSubscriptionInfo } from '@features/settings/hooks/useSubscriptionInfo';

/* /app/settings/invoice — payment history surface.
 *
 * Phase 1 (current): backed by billing_payment_attempts (kind='renewal',
 * success=true). Fresh users / trialing users / dev-bypass users will
 * legitimately have zero rows — those are pre-charge states, no real
 * money has changed hands yet. The SummaryHeader + status-aware empty
 * message exist to make that state INFORMATIVE rather than just blank.
 *
 * Phase 4 (deferred): swap the BE source from billing_payment_attempts
 * to Tranzila's documents API (billing5.tranzila.com/api/documents_db/
 * get_document) and start surfacing PDFs. The FE doesn't need to change
 * — the InvoiceListItemDto shape stays the same.
 *
 * Formal tax invoices (חשבוניות מס) are NOT this surface. Tranzila's
 * terminal auto-document mode emails the official tax invoice to the
 * user per transaction — that's the legal compliance path. */
export default function InvoicePage() {
  const { invoices, loading, error } = useInvoices();
  const info = useSubscriptionInfo();

  const emptyMessage = useMemo(() => buildEmptyMessage(info), [info]);

  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8" dir="rtl">
        <header className="text-right space-y-2">
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-ink leading-tight">
            נהלו את החשבוניות והתשלומים
          </h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-3xl leading-relaxed">
            רשימת כל החיובים שבוצעו במנוי. חשבוניות מס נשלחות אליכם במייל
            לאחר כל חיוב.
          </p>
        </header>

        {info.hasTranzilaToken && <SubscriptionSummary info={info} />}

        <InvoicesTable
          invoices={invoices}
          loading={loading}
          error={error}
          emptyMessage={emptyMessage}
        />
      </div>
    </PageContainer>
  );
}

/* Small panel above the table summarising the user's current billing
 * state. Always present (when a Tranzila token exists) so the page
 * never reads as "empty / broken" — even when the invoice table itself
 * has no rows, this header carries plan + period + status + payment-
 * method. Price intentionally omitted (the management modal owns that
 * surface; doubling it here would risk drift between the two). */
function SubscriptionSummary({ info }) {
  const statusLabel = STATUS_LABEL_HE[info.status] ?? 'לא ידוע';

  return (
    <section
      className={cn(
        'rounded-2xl border border-line bg-white shadow-soft',
        'px-5 py-4 sm:px-6 sm:py-5',
      )}
    >
      <h2 className="text-base sm:text-lg font-extrabold text-ink text-right mb-3">
        סיכום מנוי
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
        <Row label="מסלול נוכחי" value={info.planName} />
        <Row label="סטטוס" value={statusLabel} />
        <Row
          label={info.cancelAtPeriodEnd ? 'גישה עד' : 'חידוש הבא'}
          value={info.periodEndLabel}
        />
        {info.cardLast4 && (
          <Row label="אמצעי תשלום" value={`•••• ${info.cardLast4}`} />
        )}
      </div>
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-bold text-ink">{value}</span>
    </div>
  );
}

/* Status-aware empty-state copy.
 *
 * The default "אין חשבוניות להצגה עדיין" hides the WHY — most users
 * seeing it are mid-trial or pre-first-renewal, and the absence of
 * rows feels like a bug. Variants here name the reason explicitly +
 * tell the user when the first invoice WILL appear. */
const STATUS_LABEL_HE = {
  trialing:    'בתקופת ניסיון',
  active:      'פעיל',
  past_due:    'חיוב נדחה',
  canceled:    'בוטל',
};

function buildEmptyMessage(info) {
  if (!info.hasTranzilaToken) {
    return 'יש להשלים את תהליך הרישום כדי לראות חיובים.';
  }

  const date = info.periodEndLabel && info.periodEndLabel !== '—'
    ? info.periodEndLabel
    : null;

  if (info.cancelAtPeriodEnd) {
    return date
      ? `המנוי בוטל. הגישה תסתיים בתאריך ${date}. לא נמצאו חיובים שבוצעו עד כה.`
      : 'המנוי בוטל. לא נמצאו חיובים שבוצעו עד כה.';
  }

  if (info.status === 'trialing') {
    return date
      ? `אתם בתקופת הניסיון. החשבונית הראשונה תופיע לאחר החיוב הראשון בתאריך ${date}.`
      : 'אתם בתקופת הניסיון. החשבונית הראשונה תופיע לאחר החיוב הראשון.';
  }

  if (info.status === 'past_due') {
    return 'החיוב האחרון לא הצליח. אנא עדכנו את אמצעי התשלום בהגדרות המנוי.';
  }

  if (info.status === 'canceled') {
    return 'המנוי בוטל. לא נמצאו חיובים שבוצעו במנוי הזה.';
  }

  if (info.status === 'active') {
    return date
      ? `המנוי פעיל. החיוב הבא בתאריך ${date} ויופיע כאן בסיומו.`
      : 'המנוי פעיל. החיובים שבוצעו יופיעו כאן.';
  }

  return 'אין חיובים שבוצעו עד כה.';
}
