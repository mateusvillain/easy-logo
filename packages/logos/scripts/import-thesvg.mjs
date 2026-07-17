/**
 * Imports curated icons from the thesvg npm package (https://thesvg.org)
 * into the repository. Uses the colored `default` variant as the symbol
 * and the `wordmark` variant when requested.
 *
 * thesvg declares a license per icon. CC0/MIT/Apache icons import
 * silently; anything else (e.g. "Trademark") logs a warning but is still
 * imported — entries here are curated deliberately, and all brand marks
 * in this catalog are used for identification only regardless of the
 * file license (see the README trademark note).
 *
 * Entries: { source, slug, title, wordmark?, replace? }
 *   source   thesvg slug
 *   replace  overwrite the existing svg and refresh the brand hex —
 *            used to update outdated artwork (default: never overwrite)
 *
 * Run `pnpm generate` afterwards to rebuild logos.json.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const thesvg = require('thesvg');

const QUIET_LICENSES = new Set(['CC0-1.0', 'MIT', 'Apache-2.0']);

const WANTED = [
  // Google apps — 2026 icon redesign. Replaces the pre-2026 artwork.
  { source: 'gmail-2026', slug: 'gmail', title: 'Gmail', replace: true },
  { source: 'google-calendar-2026', slug: 'googlecalendar', title: 'Google Calendar', replace: true },
  { source: 'google-chat-2026', slug: 'googlechat', title: 'Google Chat', replace: true },
  { source: 'google-docs-2026', slug: 'googledocs', title: 'Google Docs', replace: true },
  { source: 'google-drive-2026', slug: 'googledrive', title: 'Google Drive', replace: true },
  { source: 'google-meet-2026', slug: 'googlemeet', title: 'Google Meet', replace: true },
  { source: 'google-sheets-2026', slug: 'googlesheets', title: 'Google Sheets', replace: true },
  { source: 'google-slides-2026', slug: 'googleslides', title: 'Google Slides', replace: true },
  { source: 'google-forms-2026', slug: 'googleforms', title: 'Google Forms' },
  { source: 'google-keep-2026', slug: 'googlekeep', title: 'Google Keep' },
  { source: 'google-sites-2026', slug: 'googlesites', title: 'Google Sites' },
  { source: 'google-tasks-2026', slug: 'googletasks', title: 'Google Tasks' },
  { source: 'google-vids-2026', slug: 'googlevids', title: 'Google Vids' },
  { source: 'google-voice-2026', slug: 'googlevoice', title: 'Google Voice' },
];

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgsDir = join(packageRoot, 'svgs');
const brandsPath = join(packageRoot, 'data', 'brands.json');
const brands = JSON.parse(readFileSync(brandsPath, 'utf8'));
const bySlug = new Map(brands.map((b) => [b.slug, b]));

const bySource = new Map(
  Object.values(thesvg)
    .filter((icon) => icon && typeof icon === 'object' && icon.slug)
    .map((icon) => [icon.slug, icon]),
);

let added = 0;
let replaced = 0;

for (const entry of WANTED) {
  const icon = bySource.get(entry.source);
  if (!icon) {
    console.warn(`Skipping ${entry.slug}: "${entry.source}" not found in thesvg`);
    continue;
  }
  if (!QUIET_LICENSES.has(icon.license)) {
    console.warn(`note: ${entry.source} is licensed "${icon.license}" — identification use only`);
  }

  const symbol = icon.variants?.default ?? icon.svg;
  const symbolPath = join(svgsDir, `${entry.slug}.svg`);
  const exists = existsSync(symbolPath);
  if (exists && !entry.replace) continue;
  writeFileSync(symbolPath, `${symbol.trim()}\n`);

  if (entry.wordmark && icon.variants?.wordmark) {
    const wordmarkPath = join(svgsDir, `${entry.slug}-wordmark.svg`);
    if (!existsSync(wordmarkPath)) {
      writeFileSync(wordmarkPath, `${icon.variants.wordmark.trim()}\n`);
    }
  }

  const brand = bySlug.get(entry.slug);
  if (brand) {
    brand.hex = icon.hex;
    replaced += 1;
  } else {
    const record = { slug: entry.slug, title: entry.title, hex: icon.hex };
    brands.push(record);
    bySlug.set(entry.slug, record);
    added += 1;
  }
}

brands.sort((a, b) => a.title.localeCompare(b.title, 'en'));
writeFileSync(brandsPath, `${JSON.stringify(brands, null, 2)}\n`);

console.log(`\nAdded ${added} brands, replaced artwork for ${replaced}`);
