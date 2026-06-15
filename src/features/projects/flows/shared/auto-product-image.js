import { creativeImagesApi } from '@features/projects/flows/campaign-creative/api/creative-images.api';

/* Auto product-image generation.
 *
 * Used by the image-dispatching wizards (campaign-creative,
 * advertising-package) when the user clicks "Generate" without picking
 * a product image. Composes a professional product-photo prompt from
 * the wizard draft + brand context and calls the existing AI image
 * endpoint with no reference (the backend supports text-only since
 * the reference-optional change).
 *
 * The helper returns the standard wizard image entry shape
 * (`{ url, path, source }`) so callers can patch it straight into
 * `draft.images[0]` without translation. `source: 'ai-auto'` makes
 * the provenance visible in the project record and distinguishes
 * these from user-driven AI generations (`source: 'ai'`).
 *
 * This module is the single, self-contained insertion point for the
 * "no-image submit" behaviour: if the product reverses course, deleting
 * this file + restoring the gate in the two contexts is the entire
 * rollback.
 */

const PROMPT_MAX = 1800;

/** Build the Gemini prompt for an auto-generated product photo. */
export function buildAutoProductPrompt({ draft, brand }) {
  const productName = draft?.itemName?.trim() ?? '';
  const description = draft?.brief?.trim() ?? '';
  const brandName = brand?.name?.trim() ?? '';
  const brandDescription = brand?.description?.trim() ?? '';

  const lines = [
    'Create a single photorealistic, high-resolution product photograph',
    'suitable as an e-commerce or marketing hero asset.',
    '',
  ];
  if (productName) lines.push(`Product: ${productName}`);
  if (description) lines.push(`Description: ${description}`);
  if (brandName) {
    lines.push(
      brandDescription
        ? `Brand: ${brandName} — ${brandDescription}`
        : `Brand: ${brandName}`,
    );
  }
  lines.push(
    '',
    'Show one product, isolated, in a clean professional studio setting',
    'with soft diffused lighting and a neutral / minimal background.',
    'No people, no overlay text, no logos. The product should fill the',
    'frame and look ready for a brand\'s product detail page.',
  );

  return lines.join('\n').slice(0, PROMPT_MAX);
}

/**
 * Generate a product image automatically via the existing AI endpoint.
 * Returns the wizard image-entry shape on success.
 */
export async function generateAutoProductImage({ draft, brand }) {
  const prompt = buildAutoProductPrompt({ draft, brand });
  const { data, error } = await creativeImagesApi.generateAiImage({ prompt });

  if (error) return { data: null, error };
  if (!data?.url) {
    return {
      data: null,
      error: { message: 'יצירת תמונת המוצר האוטומטית לא החזירה תמונה' },
    };
  }

  return {
    data: { url: data.url, path: data.path, source: 'ai-auto' },
    error: null,
  };
}
