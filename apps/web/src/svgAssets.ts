/**
 * Maps every catalog SVG to a static asset URL at build time. Vite emits
 * each file as its own asset, so the page only downloads the SVGs that
 * actually render (the grid uses <img loading="lazy">) — the markup itself
 * is fetched on demand when copying or downloading.
 */
const SVGS_DIR = '../../../packages/logos/svgs';

const urlByPath = import.meta.glob('../../../packages/logos/svgs/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export type Variant = 'symbol' | 'wordmark';

export function svgUrl(slug: string, variant: Variant): string | undefined {
  const file = variant === 'wordmark' ? `${slug}-wordmark.svg` : `${slug}.svg`;
  return urlByPath[`${SVGS_DIR}/${file}`];
}

export async function fetchSvgText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  return response.text();
}
