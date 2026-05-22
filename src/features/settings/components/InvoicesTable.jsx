import { ArrowCircleDown2 } from 'iconsax-react';
import { cn } from '@lib/cn';

const COLS = [
  { key: 'label', label: 'חשבונית' },
  { key: 'date', label: 'תאריך' },
  { key: 'amount', label: 'סכום' },
  { key: 'actions', label: 'פעולות' },
];

export function InvoicesTable({ invoices, loading, error }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-line bg-white shadow-soft border-e-4 border-e-danger p-8">
        <p className="text-center text-ink-muted text-sm">טוען חשבוניות…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-line bg-white shadow-soft border-e-4 border-e-danger p-8">
        <p className="text-center text-danger text-sm" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!invoices?.length) {
    return (
      <div className="rounded-3xl border border-line bg-white shadow-soft border-e-4 border-e-danger p-10">
        <p className="text-center text-ink-muted text-sm">
          אין חשבוניות להצגה עדיין.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-3xl border border-line bg-white shadow-soft overflow-hidden',
        'border-e-4 border-e-danger',
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-center">
          <thead>
            <tr className="border-b border-line bg-surface-muted/40">
              {COLS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-4 py-4 text-sm font-extrabold text-ink"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((row) => (
              <tr
                key={row.id}
                className="border-b border-line/70 last:border-b-0 text-sm text-ink"
              >
                <td className="px-4 py-4 font-medium">{row.label}</td>
                <td className="px-4 py-4 text-ink-muted">{row.date}</td>
                <td className="px-4 py-4 font-semibold tabular-nums">{row.amount}</td>
                <td className="px-4 py-4">
                  <InvoiceDownloadButton pdfUrl={row.pdfUrl} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvoiceDownloadButton({ pdfUrl }) {
  if (!pdfUrl) {
    return (
      <span className="inline-block text-ink-soft text-xs" aria-hidden="true">
        —
      </span>
    );
  }

  return (
    <a
      href={pdfUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="הורדת חשבונית"
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-lg',
        'text-danger hover:bg-rose-50 transition-colors',
      )}
    >
      <ArrowCircleDown2 size={28} variant="Bold" color="currentColor" />
    </a>
  );
}
