import { DocumentText, MessageEdit } from 'iconsax-react';

/* Lottie animations are LAZY-loaded. Using dynamic `import()` makes Vite
 * emit each animation as its own chunk and code-splits them out of the
 * main bundle (the six JSON files total ~600KB+ — eagerly bundled they
 * inflate first-paint everywhere, not just on /app/projects/new). The
 * loader function is invoked by LottieIcon when the card mounts.
 *
 * Coming-soon types still use iconsax placeholders so they read visually
 * as "different / not live yet" vs the animated grid. */
const ANIMATION_LOADERS = Object.freeze({
  campaignCreative:    () => import('@assets/icons/projects/animated/campaign-creative.json'),
  copywritingAds:      () => import('@assets/icons/projects/animated/copywriting-ads.json'),
  productImages:       () => import('@assets/icons/projects/animated/product-images.json'),
  videoCreative:       () => import('@assets/icons/projects/animated/video-creative.json'),
  stockPhotos:         () => import('@assets/icons/projects/animated/stock-photos.json'),
  advertisingPackage:  () => import('@assets/icons/projects/animated/advertising-package.json'),
});

/* Catalogue of project types the user can create.
 *
 * Single source of truth for the creation launcher's grid AND for any
 * future "what kind of project is this?" lookups (filters in the list,
 * icons on the project card, etc.). Frozen — these are product
 * decisions, not user data.
 *
 * Conventions:
 *   id               — kebab-case, stable forever once shipped (used as
 *                        the primary key on persisted project rows).
 *   title            — full Hebrew display string. Refinable. Used in the
 *                        type-chooser launcher cards.
 *   shortTitle       — compact label for surfaces with little room (the
 *                        badge on project-list cards). Always defined.
 *   description      — short pitch shown on the card.
 *   animationLoader  — lazy import factory for the Lottie JSON. Present
 *                        on every AVAILABLE type. ProjectTypeCard passes
 *                        it to LottieIcon, which resolves the import on
 *                        mount and caches per-instance. Vite chunks each
 *                        JSON into its own asset so the main bundle
 *                        stays lean. Absent on coming-soon types until
 *                        proper assets land — those fall back to `Icon`.
 *   Icon             — iconsax fallback for coming-soon entries. Both
 *                        fields stay shaped so a new type can ship with
 *                        either while its animation is being designed.
 *   badge            — { label, tone } shown top-right of the card.
 *                        tones: 'paid' | 'beta' | 'organic' | 'soon'
 *   status           — 'available' | 'coming-soon'
 *
 * To add a new type: append an entry. The grid renders whatever order
 * this array is in.
 */

export const PROJECT_BADGE_TONES = Object.freeze({
  paid:    'paid',
  beta:    'beta',
  organic: 'organic',
  soon:    'soon',
});

export const PROJECT_TYPES = Object.freeze([
  {
    id: 'campaign-creative',
    title: 'קריאייטיב לקמפיינים',
    shortTitle: 'קריאייטיבים',
    description: 'יצירת מודעות ממוקדות המרה עבור המוצר/שירות שלך תוך שניות.',
    animationLoader: ANIMATION_LOADERS.campaignCreative,
    badge: { label: 'ממומן', tone: PROJECT_BADGE_TONES.paid },
    status: 'available',
  },
  {
    id: 'copywriting-ads',
    title: 'קופירייטינג למודעות',
    shortTitle: 'קופי',
    description: 'יצירת טקסטים המשתמשים במתודולוגיות כתיבה ממוקדות המרה.',
    animationLoader: ANIMATION_LOADERS.copywritingAds,
    badge: { label: 'ממומן', tone: PROJECT_BADGE_TONES.paid },
    status: 'available',
  },
  {
    id: 'product-images',
    title: 'תמונות מוצר',
    shortTitle: 'תמונות מוצר',
    description: 'הפכו תמונה פשוטה לצילומי מוצר מדויקים ומרשימים – בלחיצה.',
    animationLoader: ANIMATION_LOADERS.productImages,
    badge: { label: 'beta', tone: PROJECT_BADGE_TONES.beta },
    status: 'available',
  },
  {
    id: 'video-creative',
    title: 'קריאייטיב לסרטונים',
    shortTitle: 'וידאו',
    description: 'יצירת סרטוני וידאו ממוקדי המרה באמצעות תמונות המוצר שלך.',
    animationLoader: ANIMATION_LOADERS.videoCreative,
    badge: { label: 'beta', tone: PROJECT_BADGE_TONES.beta },
    status: 'available',
  },
  {
    id: 'stock-photos',
    title: 'תמונות מאגר',
    shortTitle: 'מאגר',
    description: 'מצאו את התמונה המושלמת וצרו תכנים יצירתיים וממוקדי מעורבות לפוסטים אורגניים שלכם.',
    animationLoader: ANIMATION_LOADERS.stockPhotos,
    badge: { label: 'אורגני', tone: PROJECT_BADGE_TONES.organic },
    status: 'available',
  },
  {
    id: 'advertising-package',
    title: 'חבילת פרסום',
    shortTitle: 'חבילה',
    description: 'מודעות + קופי מוכן לפרסום בתוך פרויקט אחד.',
    animationLoader: ANIMATION_LOADERS.advertisingPackage,
    badge: { label: 'ממומן', tone: PROJECT_BADGE_TONES.paid },
    status: 'available',
  },
  {
    id: 'landing-copy',
    title: 'קופי לדף נחיתה',
    shortTitle: 'דף נחיתה',
    description: 'טקסט שיווקי ממוקד לדף שמוכר. חד וממיר.',
    /* Placeholder — swap for an animated Lottie when the design lands.
     * `copywright creative.json` in craftad_assets is a reasonable fit. */
    Icon: DocumentText,
    badge: { label: 'בקרוב', tone: PROJECT_BADGE_TONES.soon },
    status: 'coming-soon',
  },
  {
    id: 'social-posts',
    title: 'פוסטים לסושיאל',
    shortTitle: 'סושיאל',
    description: 'פוסט מקצועי וברור שמושך תשומת לב – עם ניסוח חד, עיצוב מוקפד, ומבנה שמניע לפעולה.',
    Icon: MessageEdit,
    badge: { label: 'בקרוב', tone: PROJECT_BADGE_TONES.soon },
    status: 'coming-soon',
  },
]);

export const PROJECT_TYPES_BY_ID = Object.freeze(
  Object.fromEntries(PROJECT_TYPES.map((t) => [t.id, t]))
);

export function getProjectType(id) {
  return PROJECT_TYPES_BY_ID[id] ?? null;
}
