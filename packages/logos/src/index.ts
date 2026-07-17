import indexData from './index.json';

export interface Logo {
  /** Brand display name, e.g. "GitHub" */
  title: string;
  /** URL-safe identifier, e.g. "github" */
  slug: string;
  /** Brand color as a hex string without "#", e.g. "181717" */
  hex: string;
  /** Whether svgs/<slug>-wordmark.svg exists for this brand */
  hasWordmark: boolean;
}

export const logos: Logo[] = indexData;

/**
 * SVG markup is not bundled with the index. Apps load the files in
 * packages/logos/svgs/ on demand: `<slug>.svg` for the symbol and
 * `<slug>-wordmark.svg` for the full logotype.
 */
export function searchLogos(query: string): Logo[] {
  const normalized = query.trim().toLowerCase();
  if (normalized === '') return logos;
  return logos.filter(
    (logo) =>
      logo.title.toLowerCase().includes(normalized) ||
      logo.slug.includes(normalized),
  );
}
