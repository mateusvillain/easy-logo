/**
 * Imports curated brand logos from Wikimedia Commons into the repository.
 * For each file it validates the license via the Commons API — only
 * Public domain / CC0 files with no attribution requirement are accepted,
 * keeping the catalog compatible with this repo's CC0 license — then
 * downloads the original SVG and strips XML prolog/metadata noise.
 *
 * Entries: { file, slug, title, wordmarkFile? } — `file` is the Commons
 * file name without the "File:" prefix. When `wordmarkFile` is present it
 * is saved as svgs/<slug>-wordmark.svg. Use `wordmarkOnly: true` to add a
 * wordmark to a brand that already exists in data/brands.json.
 *
 * This is a maintenance tool: it never overwrites existing files or brand
 * entries. Run `pnpm generate` afterwards to rebuild logos.json.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const API_URL = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'EasyLogo/0.1 (https://github.com/mateusvillain/easy-logo)';
const FREE_LICENSES = new Set(['Public domain', 'CC0']);

const WANTED = [
  // Bancos e finanças
  { file: 'Banco Itaú logo.svg', slug: 'itau', title: 'Itaú' },
  { file: 'Banco Bradesco logo.svg', slug: 'bradesco', title: 'Bradesco' },
  { file: 'Banco do Brasil logo.svg', slug: 'bancodobrasil', title: 'Banco do Brasil' },
  { file: 'Caixa Econômica Federal logo 1997.svg', slug: 'caixa', title: 'Caixa' },
  { file: 'Banco santander logo.svg', slug: 'santander', title: 'Santander' },
  { file: 'Logo do banco Inter (2023).svg', slug: 'bancointer', title: 'Banco Inter' },
  { file: 'XP Inc. Logo.svg', slug: 'xp', title: 'XP Inc.' },
  { file: 'Btg-logo-blue.svg', slug: 'btgpactual', title: 'BTG Pactual' },
  { file: 'Logo do Banco Original.svg', slug: 'bancooriginal', title: 'Banco Original' },
  { file: 'Logo do Banco Bmg.svg', slug: 'bancobmg', title: 'Banco BMG' },
  { file: 'Nubank logo 2021.svg', slug: 'nubank', wordmarkOnly: true },
  // Varejo e consumo
  { file: 'Magalu (2019).svg', slug: 'magalu', title: 'Magalu', wordmarkFile: 'Magazine Luiza wordmark.svg' },
  { file: 'Lojas Americanas (2021).svg', slug: 'americanas', title: 'Americanas' },
  { file: 'Casas Bahia icon.svg', slug: 'casasbahia', title: 'Casas Bahia', wordmarkFile: 'Casas Bahia logo 2020.svg' },
  { file: 'Logotipo das Lojas Renner.svg', slug: 'lojasrenner', title: 'Lojas Renner' },
  { file: 'Natura logo.svg', slug: 'natura', title: 'Natura' },
  { file: 'Natura&Co.svg', slug: 'naturaco', title: 'Natura &Co' },
  { file: 'Logotipo do O Boticário.svg', slug: 'oboticario', title: 'O Boticário' },
  { file: 'Logotipo da Havaianas.svg', slug: 'havaianas', title: 'Havaianas' },
  { file: 'Logotipo da Garoto.svg', slug: 'garoto', title: 'Garoto' },
  { file: 'Logo-sadia.svg', slug: 'sadia', title: 'Sadia' },
  { file: 'Logotipo da Brahma (2025).svg', slug: 'brahma', title: 'Brahma' },
  { file: 'Skol logo 2015.svg', slug: 'skol', title: 'Skol' },
  { file: 'Topper Logo.svg', slug: 'topper', title: 'Topper' },
  { file: 'Logo da Óticas Carol.svg', slug: 'oticascarol', title: 'Óticas Carol' },
  { file: 'Extra 2023 st.svg', slug: 'extra', title: 'Extra' },
  { file: 'Logo unimed1.svg', slug: 'unimed', title: 'Unimed' },
  // Transporte e logística
  { file: 'Gol Linhas Aéreas Inteligentes logo (2015, without the slogan).svg', slug: 'gol', title: 'GOL Linhas Aéreas' },
  { file: 'Logo da Azul Linhas Aéreas Brasileiras.svg', slug: 'azul', title: 'Azul Linhas Aéreas' },
  { file: 'Latam-logo -v.svg', slug: 'latam', title: 'LATAM Airlines' },
  { file: 'Correios (2014).svg', slug: 'correios', title: 'Correios' },
  { file: 'Localiza logo 2022.svg', slug: 'localiza', title: 'Localiza' },
  { file: 'Ipiranga logo (2023).svg', slug: 'ipiranga', title: 'Ipiranga' },
  // Telecom e tecnologia
  { file: 'Vivo logo 2019.svg', slug: 'vivo', title: 'Vivo' },
  { file: 'Claro logo (2017).svg', slug: 'claro', title: 'Claro' },
  { file: 'Logo OI.svg', slug: 'oi', title: 'Oi' },
  { file: 'Intelbras wordmark.svg', slug: 'intelbras', title: 'Intelbras' },
  { file: 'Positivo wordmark.svg', slug: 'positivo', title: 'Positivo' },
];

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgsDir = join(packageRoot, 'svgs');
const brandsPath = join(packageRoot, 'data', 'brands.json');
const brands = JSON.parse(readFileSync(brandsPath, 'utf8'));
const bySlug = new Map(brands.map((b) => [b.slug, b]));

function cleanSvg(svg) {
  return svg
    .replace(/<\?xml[\s\S]*?\?>\s*/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>\s*/g, '')
    .replace(/<!--[\s\S]*?-->\s*/g, '')
    .replace(/<metadata[\s\S]*?<\/metadata>\s*/g, '')
    .trim();
}

