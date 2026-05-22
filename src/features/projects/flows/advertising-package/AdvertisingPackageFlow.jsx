import {
  AdvertisingPackageProvider,
  STEP_IDS,
  useAdvertisingPackage,
} from './context/AdvertisingPackageContext';
import { ContentSizeStep } from './steps/ContentSizeStep';
import { CampaignSettingsStep } from './steps/CampaignSettingsStep';
import { OfferFeaturesStep } from './steps/OfferFeaturesStep';
import { ImagesStep } from './steps/ImagesStep';

/* Advertising-package wizard entry point.
 *
 * ProjectCreationPage swaps in this component when the user picks
 * "חבילת פרסום" from the project-type chooser. Provider on the
 * outside, step renderer on the inside — same architecture as the
 * four other wizard flows.
 *
 * Status: Phase 0 (size) and Step 1 (settings) are fully built.
 * Steps 2 (offer) and 3 (images) are placeholders awaiting product
 * spec — they render the wizard chrome with a "בקרוב" panel and a
 * working Back button so users can navigate the implemented portion
 * end-to-end without dead clicks. Replace the stub files when each
 * step's requirements land. */
export function AdvertisingPackageFlow({ onCancel, onComplete }) {
  return (
    <AdvertisingPackageProvider onCancel={onCancel} onComplete={onComplete}>
      <StepRenderer />
    </AdvertisingPackageProvider>
  );
}

function StepRenderer() {
  const { step } = useAdvertisingPackage();

  switch (step) {
    case STEP_IDS.size:
      return <ContentSizeStep />;
    case STEP_IDS.settings:
      return <CampaignSettingsStep />;
    case STEP_IDS.offer:
      return <OfferFeaturesStep />;
    case STEP_IDS.images:
      return <ImagesStep />;
    default:
      return <ContentSizeStep />;
  }
}
