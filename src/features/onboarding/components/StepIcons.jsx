/* Onboarding radio-option icons — sourced from the Figma design system.
 *
 * Each option in the onboarding flow has TWO SVG variants:
 *   <key>.svg          — default (unselected) state
 *   <key>_selected.svg — selected state (different fill / accent)
 *
 * The SVGs are full "card-style" icons (~93×94 native viewBox) that
 * carry their own gradients, drop-shadows, and rounded-square shape.
 * They render standalone — the RadioCard wrapper does NOT add a
 * background or color override; if you wrap them in a colored span
 * you'll fight the built-in styling.
 *
 * `withSelection(Default, Selected)` builds a component that picks the
 * right SVG based on the `selected` prop the RadioCard passes through.
 * Size defaults to 40px which gives the visible icon ~28-30px after
 * accounting for the SVG's internal padding (the inner card sits at
 * x≈15, w≈63 inside a 93-wide canvas).
 *
 * "Other" is shared across every step that has an Other option
 * (Role, Activity, Reason, Source — TeamSize doesn't). One pair of
 * SVGs (other.svg + other_selected.svg) backs all of them via OtherIcon.
 */

import RoleAgency from '@assets/icons/onboarding/role_agency.svg?react';
import RoleAgencySelected from '@assets/icons/onboarding/role_agency_selected.svg?react';
import RoleCompany from '@assets/icons/onboarding/role_company.svg?react';
import RoleCompanySelected from '@assets/icons/onboarding/role_company_selected.svg?react';
import RoleMarketing from '@assets/icons/onboarding/role_marketing.svg?react';
import RoleMarketingSelected from '@assets/icons/onboarding/role_marketing_selected.svg?react';

import ActivityServices from '@assets/icons/onboarding/activity_services.svg?react';
import ActivityServicesSelected from '@assets/icons/onboarding/activity_services_selected.svg?react';
import ActivityEcommerce from '@assets/icons/onboarding/activity_ecommerce.svg?react';
import ActivityEcommerceSelected from '@assets/icons/onboarding/activity_ecommerce_selected.svg?react';
import ActivitySaas from '@assets/icons/onboarding/activity_saas.svg?react';
import ActivitySaasSelected from '@assets/icons/onboarding/activity_saas_selected.svg?react';

import ReasonTime from '@assets/icons/onboarding/reason_time.svg?react';
import ReasonTimeSelected from '@assets/icons/onboarding/reason_time_selected.svg?react';
import ReasonPerformance from '@assets/icons/onboarding/reason_performance.svg?react';
import ReasonPerformanceSelected from '@assets/icons/onboarding/reason_performance_selected.svg?react';
import ReasonQuality from '@assets/icons/onboarding/reason_quality.svg?react';
import ReasonQualitySelected from '@assets/icons/onboarding/reason_quality_selected.svg?react';

import SizeAlone from '@assets/icons/onboarding/size_alone.svg?react';
import SizeAloneSelected from '@assets/icons/onboarding/size_alone_selected.svg?react';
import Size2to5 from '@assets/icons/onboarding/size_2-5.svg?react';
import Size2to5Selected from '@assets/icons/onboarding/size_2-5_selected.svg?react';
import Size6to15 from '@assets/icons/onboarding/size_6-15.svg?react';
import Size6to15Selected from '@assets/icons/onboarding/size_6-15_selected.svg?react';
import SizeOver15 from '@assets/icons/onboarding/size_over15.svg?react';
import SizeOver15Selected from '@assets/icons/onboarding/size_over15_selected.svg?react';

import SourceFriend from '@assets/icons/onboarding/source_friend.svg?react';
import SourceFriendSelected from '@assets/icons/onboarding/source_friend_selected.svg?react';
import SourceAd from '@assets/icons/onboarding/source_ad.svg?react';
import SourceAdSelected from '@assets/icons/onboarding/source_ad_selected.svg?react';
import SourceGoogle from '@assets/icons/onboarding/source_google.svg?react';
import SourceGoogleSelected from '@assets/icons/onboarding/source_google_selected.svg?react';
import SourceFacebook from '@assets/icons/onboarding/source_facebook.svg?react';
import SourceFacebookSelected from '@assets/icons/onboarding/source_facebook_selected.svg?react';

import Other from '@assets/icons/onboarding/other.svg?react';
import OtherSelected from '@assets/icons/onboarding/other_selected.svg?react';

function withSelection(Default, Selected) {
  return function Icon({ selected = false, size = 40 }) {
    const Svg = selected ? Selected : Default;
    return <Svg width={size} height={size} aria-hidden="true" />;
  };
}

/* Step 1 — Role */
export const RoleAgencyIcon    = withSelection(RoleAgency,    RoleAgencySelected);
export const RoleCompanyIcon   = withSelection(RoleCompany,   RoleCompanySelected);
export const RoleMarketingIcon = withSelection(RoleMarketing, RoleMarketingSelected);

/* Step 2 — Activity */
export const ActivityServicesIcon  = withSelection(ActivityServices,  ActivityServicesSelected);
export const ActivityEcommerceIcon = withSelection(ActivityEcommerce, ActivityEcommerceSelected);
export const ActivitySaasIcon      = withSelection(ActivitySaas,      ActivitySaasSelected);

/* Step 3 — Reason */
export const ReasonTimeIcon        = withSelection(ReasonTime,        ReasonTimeSelected);
export const ReasonPerformanceIcon = withSelection(ReasonPerformance, ReasonPerformanceSelected);
export const ReasonQualityIcon     = withSelection(ReasonQuality,     ReasonQualitySelected);

/* Step 4 — Team size (no Other option) */
export const SizeAloneIcon   = withSelection(SizeAlone,   SizeAloneSelected);
export const Size2to5Icon    = withSelection(Size2to5,    Size2to5Selected);
export const Size6to15Icon   = withSelection(Size6to15,   Size6to15Selected);
export const SizeOver15Icon  = withSelection(SizeOver15,  SizeOver15Selected);

/* Step 5 — Source */
export const SourceFriendIcon   = withSelection(SourceFriend,   SourceFriendSelected);
export const SourceAdIcon       = withSelection(SourceAd,       SourceAdSelected);
export const SourceGoogleIcon   = withSelection(SourceGoogle,   SourceGoogleSelected);
export const SourceFacebookIcon = withSelection(SourceFacebook, SourceFacebookSelected);

/* Shared "Other" — used by Step 1 / 2 / 3 / 5 */
export const OtherIcon = withSelection(Other, OtherSelected);
