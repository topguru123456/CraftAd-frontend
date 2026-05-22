export const STARTER_PLAN = Object.freeze({
  id: 'starter-annual',
  stripePriceId: 'price_1TT2VlGTbr7A8srN8pSdd8N4',
  name: 'Starter שנתי',
  shortName: 'Starter',
  trialDays: 7,
  trialLabel: '7 ימי ניסיון חינם',
  pricing: {
    currency: '₪',
    monthly: 62,
    monthlyOriginal: 129,
    annualTotal: 744,
    annualTotalOriginal: 1548,
    monthlyLabel: 'לאחר מכן',
    monthlySuffix: 'לחודש במנוי שנתי',
    totalLabel: 'סה״כ',
  },
  features: [
    'יצירת קריאייטיב לקמפיינים',
    'יצירת קופירייטינג למודעות',
    'יצירה ועריכת תמונות ב-AI',
    'תמונות מוצר מקצועיות',
    '10 פרויקטים, 20 הורדות',
  ],
});

export const PLANS = Object.freeze({
  starter: STARTER_PLAN,
});
