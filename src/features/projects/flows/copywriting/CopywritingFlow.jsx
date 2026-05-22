import {
  CopywritingProvider,
  useCopywriting,
  STEP_IDS,
} from './context/CopywritingContext';
import { PlatformStep } from './steps/PlatformStep';
import { SettingsStep } from './steps/SettingsStep';
import { OfferStep } from './steps/OfferStep';
import { TopicsStep } from './steps/TopicsStep';
import { AdvancedStep } from './steps/AdvancedStep';

/* Copywriting-ads wizard entry point.
 *
 * ProjectCreationPage swaps in this component when the user picks
 * "קופירייטינג למודעות" from the project-type chooser. Mounts the
 * provider and renders whichever step is current.
 *
 * Steps today: `platform` (Phase 0 pre-step) → `settings` (visible
 * step 1) → `offer` (visible step 2) → `topics` (visible step 3) →
 * `advanced` (visible step 4, terminal). Adding a step:
 *   1. Add a STEP_IDS entry in CopywritingContext and extend
 *      STEP_ORDER (+ WIZARD_STEPS if it should appear in the visible
 *      indicator).
 *   2. Add a case in `<StepRenderer />`.
 *   3. Wire navigation via useCopywriting() inside the step.
 *
 * Same architecture as CampaignCreativeFlow — provider on the outside,
 * step renderer on the inside, each step a thin file under `steps/`. */
export function CopywritingFlow({ onCancel, onComplete }) {
  return (
    <CopywritingProvider onCancel={onCancel} onComplete={onComplete}>
      <StepRenderer />
    </CopywritingProvider>
  );
}

function StepRenderer() {
  const { step } = useCopywriting();

  switch (step) {
    case STEP_IDS.platform:
      return <PlatformStep />;
    case STEP_IDS.settings:
      return <SettingsStep />;
    case STEP_IDS.offer:
      return <OfferStep />;
    case STEP_IDS.topics:
      return <TopicsStep />;
    case STEP_IDS.advanced:
      return <AdvancedStep />;
    default:
      return <PlatformStep />;
  }
}
