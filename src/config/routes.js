export const ROUTES = {
  root: '/',
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  onboarding: {
    root: '/onboarding',
  },
  trial: {
    root: '/trial',
  },
  app: {
    root: '/app',
    /** @deprecated use `projects.list` — kept as alias so existing call-sites still resolve. */
    dashboard: '/app/projects',
    /* `projects` is a NAMESPACE — always pick a specific child:
     *   .list, .new, .newType(id), .campaignCreative.
     *
     * Why no `toString()` shim for "back-compat":
     *   <NavLink to={...}> and navigate(...) DO NOT call toString()
     *   on the value. NavLink reads `pathname` directly off a To
     *   object; if it's missing, it silently resolves to the CURRENT
     *   URL. We hit that exact bug — the projects sidebar row pointed
     *   at whichever page the user happened to be on, and both rows
     *   appeared active. Freezing the namespace so it can't be passed
     *   to a NavLink/navigate again without a clear "why are you using
     *   the namespace as a path?" question on review. */
    projects: Object.freeze({
      list: '/app/projects',
      new: '/app/projects/new',
      /* Per-project detail page. URL parameter is `projects.id`. */
      detail: (projectId) => `/app/projects/${projectId}`,
      /* Per-variant inline edit page. URL = state — landing here on a
       * fresh tab loads the variant and shows the empty edit placeholder. */
      editVariant: (projectId, variantId) =>
        `/app/projects/${projectId}/variants/${variantId}/edit`,
      /* Type-specific creation flow paths. Each project type owns its
       * own route so the URL reflects what the user is doing and the
       * flows stay isolated as they grow. */
      newType: (type) => `/app/projects/new/${type}`,
      campaignCreative: '/app/projects/new/campaign-creative',
      copywritingAds: '/app/projects/new/copywriting-ads',
    }),
    brands: '/app/brands',
    avatars: '/app/avatars',
    creativeScore: '/app/creative-score',
    inspiredCreation: '/app/inspired-creation',
    settings: {
      root: '/app/settings',
      account: '/app/settings/account',
      invoice: '/app/settings/invoice',
      payment: '/app/settings/payment',
    },
  },
  notFound: '*',
};
