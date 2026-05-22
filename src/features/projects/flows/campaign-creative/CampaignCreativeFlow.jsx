import {
  CampaignCreativeProvider,
  useCampaignCreative,
  STEP_IDS,
} from './context/CampaignCreativeContext';
import { ContentSizeStep } from './steps/ContentSizeStep';
import { CampaignSettingsStep } from './steps/CampaignSettingsStep';
import { OfferFeaturesStep } from './steps/OfferFeaturesStep';
import { ImagesStep } from './steps/ImagesStep';

export function CampaignCreativeFlow({ onCancel, onComplete }) {
  return (
    <CampaignCreativeProvider onCancel={onCancel} onComplete={onComplete}>
      <StepRenderer />
    </CampaignCreativeProvider>
  );
}

function StepRenderer() {
  const { step } = useCampaignCreative();

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
