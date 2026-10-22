import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { aboutView, desktopIdentity } from '../dist/views.js';
import { icon } from '../dist/icons.js';
import { buildMetadata } from './site-metadata.mjs';
import { appearanceBootScript } from '../dist/appearance.js';

const file = new URL('../dist/index.html', import.meta.url);
let html = readFileSync(file, 'utf8');
function replaceBlock(name, content) {
  const pattern = new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`);
  if (!pattern.test(html)) throw new Error(`Missing generated block: ${name}`);
  html = html.replace(pattern, () => `<!-- ${name}:start -->\n  ${content}\n  <!-- ${name}:end -->`);
}
const metadata = buildMetadata();
replaceBlock('seo', metadata.tags);
replaceBlock('appearance-boot', `<script>${appearanceBootScript()}</script>`);
const template = html.match(/<template id="window-template">([\s\S]*?)<\/template>/)?.[1];
if (!template) throw new Error('Missing window template');
const initialWindow = template.trim()
  .replace('class="portfolio-window" hidden role="region"', 'class="portfolio-window" id="window-about" data-prerendered="about" role="region" aria-label="About window" style="--window-width:1000px;--window-height:610px"')
  .replace('<h2 class="window-title"></h2>', '<h2 class="window-title">About</h2>')
  .replace('<span class="window-app-icon"></span>', `<span class="window-app-icon rose">${icon('person')}</span>`)
  .replace('aria-label="Search portfolio"></button>', `aria-label="Search portfolio">${icon('search')}</button>`)
  .replace('<div class="window-content"></div>', () => `<div class="window-content">${aboutView()}</div>`)
  .replaceAll('class="traffic close"', 'class="traffic close" aria-label="Close About window"')
  .replaceAll('class="traffic minimize"', 'class="traffic minimize" aria-label="Minimize About window"')
  .replaceAll('class="traffic maximize"', 'class="traffic maximize" aria-label="Expand About window"');
replaceBlock('initial-profile', initialWindow);
replaceBlock('desktop-identity', desktopIdentity());
writeFileSync(file, html);
const sitemap = new URL('../dist/sitemap.xml', import.meta.url);
if (metadata.base) {
  writeFileSync(sitemap, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${metadata.base.href.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</loc></url></urlset>\n`);
} else if (existsSync(sitemap)) unlinkSync(sitemap);
writeFileSync(new URL('../dist/robots.txt', import.meta.url), `User-agent: *\nAllow: /\n${metadata.base ? `\nSitemap: ${new URL('sitemap.xml', metadata.base).href}\n` : ''}`);
console.log(`Updated metadata and initial HTML.${metadata.base ? ' Canonical URL and sitemap configured.' : ' Public URL is unset; canonical URL and sitemap will be generated when it is supplied.'}`);
