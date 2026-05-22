import { PageContainer } from '@components/ui';
import { InvoicesTable } from '@features/settings/components/InvoicesTable';
import { useInvoices } from '@features/settings/hooks/useInvoices';

export default function InvoicePage() {
  const { invoices, loading, error } = useInvoices();

  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8" dir="rtl">
        <header className="text-right space-y-2">
          <h1 className="text-[28px] sm:text-[32px] font-extrabold text-ink leading-tight">
            נהלו את החשבוניות והתשלומים
          </h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-3xl leading-relaxed">
            במסך הזה תוכלו לראות את כל החשבוניות שלכם ולנהל אותם בקלות!
          </p>
        </header>

        <InvoicesTable invoices={invoices} loading={loading} error={error} />
      </div>
    </PageContainer>
  );
}
