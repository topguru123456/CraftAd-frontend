/* Plan catalogue.
 *
 * Single source of truth for both the pricing UI and the quota system.
 * Each plan declares machine-readable `limits` (numbers, with Infinity for
 * unlimited) — the human-readable `features` array is derived from them
 * so the marketing copy on the pricing page can never drift away from
 * what the quota guard actually enforces.
 *
 * Order is intentional: in the RTL pricing grid the first DOM child
 * renders on the right, so the array order doubles as the visual
 * right-to-left tier ordering on /app/settings/payment.
 */

export const UNLIMITED = Infinity;

/* Resource keys used by QuotaContext. Keep in sync with the keys on
 * `plan.limits` below — adding a new resource means: 1) add it to every
 * plan's limits, 2) add a usage source in QuotaProvider. */
export const QUOTA_RESOURCES = Object.freeze({
  brands: 'brands',
  projects: 'projects',
  downloads: 'downloads',
  avatars: 'avatars',
});

export const FEATURES = {
  campaigns:      'יצירת קריאייטיב לקמפיינים',
  copywriting:    'יצירת קופירייטינג למודעות',
  productImages:  'תמונות מוצר מקצועיות',
  imageEditingAi: 'יצירת ועריכת תמונות ב-AI',
  insights:       'חיזוי ביצועים ותובנות',
  unlimited:      'ללא הגבלה',
};

const baseFeatures = [
  FEATURES.campaigns,
  FEATURES.copywriting,
  FEATURES.productImages,
  FEATURES.imageEditingAi,
  FEATURES.insights,
];

const fmtLimit = (n) => (n === UNLIMITED ? FEATURES.unlimited : String(n));

function buildFeatures(limits) {
  return [
    ...baseFeatures,
    `מגבלת מותגים: ${limits.brands}`,
    `כמות פרויקטים: ${limits.projects}`,
    `כמות הורדות: ${fmtLimit(limits.downloads)}`,
    `כמות אווטארים: ${fmtLimit(limits.avatars)}`,
  ];
}

const RAW_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'לאלו שרוצים להתחיל בקצב שלהם',
    pricing: {
      monthly: { price: 129 },
      yearly:  { price: 62, discount: 52 },
    },
    limits: { brands: 1, projects: 10, downloads: 20, avatars: 4 },
  },
  {
    id: 'scale',
    name: 'Scale',
    description: 'למפרסמים פעילים שצריכים ולייום',
    pricing: {
      monthly: { price: 229 },
      yearly:  { price: 119, discount: 48 },
    },
    limits: { brands: 3, projects: 30, downloads: UNLIMITED, avatars: UNLIMITED },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'מתאים לסוכנויות שיווק ופרסום',
    pricing: {
      monthly: { price: 349 },
      yearly:  { price: 239, discount: 32 },
    },
    limits: { brands: 7, projects: 70, downloads: UNLIMITED, avatars: UNLIMITED },
  },
];

export const PLANS = RAW_PLANS.map((plan) => ({
  ...plan,
  features: buildFeatures(plan.limits),
}));

const PLANS_BY_ID = Object.freeze(
  Object.fromEntries(PLANS.map((plan) => [plan.id, plan]))
);

/* Lookup helper. Falls back to Starter when the id is unknown — that's
 * the same default `useCurrentPlan` uses, so the quota guard never sees
 * an "undefined plan" state even if metadata is missing or stale. */
export function getPlanById(id) {
  return PLANS_BY_ID[id] ?? PLANS_BY_ID.starter;
}

export const BILLING_CYCLES = [
  { id: 'monthly', label: 'חודשי' },
  { id: 'yearly',  label: 'שנתי' },
];

export const CURRENCY_SYMBOL = '₪';
