/**
 * Imports company logos from BrandBird's free SVG logo collection
 * (https://www.brandbird.app/tools/svg-company-logos). The page HTML is the
 * catalog index: it embeds one URL per file on a public GCS bucket, split
 * into Logomark/ (symbols) and Logotypes/ (full logotypes).
 *
 * Unlike the other importers, this one REPLACES existing artwork by design —
 * BrandBird carries the current official marks — except for the slugs in
 * KEEP_CURRENT (e.g. Google apps already on the 2026 redesign). Brands not
 * in the catalog yet are added, with typos in BrandBird's file names fixed
 * via TITLE_FIXES and cross-source matches resolved via SLUG_ALIASES.
 *
 * Run `pnpm generate` afterwards to rebuild logos.json.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const PAGE_URL = 'https://www.brandbird.app/tools/svg-company-logos';
const USER_AGENT = 'EasyLogo/0.1 (https://github.com/mateusvillain/easy-logo)';

// Brands whose current artwork must not be replaced.
const KEEP_CURRENT = new Set([
  // Google apps already updated to the 2026 icon redesign
  'gmail', 'googlecalendar', 'googlechat', 'googledocs', 'googledrive',
  'googlemeet', 'googlesheets', 'googleslides', 'googleforms', 'googlekeep',
  'googlesites', 'googletasks', 'googlevids', 'googlevoice',
]);

// BrandBird entries not worth importing (outdated or discontinued brands).
const SKIP = new Set([
  'Twitter', 'Twitter Ads', // pre-X bird branding; the catalog has X
  'Cron', // rebranded as Notion Calendar
  'Editor', 'Editor X', // Wix Editor X was discontinued
  'Star+', // shut down in 2024
  'Pocket', // shut down in 2025
]);

// BrandBird name → existing catalog slug, when normalization can't match.
const SLUG_ALIASES = {
  '1Pasdword': '1password',
  'AWS (Amazon Web Services)': 'aws',
  'Square Cash': 'cashapp',
  'Mercadolibre': 'mercadolivre',
  'Mozilla Firefox': 'firefox',
  'OneDrive': 'microsoftonedrive',
};

// BrandBird name → display title, for typos and casing.
const TITLE_FIXES = {
  'Ahref': 'Ahrefs',
  'Musicxmatch': 'Musixmatch',
  'AOL Search': 'AOL',
  'Vix': 'ViX',
  'Mega': 'MEGA',
};

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgsDir = join(packageRoot, 'svgs');
const brandsPath = join(packageRoot, 'data', 'brands.json');
const brands = JSON.parse(readFileSync(brandsPath, 'utf8'));
const bySlug = new Map(brands.map((b) => [b.slug, b]));

const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const byNormTitle = new Map();
for (const brand of brands) {
  byNormTitle.set(normalize(brand.title), brand);
  byNormTitle.set(brand.slug, brand);
}

function extractHex(svg) {
  const six = svg.match(/#([0-9a-fA-F]{6})\b/);
  if (six) return six[1].toUpperCase();
  const three = svg.match(/#([0-9a-fA-F]{3})\b/);
  if (three) return three[1].split('').map((c) => c + c).join('').toUpperCase();
  return '000000';
}

function ensureViewBox(svg) {
  const tag = svg.match(/<svg[^>]*/)[0];
  if (tag.includes('viewBox')) return svg;
  const w = tag.match(/width="([\d.]+)(px)?"/);
  const h = tag.match(/height="([\d.]+)(px)?"/);
  if (!w || !h) return svg;
  return svg.replace(/<svg/, `<svg viewBox="0 0 ${w[1]} ${h[1]}"`);
}

async function download(url) {
  const response = await fetch(encodeURI(url), { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const svg = (await response.text()).trim();
  if (!svg.includes('<svg')) throw new Error('not an SVG');
  return ensureViewBox(svg);
}

const page = await fetch(PAGE_URL, { headers: { 'User-Agent': USER_AGENT } });
if (!page.ok) throw new Error(`page fetch failed: HTTP ${page.status}`);
const html = await page.text();

const urls = [...new Set(
  html.match(/https:\/\/storage\.googleapis\.com\/brandbird\/assets\/company-logos\/(?:Logomark|Logotypes)\/[^"]+\.svg/g) ?? [],
)];
if (urls.length === 0) throw new Error('no logo URLs found in page — layout may have changed');

const catalog = new Map();
for (const url of urls) {
  const file = decodeURIComponent(url.split('/').pop());
  const name = file.replace(/ (Logomark|Logotype)\.svg$/, '');
  const kind = /Logotype\.svg$/.test(file) ? 'logotype' : 'logomark';
  if (!catalog.has(name)) catalog.set(name, {});
  catalog.get(name)[kind] = url;
}
console.log(`BrandBird catalog: ${catalog.size} brands (${urls.length} files)\n`);

let added = 0;
let replaced = 0;

for (const [name, files] of [...catalog.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (SKIP.has(name)) continue;

  const aliasSlug = SLUG_ALIASES[name];
  const existing = aliasSlug ? bySlug.get(aliasSlug) : byNormTitle.get(normalize(name));
  if (existing && KEEP_CURRENT.has(existing.slug)) continue;

  const title = TITLE_FIXES[name] ?? name;
  const slug = existing ? existing.slug : normalize(title);

  try {
    let symbol;
    if (files.logomark) {
      symbol = await download(files.logomark);
    } else if (!existing && files.logotype) {
      symbol = await download(files.logotype); // wordmark-only brand
    }
    if (symbol) writeFileSync(join(svgsDir, `${slug}.svg`), `${symbol}\n`);

    if (files.logotype && files.logomark) {
      writeFileSync(join(svgsDir, `${slug}-wordmark.svg`), `${await download(files.logotype)}\n`);
    }

    const svgOnDisk = readFileSync(join(svgsDir, `${slug}.svg`), 'utf8');
    if (existing) {
      existing.hex = extractHex(svgOnDisk);
      replaced += 1;
    } else {
      const record = { slug, title, hex: extractHex(svgOnDisk) };
      brands.push(record);
      bySlug.set(slug, record);
      byNormTitle.set(normalize(title), record);
      added += 1;
      console.log(`added: ${title}`);
    }
  } catch (error) {
    console.warn(`Skipping ${name}: ${error.message}`);
  }
}

brands.sort((a, b) => a.title.localeCompare(b.title, 'en'));
writeFileSync(brandsPath, `${JSON.stringify(brands, null, 2)}\n`);

console.log(`\nAdded ${added} brands, replaced artwork for ${replaced}`);
