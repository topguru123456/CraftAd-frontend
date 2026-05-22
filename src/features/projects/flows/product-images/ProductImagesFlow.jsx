import {
  ProductImagesProvider,
  useProductImages,
  STEP_IDS,
} from './context/ProductImagesContext';
import { RatioStep } from './steps/RatioStep';
import { CustomizationStep } from './steps/CustomizationStep';
import { UploadStep } from './steps/UploadStep';

/* Product-images wizard entry point.
 *
 * ProjectCreationPage swaps in this component when the user picks
 * "תמונות מוצר" from the project-type chooser. Mounts the provider
 * and renders whichever step is current.
 *
 * Steps today: `ratio` (Phase 0 pre-step) → `customization` (visible
 * step 1) → `upload` (visible step 2, currently stubbed). Adding a
 * step:
 *   1. Add a STEP_IDS entry in ProductImagesContext and extend
 *      STEP_ORDER (+ WIZARD_STEPS if it should appear in the visible
 *      indicator).
 *   2. Add a case in `<StepRenderer />`.
 *   3. Wire navigation via useProductImages() inside the step.
 *
 * Same architecture as CampaignCreativeFlow / CopywritingFlow —
 * provider on the outside, step renderer on the inside, each step a
 * thin file under `steps/`. */
export function ProductImagesFlow({ onCancel, onComplete }) {
  return (
    <ProductImagesProvider onCancel={onCancel} onComplete={onComplete}>
      <StepRenderer />
    </ProductImagesProvider>
  );
}

function StepRenderer() {
  const { step } = useProductImages();

  switch (step) {
    case STEP_IDS.ratio:
      return <RatioStep />;
    case STEP_IDS.customization:
      return <CustomizationStep />;
    case STEP_IDS.upload:
      return <UploadStep />;
    default:
      return <RatioStep />;
  }
}
