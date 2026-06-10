import { creativeGenerationsApi } from '@features/projects/flows/campaign-creative/api/creative-generations.api';
import { copywritingGenerationsApi } from '@features/projects/flows/copywriting/api/copywriting-generations.api';
import { videoGenerationsApi } from '@features/projects/flows/video-creative/api/video-generations.api';

/* Service-type output dispatch.
 *
 * Two distinct concerns live here:
 *   1. Which OUTPUT kind a service type produces (image / text / video).
 *      Drives what surface the project-list card renders (image
 *      thumbnail / text preview / video poster) and which API to hit
 *      for that surface.
 *   2. How to FETCH and SUMMARIZE the variants for a given project so
 *      the card has something to show without each caller re-doing the
 *      branching.
 *
 * Single source of truth — adding a new service type is a one-line
 * entry below plus the upstream API client.
 *
 * Default for unknown serviceType is `image` because every legacy /
 * unknown row in the DB pre-cleanup was campaign-creative-shaped;
 * assuming `image` keeps the historical UI working without a fallback
 * that looks like an error.
 */

const OUTPUT_KIND = Object.freeze({
  'campaign-creative':  'image',
  'inspired-creation':  'image',
  'product-images':     'image',
  'copywriting-ads':    'text',
  'video-creative':     'video',
  // Future service types — uncomment as the flows land:
  // 'stock-photos':        'image',
  // 'advertising-package': 'image',
  // 'landing-copy':        'text',
  // 'social-posts':        'text',
});

export function getServiceOutputKind(serviceType) {
  return OUTPUT_KIND[serviceType] ?? 'image';
}

/* Fetch variants for the project's output table. Returns the api
 * client's standard `{ data, error }` shape so callers can surface
 * errors uniformly. */
export async function fetchProjectVariants(serviceType, projectId) {
  const kind = getServiceOutputKind(serviceType);
  if (kind === 'text') {
    return copywritingGenerationsApi.listByProject(projectId);
  }
  if (kind === 'video') {
    return videoGenerationsApi.listByProject(projectId);
  }
  return creativeGenerationsApi.listByProject(projectId);
}

/* Image flows dispatch in batches of VARIANTS_PER_CLICK. The project
 * card's stacked-thumbnail visual wants one representative image per
 * "create" click, not per variant — so we sample one ready variant per
 * batch (cap at MAX_STACK so the visual stays legible). */
const VARIANTS_PER_BATCH = 3;
const MAX_STACK = 3;

/* Build a preview descriptor from the variant list. Returns a
 * discriminated union the card can switch on:
 *   { kind: 'image', url: string | null, urls: string[] }
 *   { kind: 'text',  text: string | null }
 *   { kind: 'video', posterUrl: string | null, videoUrl: string | null }
 *
 * `url`  — first ready image (back-compat for callers that still want a
 *          single preview).
 * `urls` — up to MAX_STACK ready images sampled at one per dispatch
 *          batch, used by the project card's stacked thumbnail. Always
 *          present (possibly empty) so callers don't need to null-check
 *          before mapping.
 *
 * Caller decides how to render `null` slots (placeholder + type icon,
 * etc.). For video the `posterUrl` is what the card thumbnail uses;
 * `videoUrl` is included so a future "play preview on hover" UX could
 * use it without a re-fetch. */
export function pickPreviewFromVariants(serviceType, variants) {
  const list = Array.isArray(variants) ? variants : [];
  const kind = getServiceOutputKind(serviceType);

  if (kind === 'text') {
    const firstReady = list.find((v) => v.status === 'ready' && v.adText);
    return { kind: 'text', text: firstReady?.adText ?? null };
  }

  if (kind === 'video') {
    const firstReady = list.find((v) => v.status === 'ready' && v.videoUrl);
    return {
      kind: 'video',
      posterUrl: firstReady?.posterUrl ?? null,
      videoUrl: firstReady?.videoUrl ?? null,
    };
  }

  // Image — keep all ready variants in order, then take one per batch
  // (every Nth, where N = VARIANTS_PER_BATCH) so each visible stack
  // layer corresponds to a separate "create" click.
  const ready = list.filter((v) => v.status === 'ready' && v.imageUrl);
  const urls = [];
  for (let i = 0; i < ready.length && urls.length < MAX_STACK; i += VARIANTS_PER_BATCH) {
    urls.push(ready[i].imageUrl);
  }
  return {
    kind: 'image',
    url: ready[0]?.imageUrl ?? null,
    urls,
  };
}
