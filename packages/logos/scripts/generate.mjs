/**
 * Builds src/index.json — the lightweight search index — from the committed
 * catalog:
 *   - data/brands.json         → title, slug, brand color
 *   - svgs/<slug>.svg          → brand symbol (required)
 *   - svgs/<slug>-wordmark.svg → full logotype (optional)
 *
 * The index intentionally excludes SVG markup: apps load the .svg files on
 * demand (the web app serves them as static assets). To add a brand, drop
 * the files in svgs/, add an entry to data/brands.json, and re-run this
 * script (or use the import:* scripts to pull from external catalogs).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgsDir = join(packageRoot, 'svgs');
const brands = JSON.parse(
  readFileSync(join(packageRoot, 'data', 'brands.json'), 'utf8'),
);

const index = [];
const missing = [];
let wordmarks = 0;

for (const brand of brands) {
  if (!existsSync(join(svgsDir, `${brand.slug}.svg`))) {
    missing.push(brand.slug);
    continue;
  }
  const hasWordmark = existsSync(join(svgsDir, `${brand.slug}-wordmark.svg`));
  if (hasWordmark) wordmarks += 1;
  index.push({
    title: brand.title,
    slug: brand.slug,
    hex: brand.hex,
    hasWordmark,
  });
}

index.sort((a, b) => a.title.localeCompare(b.title, 'en'));
writeFileSync(
  join(packageRoot, 'src', 'index.json'),
  `${JSON.stringify(index, null, 2)}\n`,
);

console.log(`Indexed ${index.length} logos (${wordmarks} with wordmarks)`);
if (missing.length > 0) {
  console.warn(`Missing svgs/<slug>.svg for: ${missing.join(', ')}`);
}
