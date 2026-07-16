/**
 * Generates src/logos.json from the simple-icons package (CC0-1.0).
 * Only the curated slugs below are included, keeping the web bundle small.
 * Slugs missing from the installed simple-icons version are skipped with a warning.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as icons from 'simple-icons';

const CURATED_SLUGS = [
  // Tech giants & platforms
  'apple', 'google', 'meta', 'netflix', 'nvidia', 'intel', 'amd',
  'samsung', 'sony', 'lg', 'xiaomi', 'huawei', 'dell', 'hp', 'lenovo', 'asus',
  'sap', 'salesforce', 'shopify', 'paypal', 'stripe', 'square',
  'ebay', 'aliexpress', 'alibabadotcom', 'mercadopago',
  // Social & communication
  'x', 'instagram', 'facebook', 'whatsapp', 'telegram', 'discord', 'slack',
  'tiktok', 'youtube', 'twitch', 'reddit', 'pinterest', 'snapchat', 'threads',
  'bluesky', 'mastodon', 'signal', 'messenger', 'wechat', 'line', 'zoom',
  'googlemeet', 'tumblr', 'medium', 'substack', 'quora',
  // Dev tools & languages
  'github', 'gitlab', 'bitbucket', 'git', 'javascript', 'typescript', 'python',
  'rust', 'go', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'c', 'cplusplus',
  'react', 'vuedotjs', 'angular', 'svelte', 'astro', 'nextdotjs', 'nuxt',
  'remix', 'vite', 'webpack', 'nodedotjs', 'deno', 'bun', 'npm', 'pnpm', 'yarn',
  'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'githubactions',
  'vercel', 'netlify', 'cloudflare', 'heroku', 'digitalocean', 'firebase',
  'supabase', 'mongodb', 'mysql', 'postgresql', 'sqlite', 'redis', 'graphql',
  'prisma', 'tailwindcss', 'bootstrap', 'sass', 'html5', 'css', 'eslint',
  'prettier', 'jest', 'vitest', 'cypress', 'storybook', 'electron', 'flutter',
  'ionic', 'expo', 'android', 'linux', 'ubuntu', 'debian', 'fedora', 'archlinux',
  'freebsd', 'gnome', 'kdeplasma', 'raspberrypi', 'arduino', 'wordpress',
  'drupal', 'joomla', 'ghost', 'strapi', 'contentful', 'sanity',
  // AI
  'anthropic', 'claude', 'openai', 'googlegemini', 'ollama', 'huggingface',
  'perplexity', 'mistralai',   // Design & productivity
  'figma', 'sketch', 'framer', 'canva', 'blender', 'dribbble', 'behance',
  'notion', 'obsidian', 'evernote', 'trello', 'asana', 'jira', 'confluence',
  'linear', 'clickup', 'miro', 'airtable', 'zapier', 'ifttt', 'googledrive',
  'dropbox', 'box', 'googledocs', 'googlesheets', 'googleslides', 'googlecalendar',
  'gmail', 'protonmail', 'thunderbird', 'intellijidea', 'webstorm', 'pycharm',
  'zedindustries', 'neovim', 'vim', 'sublimetext', 'replit', 'codepen',
  'codesandbox', 'stackoverflow', 'stackblitz', 'postman', 'insomnia', 'swagger',
  // Entertainment & media
  'spotify', 'soundcloud', 'applemusic', 'tidal', 'shazam',
  'appletv', 'hbomax', 'crunchyroll', 'vimeo', 'dailymotion',
  'steam', 'epicgames', 'playstation', 'riotgames',
  'ea', 'ubisoft', 'rockstargames', 'unity', 'unrealengine', 'godotengine',
  'itchdotio', 'roblox', 'leagueoflegends', 'valorant', 'fortnite',
  // Transport, delivery & travel
  'uber', 'lyft', 'deliveroo', 'ubereats', 'doordash', 'ifood',
  'glovo', 'airbnb', 'bookingdotcom', 'expedia', 'tripadvisor', 'trivago',
  'ryanair', 'emirates', 'lufthansa', 'americanairlines', 'unitedairlines', 'delta',
  'tesla', 'bmw', 'audi', 'porsche', 'ferrari', 'lamborghini',
  'toyota', 'honda', 'ford', 'chevrolet', 'volkswagen', 'volvo', 'nissan',
  'hyundai', 'kia', 'peugeot', 'renault', 'fiat', 'jeep', 'subaru', 'mazda',
  'mclaren', 'astonmartin', 'bugatti', 'rollsroyce', 'bentley',   'ducati', 'suzuki', 'yamahamotorcorporation',
  // Finance & crypto
  'visa', 'mastercard', 'americanexpress', 'nubank', 'revolut', 'wise', 'n26',
  'chase', 'bankofamerica', 'hsbc', 'barclays', 'coinbase', 'binance', 'bitcoin',
  'ethereum', 'solana', 'dogecoin', 'litecoin', 'monero', 'klarna', 'venmo',
  'cashapp', 'westernunion', 'robinhood',
  // Retail, food & consumer brands
  'mcdonalds', 'burgerking', 'kfc', 'starbucks',   'cocacola', 'redbull', 'monster', 'carrefour', 'walmart', 'target',
  'lidl', 'aldinord', 'ikea', 'zara', 'uniqlo', 'nike',
  'adidas', 'puma', 'newbalance', 'reebok', 'underarmour', 'fila',
  // News, education & orgs
  'wikipedia', 'cnn', 'theguardian',   'duolingo', 'coursera', 'udemy', 'khanacademy', 'edx', 'ted',
  'unitednations', 'nasa', 'spacex',   'mozilla', 'linuxfoundation', 'wikimediafoundation', 'creativecommons',
  'opensourceinitiative', 'letsencrypt', 'torproject',
  // Browsers & misc tech
  'googlechrome', 'firefox', 'safari', 'brave', 'opera', 'arc', 'duckduckgo',
  'vlcmediaplayer', 'obsstudio', 'audacity', 'gimp',
  'inkscape', 'krita', 'davinciresolve', 'kdenlive',   '7zip', 'qbittorrent', 'transmission', 'nordvpn', 'protonvpn',
  'tailscale', 'wireguard', 'openvpn', '1password', 'bitwarden', 'lastpass',
  'authy', 'yubico', 'twilio', 'sendgrid', 'mailchimp', 'hubspot', 'zendesk',
  'intercom', 'datadog', 'grafana', 'prometheus', 'sentry', 'elastic',
  'snowflake', 'databricks', 'looker', 'jupyter',
  'anaconda', 'numpy', 'pandas', 'pytorch', 'tensorflow', 'scikitlearn',
  'kaggle', 'arxiv', 'orcid', 'zenodo',
];

const bySlug = new Map(
  Object.values(icons)
    .filter((icon) => icon && typeof icon === 'object' && 'slug' in icon)
    .map((icon) => [icon.slug, icon]),
);

const logos = [];
const skipped = [];

for (const slug of CURATED_SLUGS) {
  const icon = bySlug.get(slug);
  if (!icon) {
    skipped.push(slug);
    continue;
  }
  logos.push({
    title: icon.title,
    slug: icon.slug,
    hex: icon.hex,
    svg: icon.svg,
  });
}

logos.sort((a, b) => a.title.localeCompare(b.title, 'en'));

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'logos.json');
writeFileSync(outPath, `${JSON.stringify(logos, null, 2)}\n`);

console.log(`Wrote ${logos.length} logos to src/logos.json`);
if (skipped.length > 0) {
  console.warn(`Skipped ${skipped.length} slugs not found in simple-icons: ${skipped.join(', ')}`);
}
