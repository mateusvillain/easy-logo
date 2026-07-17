/**
 * Imports curated brands from the svgl catalog (https://svgl.app) into the
 * repository: symbol as svgs/<slug>.svg, wordmark (when svgl has one) as
 * svgs/<slug>-wordmark.svg, and metadata into data/brands.json. The brand
 * color is extracted from the first hex color found in the symbol.
 *
 * Entries are matched against svgl by normalized title. Optional overrides:
 *   [svglTitle, displayTitle?, slug?]
 *
 * This is a maintenance tool: it never overwrites existing files or brand
 * entries. Run `pnpm generate` afterwards to rebuild logos.json.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const API_URL = 'https://api.svgl.app';

const WANTED = [
  // Companies & platforms
  ['Microsoft'], ['Windows'], ['Microsoft Azure'], ['Microsoft Office'],
  ['Microsoft Excel'], ['Microsoft Word'], ['Microsoft PowerPoint'],
  ['Microsoft Teams'], ['Microsoft OneDrive'], ['Microsoft OneNote'],
  ['Microsoft SharePoint'], ['Microsoft Defender'], ['Microsoft Copilot'],
  ['Microsoft .NET', '.NET', 'dotnet'], ['Microsoft SQL Server'],
  ['PowerShell'], ['PowerToys'], ['Visual Studio Code'], ['Visual Studio'],
  ['Edge', 'Microsoft Edge', 'microsoftedge'], ['Bing'], ['Xbox'], ['Skype'],
  ['IBM'], ['Cisco'], ['Amazon Web Services', 'AWS', 'aws'], ['JetBrains'],
  ['Atlassian'], ['LinkedIn'], ['VK'], ['GoDaddy'], ['Hostgator'],
  ['TrustPilot'], ['Google Play'], ['Google Maps'], ['Google Cloud'],
  ['Google Analytics'], ['Google Chat'], ['Google Classroom'],
  ['Google Colaboratory', 'Google Colab', 'googlecolab'],
  ['Youtube Music', 'YouTube Music'], ['App Store'], ['Chromium'],
  ['Vivaldi'], ['Zen Browser'], ['Disney+', 'Disney+', 'disneyplus'],
  ['Hulu'], ['Prime video', 'Prime Video'], ['Kick'], ['Patreon'],
  ['Product Hunt'], ['Hashnode'], ['Devto', 'dev.to', 'devto'],
  ['daily.dev', 'daily.dev', 'dailydev'], ['Matrix'], ['Udacity'], ['Platzi'],
  ['Hack The Box'], ['Buy Me a Coffee'], ['AbacatePay'], ['Svgl', 'svgl'],
  // AI
  ['GitHub Copilot'], ['Cursor'], ['Windsurf'], ['Grok'], ['xAI'], ['Qwen'],
  ['DeepSeek'], ['Kimi'], ['Groq'], ['Cohere'], ['Together AI'],
  ['Stability AI'], ['Replicate'], ['Midjourney'], ['Runway'], ['Suno'],
  ['OpenRouter'], ['Sourcegraph'], ['Lovable'], ['v0'], ['Codex'], ['Manus'],
  ['Cerebras'], ['Gradio'], ['LangChain'], ['Model Context Protocol'],
  ['bolt', 'Bolt', 'bolt'],
  // Adobe
  ['Adobe'], ['Photoshop'], ['Illustrator'], ['InDesign'], ['Lightroom'],
  ['After Effects'], ['Premiere'], ['XD'], ['Dreamweaver'], ['Animate'],
  ['Audition'], ['Acrobat Reader'],
  // Design & productivity
  ['Penpot'], ['Pitch'], ['Photopea'], ['LottieFiles'], ['Affinity Designer'],
  ['Affinity Photo'], ['Affinity Publisher'], ['Calendly'],
  ['Cal.com', 'Cal.com', 'calcom'], ['Loom'], ['Webflow'], ['Todoist'],
  ['Raycast'], ['Warp'], ['Ghostty'], ['Monkeytype'],
  // Languages & formats
  ['Java'], ['Scala'], ['Julia'], ['R'], ['Zig'], ['Haskell'], ['Lua'],
  ['matlab', 'MATLAB'], ['Bash'], ['Solidity'], ['Fortran'],
  ['Cobol', 'COBOL'], ['Markdown'], ['JSON'],
  // Frameworks & libraries
  ['Laravel'], ['Django'], ['Flask'], ['FastAPI'], ['Spring'], ['NestJS'],
  ['Express.js'], ['Fastify'], ['jQuery'], ['Redux'], ['RxJS'], ['Three.js'],
  ['D3.js'], ['Chart.js'], ['Gatsby'], ['Ember'], ['Preact'],
  ['Solidjs', 'SolidJS'], ['Qwik'], ['Lit'], ['Hono'], ['Hugo'],
  ['Material UI'], ['Chakra UI'], ['Ant Design'], ['Radix UI'],
  ['shadcn/ui', 'shadcn/ui', 'shadcnui'], ['daisyUI'], ['Vuetify'],
  ['Headless UI'], ['Mantine'], ['Styled Components'], ['Tauri'],
  ['Playwright'], ['Jasmine'], ['Socket.IO'], ['Mermaid'], ['Motion'],
  ['React Router'], ['React Query'], ['TanStack'], ['SWR'], ['Pinia'],
  ['VueUse'], ['RedwoodJS'], ['Remotion'], ['Fresh'], ['Docusaurus'],
  ['WebKit'], ['tRPC'], ['Zod'], ['Drizzle ORM'], ['TypeORM'], ['Sequelize'],
  // Build tools & devtools
  ['Babel'], ['Esbuild'], ['SWC'], ['Parcel'], ['Turborepo'], ['Turbopack'],
  ['Nx'], ['Rspack'], ['PostCSS'], ['UnoCSS'], ['UV'], ['Biomejs', 'Biome', 'biome'],
  ['Homebrew'], ['Nuget'], ['Atom'], ['Emacs'], ['Eclipse IDE'], ['Qt'],
  ['Nginx'], ['WakaTime'], ['Ngrok'], ['Hoppscotch'], ['Home Assistant'],
  // Infra, data & services
  ['Railway'], ['Fly', 'Fly.io', 'flyio'], ['Render'], ['Pulumi'], ['cPanel'],
  ['Cloudinary'], ['hCaptcha'], ['Appwrite'], ['PostHog'],
  ['Plausible Analytics'], ['Algolia'], ['Resend'], ['Dub'],
  ['Lemon Squeezy'], ['PlanetScale'], ['Neon'], ['Upstash'], ['Turso'],
  ['Convex'], ['Pocketbase'], ['Surrealdb', 'SurrealDB'], ['MariaDB'],
  ['Qdrant'], ['Apache Kafka'], ['Keycloak'], ['Auth0'],
  ['Auth.js', 'Auth.js', 'authjs'], ['Clerk'], ['Better Auth'], ['WorkOS'],
  ['Discourse'], ['Mattermost'], ['MediaWiki'], ['Elementor'], ['Medusa'],
  ['Payload CMS'], ['Directus'], ['Storyblok'],
  // Crypto
  ['OpenSea'], ['MetaMask'], ['Trust Wallet'], ['Ton', 'TON'],
  ['Tron', 'TRON'], ['Polygon'], ['Tether'], ['XRP'], ['BNB'], ['Algorand'],
];

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const svgsDir = join(packageRoot, 'svgs');
const brandsPath = join(packageRoot, 'data', 'brands.json');
const brands = JSON.parse(readFileSync(brandsPath, 'utf8'));

function normalize(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pickRoute(routeOrTheme) {
  if (typeof routeOrTheme === 'string') return routeOrTheme;
  return routeOrTheme?.light ?? routeOrTheme?.dark;
}

function extractHex(svg) {
  const six = svg.match(/#([0-9a-fA-F]{6})\b/);
  if (six) return six[1].toUpperCase();
  const three = svg.match(/#([0-9a-fA-F]{3})\b/);
  if (three) return three[1].split('').map((c) => c + c).join('').toUpperCase();
  return '000000';
}

async function download(url) {
  const absolute = url.startsWith('/') ? `https://svgl.app${url}` : url;
  const response = await fetch(absolute);
  if (!response.ok) throw new Error(`${absolute}: HTTP ${response.status}`);
  const svg = await response.text();
  if (!svg.includes('<svg')) throw new Error(`${absolute}: not an SVG`);
  return svg.trimEnd();
}

const response = await fetch(API_URL);
if (!response.ok) throw new Error(`svgl API request failed: ${response.status}`);
const catalog = await response.json();

const byTitle = new Map();
for (const entry of catalog) {
  const key = normalize(entry.title);
  if (!byTitle.has(key)) byTitle.set(key, entry);
}

const existing = new Set(brands.flatMap((b) => [b.slug, normalize(b.title)]));
let added = 0;
let wordmarks = 0;
const notFound = [];

for (const [svglTitle, displayTitle, slugOverride] of WANTED) {
  const entry = byTitle.get(normalize(svglTitle));
  if (!entry) {
    notFound.push(svglTitle);
    continue;
  }
  const title = (displayTitle ?? entry.title).trim();
  const slug = slugOverride ?? normalize(title);
  if (existing.has(slug) || existing.has(normalize(title))) continue;

  const symbolPath = join(svgsDir, `${slug}.svg`);
  try {
    if (!existsSync(symbolPath)) {
      writeFileSync(symbolPath, `${await download(pickRoute(entry.route))}\n`);
    }
    const wordmarkUrl = pickRoute(entry.wordmark);
    const wordmarkPath = join(svgsDir, `${slug}-wordmark.svg`);
    if (wordmarkUrl && !existsSync(wordmarkPath)) {
      writeFileSync(wordmarkPath, `${await download(wordmarkUrl)}\n`);
      wordmarks += 1;
    }
  } catch (error) {
    console.warn(`Skipping ${slug}: ${error.message}`);
    continue;
  }

  const hex = extractHex(readFileSync(symbolPath, 'utf8'));
  brands.push({ slug, title, hex });
  existing.add(slug);
  existing.add(normalize(title));
  added += 1;
}

brands.sort((a, b) => a.title.localeCompare(b.title, 'en'));
writeFileSync(brandsPath, `${JSON.stringify(brands, null, 2)}\n`);

console.log(`Added ${added} brands (${wordmarks} with wordmarks)`);
if (notFound.length > 0) {
  console.warn(`Not found in svgl: ${notFound.join(', ')}`);
}
