export const formatDate = (d, locale = 'he-IL') =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(d));

export const formatNumber = (n, locale = 'he-IL') =>
  new Intl.NumberFormat(locale).format(n);
