import logosData from './logos.json';

export interface Logo {
  /** Brand display name, e.g. "GitHub" */
  title: string;
  /** URL-safe identifier, e.g. "github" */
  slug: string;
  /** Brand color as a hex string without "#", e.g. "181717" */
  hex: string;
  /** Full standalone SVG markup (24x24 viewBox) */
  svg: string;
}

export const logos: Logo[] = logosData;

export function searchLogos(query: string): Logo[] {
  const normalized = query.trim().toLowerCase();
  if (normalized === '') return logos;
  return logos.filter(
    (logo) =>
      logo.title.toLowerCase().includes(normalized) ||
      logo.slug.includes(normalized),
  );
}
