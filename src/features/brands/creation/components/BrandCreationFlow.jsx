import {
  BrandCreationProvider,
  useBrandCreation,
  STEP_IDS,
} from '../context/BrandCreationContext';
import { ChooseMethodStep } from '../steps/ChooseMethodStep';
import { IdentityStep } from '../steps/IdentityStep';
import { VisualsStep } from '../steps/VisualsStep';
import { CharacterStep } from '../steps/CharacterStep';
import { AutoFetchModal } from './AutoFetchModal';

/* Brand-creation wizard entry point.
 *
 * BrandsPage swaps in this component when the user starts creating a
 * brand. It mounts the wizard provider, renders the step view tied to
 * the current `step` id, and overlays AutoFetchModal which is driven by
 * the same context's `isFetching` state.
 *
 * Adding a new step:
 *   1. Define a STEP_IDS entry in BrandCreationContext (and add it to
 *      WIZARD_STEPS if it's part of the shared 3-step sequence).
 *   2. Add a case in `<StepRenderer />`.
 *   3. Wire navigation via `useBrandCreation()` inside the step.
 */
export function BrandCreationFlow({ onCancel, onComplete }) {
  return (
    <BrandCreationProvider onCancel={onCancel} onComplete={onComplete}>
      <StepRenderer />
      {/* Auto-fetch loading overlay — listens to context state and pops
          itself whenever the auto path is fetching or has just errored. */}
      <AutoFetchModal />
    </BrandCreationProvider>
  );
}

function StepRenderer() {
  const { step } = useBrandCreation();

  switch (step) {
    case STEP_IDS.chooseMethod:
      return <ChooseMethodStep />;
    case STEP_IDS.identity:
      return <IdentityStep />;
    case STEP_IDS.visuals:
      return <VisualsStep />;
    case STEP_IDS.character:
      return <CharacterStep />;
    default:
      return <ChooseMethodStep />;
  }
}
