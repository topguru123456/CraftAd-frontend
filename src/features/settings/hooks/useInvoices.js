import { useCallback, useEffect, useState } from 'react';
import { billingApi } from '@features/billing/api/billing.api';

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await billingApi.listInvoices();
    setLoading(false);
    if (err) {
      setError(err.message ?? 'טעינת החשבוניות נכשלה');
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
