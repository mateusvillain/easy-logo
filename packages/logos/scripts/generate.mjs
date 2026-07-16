/**
 * Builds src/logos.json from the committed catalog:
 *   - data/brands.json        → title, slug, brand color
 *   - svgs/<slug>.svg         → brand symbol (required)
 *   - svgs/<slug>-wordmark.svg → full logotype (optional)
 *
 * The .svg files in svgs/ are the source of truth. To add a brand, drop the
 * files there, add an entry to data/brands.json, and re-run this script
 * (or use the import:* scripts to pull from simple-icons / svgl).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgsDir = join(packageRoot, 'svgs');
const brands = JSON.parse(
  readFileSync(join(packageRoot, 'data', 'brands.json'), 'utf8'),
);

const logos = [];
const missing = [];
let wordmarks = 0;

for (const brand of brands) {
  const symbolPath = join(svgsDir, `${brand.slug}.svg`);
  if (!existsSync(symbolPath)) {
    missing.push(brand.slug);
    continue;
  }
  const logo = {
    title: brand.title,
    slug: brand.slug,
    hex: brand.hex,
    svg: readFileSync(symbolPath, 'utf8').trim(),
  };
  const wordmarkPath = join(svgsDir, `${brand.slug}-wordmark.svg`);
  if (existsSync(wordmarkPath)) {
    logo.wordmarkSvg = readFileSync(wordmarkPath, 'utf8').trim();
    wordmarks += 1;
  }
  logos.push(logo);
}

logos.sort((a, b) => a.title.localeCompare(b.title, 'en'));
writeFileSync(
  join(packageRoot, 'src', 'logos.json'),
  `${JSON.stringify(logos, null, 2)}\n`,
);

console.log(`Wrote ${logos.length} logos (${wordmarks} with wordmarks) to src/logos.json`);
if (missing.length > 0) {
  console.warn(`Missing svgs/<slug>.svg for: ${missing.join(', ')}`);
}
