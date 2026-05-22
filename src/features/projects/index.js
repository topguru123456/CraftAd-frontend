export { ProjectCreationLauncher } from './components/ProjectCreationLauncher';
export { ProjectTypesGrid } from './components/ProjectTypesGrid';
export { ProjectTypeCard } from './components/ProjectTypeCard';
export {
  PROJECT_TYPES,
  PROJECT_TYPES_BY_ID,
  PROJECT_BADGE_TONES,
  getProjectType,
} from './config/project-types.config';

/* Per-type creation flows. Each one owns its own folder under
 * `flows/` so as the catalogue grows, no single file balloons. */
export { CampaignCreativeFlow } from './flows/campaign-creative/CampaignCreativeFlow';
export { CopywritingFlow } from './flows/copywriting/CopywritingFlow';
export { getProjectFlow, isProjectFlowRoutable } from './flows/shared';
export { useVariantSync } from './hooks/useVariantSync';
