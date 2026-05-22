import {
  STEP_IDS,
  VideoCreativeProvider,
  useVideoCreative,
} from './context/VideoCreativeContext';
import { OptionsStep } from './steps/OptionsStep';
import { ProductInfoStep } from './steps/ProductInfoStep';
import { ProjectInfoStep } from './steps/ProjectInfoStep';
import { RatioStep } from './steps/RatioStep';

/* Video-creative wizard entry point.
 *
 * ProjectCreationPage swaps in this component when the user picks
 * "קריאייטיב לסרטונים" from the project-type chooser. Mounts the
 * provider and renders whichever step is current.
 *
 * Steps today: `ratio` (Phase 0 pre-step) → `projectInfo` (visible
 * step 1) → `options` (visible step 2, stubbed) → `productInfo`
 * (visible step 3, stubbed). Adding a step:
 *   1. Add a STEP_IDS entry in VideoCreativeContext and extend
 *      STEP_ORDER (+ WIZARD_STEPS if it should appear in the visible
 *      indicator).
 *   2. Add a case in `<StepRenderer />`.
 *   3. Wire navigation via useVideoCreative() inside the step.
 *
 * Same architecture as ProductImagesFlow / CopywritingFlow / CampaignCreativeFlow
 * — provider on the outside, step renderer on the inside, each step
 * a thin file under `steps/`. */
export function VideoCreativeFlow({ onCancel, onComplete }) {
  return (
    <VideoCreativeProvider onCancel={onCancel} onComplete={onComplete}>
      <StepRenderer />
    </VideoCreativeProvider>
  );
}

function StepRenderer() {
  const { step } = useVideoCreative();

  switch (step) {
    case STEP_IDS.ratio:
      return <RatioStep />;
    case STEP_IDS.projectInfo:
      return <ProjectInfoStep />;
    case STEP_IDS.options:
      return <OptionsStep />;
    case STEP_IDS.productInfo:
      return <ProductInfoStep />;
    default:
      return <RatioStep />;
  }
}