function extractHex(svg) {
  const six = svg.match(/#([0-9a-fA-F]{6})\b/);
  if (six) return six[1].toUpperCase();
  const three = svg.match(/#([0-9a-fA-F]{3})\b/);
  if (three) return three[1].split('').map((c) => c + c).join('').toUpperCase();
  return '000000';
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Fetch with throttling and retry on 429, per Wikimedia API etiquette. */
async function politeFetch(url) {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await sleep(1000);
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (response.status !== 429) return response;
    await sleep(5000 * attempt);
  }
  throw new Error('rate limited (HTTP 429) after retries');
}

async function api(params) {
  const url = `${API_URL}?${new URLSearchParams({ format: 'json', ...params })}`;
  const response = await politeFetch(url);
  if (!response.ok) throw new Error(`Commons API: HTTP ${response.status}`);
  return response.json();
}

/** Returns the original file URL after validating the license, or throws. */
async function fetchFileInfo(file) {
  const data = await api({
    action: 'query',
    titles: `File:${file}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
  });
  const page = Object.values(data.query.pages)[0];
  if (!page?.imageinfo) throw new Error('file not found on Commons');
  const info = page.imageinfo[0];
  const metadata = info.extmetadata;
  const license = metadata.LicenseShortName?.value ?? 'unknown';
  const attribution = metadata.AttributionRequired?.value;
  if (!FREE_LICENSES.has(license) || attribution !== 'false') {
    throw new Error(`license not compatible with CC0: ${license} (attribution: ${attribution})`);
  }
  return info.url;
}

async function downloadSvg(file, outPath) {
  if (existsSync(outPath)) return false;
  const url = await fetchFileInfo(file);
  const response = await politeFetch(url);
  if (!response.ok) throw new Error(`download failed: HTTP ${response.status}`);
  const svg = cleanSvg(await response.text());
  if (!svg.includes('<svg')) throw new Error('response is not an SVG');
  writeFileSync(outPath, `${svg}\n`);
  return true;
}

let added = 0;
let wordmarks = 0;

for (const entry of WANTED) {
  try {
    if (entry.wordmarkOnly) {
      if (!bySlug.has(entry.slug)) throw new Error('brand not found for wordmarkOnly entry');
      if (await downloadSvg(entry.file, join(svgsDir, `${entry.slug}-wordmark.svg`))) {
        wordmarks += 1;
        console.log(`wordmark: ${entry.slug}`);
      }
      continue;
    }
    if (bySlug.has(entry.slug)) continue;

    await downloadSvg(entry.file, join(svgsDir, `${entry.slug}.svg`));
    if (entry.wordmarkFile) {
      await downloadSvg(entry.wordmarkFile, join(svgsDir, `${entry.slug}-wordmark.svg`));
      wordmarks += 1;
    }
    const hex = extractHex(readFileSync(join(svgsDir, `${entry.slug}.svg`), 'utf8'));
    const brand = { slug: entry.slug, title: entry.title, hex };
    brands.push(brand);
    bySlug.set(entry.slug, brand);
    added += 1;
    console.log(`added: ${entry.title}`);
  } catch (error) {
    console.warn(`Skipping ${entry.slug}: ${error.message}`);
  }
}

brands.sort((a, b) => a.title.localeCompare(b.title, 'en'));
writeFileSync(brandsPath, `${JSON.stringify(brands, null, 2)}\n`);

console.log(`\nAdded ${added} brands (${wordmarks} wordmark files)`);
