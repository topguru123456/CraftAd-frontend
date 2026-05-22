import { AdvertisingPackageFlow } from '../advertising-package/AdvertisingPackageFlow';
import { CampaignCreativeFlow } from '../campaign-creative/CampaignCreativeFlow';
import { CopywritingFlow } from '../copywriting/CopywritingFlow';
import { ProductImagesFlow } from '../product-images/ProductImagesFlow';
import { StockPhotosFlow } from '../stock-photos/StockPhotosFlow';
import { VideoCreativeFlow } from '../video-creative/VideoCreativeFlow';
import { getProjectType } from '../../config/project-types.config';

/* Registry of project-type creation flows.
 *
 * Adding a new type:
 *   1. Append to PROJECT_TYPES in project-types.config.js.
 *   2. Create flows/<type-id>/ with Context + Flow + steps. (Pure-utility
 *      types like stock-photos skip Context + steps — just a single
 *      Flow component is enough.)
 *   3. Register here with Flow + status: 'available'.
 *   4. Route `projects/new/:projectType` resolves automatically.
 *
 * Types marked coming-soon in the catalogue but not registered here
 * show a friendly "בקרוב" state on /app/projects/new/:type. */
const REGISTRY = Object.freeze({
  'campaign-creative': {
    Flow: CampaignCreativeFlow,
    status: 'available',
  },
  'copywriting-ads': {
    Flow: CopywritingFlow,
    status: 'available',
  },
  'product-images': {
    Flow: ProductImagesFlow,
    status: 'available',
  },
  'video-creative': {
    Flow: VideoCreativeFlow,
    status: 'available',
  },
  /* stock-photos is a utility, not a wizard: no `projects` row, no
   * draft, no submit. The Flow ignores onCancel/onComplete because
   * there's nothing to cancel and no project id to navigate to on
   * completion. Global nav is via the sidebar. */
  'stock-photos': {
    Flow: StockPhotosFlow,
    status: 'available',
  },
  /* advertising-package is partially built: Phase 0 (size) and step 1
   * (settings) are real; steps 2 (offer) and 3 (images) render
   * placeholder panels until their product spec lands. Submit isn't
   * wired yet — listed available because the chrome is navigable. */
  'advertising-package': {
    Flow: AdvertisingPackageFlow,
    status: 'available',
  },
});

export function getProjectFlow(typeId) {
  const entry = REGISTRY[typeId];
  if (!entry || entry.status !== 'available') return null;
  const meta = getProjectType(typeId);
  return { ...entry, meta };
}

export function isProjectFlowRoutable(typeId) {
  return Boolean(getProjectFlow(typeId));
}
