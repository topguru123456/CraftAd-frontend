import { useCallback, useEffect, useState } from 'react';
import { billingApi } from '@features/billing/api/billing.api';

/* Payment history for the settings → invoices page.
 *
 * Backed by GET /billing/tranzila/invoices which reads
 * billing_payment_attempts (renewal kind, success=true). Same
 * InvoiceListItemDto shape as the prior Stripe-backed endpoint — the
 * existing InvoicesTable component renders unchanged. pdfUrl is null
 * for every row; formal tax invoices (חשבוניות מס) arrive in the
 * user's email per Tranzila terminal config.
 */
export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await billingApi.listTranzilaInvoices();
    setLoading(false);
    if (err) {
      setError(err.message ?? 'טעינת התשלומים נכשלה');
      setInvoices([]);
      return;
    }
    setInvoices(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { invoices, loading, error, reload: load };
}
