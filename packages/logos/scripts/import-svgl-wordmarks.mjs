/**
 * Imports full logotypes (wordmarks) from the svgl catalog (https://svgl.app)
 * for brands already present in data/brands.json, saving them as
 * svgs/<slug>-wordmark.svg. Matching is done by normalized brand title.
 *
 * This is a maintenance tool: it never overwrites an existing wordmark file.
 * Run `pnpm generate` afterwards to rebuild logos.json.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const API_URL = 'https://api.svgl.app';
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgsDir = join(packageRoot, 'svgs');
const brands = JSON.parse(
  readFileSync(join(packageRoot, 'data', 'brands.json'), 'utf8'),
);

// Brands whose simple-icons title differs from the svgl title.
const TITLE_ALIASES = {
  x: 'twitter',
  claude: 'claude ai',
  googlegemini: 'gemini',
};

function normalize(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pickRoute(routeOrTheme) {
  if (typeof routeOrTheme === 'string') return routeOrTheme;
  // Prefer the light-theme asset: previews sit on light card tiles.
  return routeOrTheme?.light ?? routeOrTheme?.dark;
}

const response = await fetch(API_URL);
if (!response.ok) {
  throw new Error(`svgl API request failed: ${response.status}`);
}
const catalog = await response.json();

const wordmarkByTitle = new Map();
for (const entry of catalog) {
  const url = pickRoute(entry.wordmark);
  if (url) wordmarkByTitle.set(normalize(entry.title), url);
}

let written = 0;
const matched = [];

for (const brand of brands) {
  const outPath = join(svgsDir, `${brand.slug}-wordmark.svg`);
  if (existsSync(outPath)) continue;

  const key = normalize(TITLE_ALIASES[brand.slug] ?? brand.title);
  const url = wordmarkByTitle.get(key);
  if (!url) continue;

  const svgResponse = await fetch(url.startsWith('/') ? `https://svgl.app${url}` : url);
  if (!svgResponse.ok) {
    console.warn(`Failed to download wordmark for ${brand.slug}: ${svgResponse.status}`);
    continue;
  }
  const svg = await svgResponse.text();
  // Accept files with an XML prolog/doctype before the root <svg> element.
  if (!svg.includes('<svg')) {
    console.warn(`Skipping ${brand.slug}: response is not an SVG`);
    continue;
  }
  writeFileSync(outPath, `${svg.trimEnd()}\n`);
  written += 1;
  matched.push(brand.slug);
}

console.log(`Wrote ${written} wordmark files: ${matched.join(', ')}`);
