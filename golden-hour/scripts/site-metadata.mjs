import { profile, professionalSummary, site } from '../dist/profile.js';
import { escapeHtml as e } from '../dist/icons.js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function buildMetadata(publicUrl = site.url) {
  let base = null;
  if (publicUrl) {
    base = new URL(publicUrl);
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error('The public site URL must use HTTPS without credentials, a query, or a fragment.');
    if (!base.pathname.endsWith('/')) base.pathname += '/';
  }
  const name = profile.fullName || profile.name;
  const title = `${name} — ${profile.role} | React & TypeScript`;
  const description = `${name} is a ${profile.role} with ${profile.experience} years building accessible React and TypeScript applications for enterprise and financial services.`;
  const imageVersion = createHash('sha256').update(readFileSync(new URL('../dist/assets/og-image.png', import.meta.url))).digest('hex').slice(0, 12);
  const imagePath = `assets/og-image.png?v=${imageVersion}`;
  const image = base ? new URL(imagePath, base).href : imagePath;
  const imageAlt = `${name}, ${profile.role}. ${profile.experience} years of experience. React, TypeScript, and accessibility.`;
  const person = {
    '@type': 'Person', name, jobTitle: profile.role, description: professionalSummary,
    knowsAbout: ['React', 'TypeScript', 'JavaScript', 'Web accessibility', 'Component systems'],
  };
  if (base) person.url = base.href;
  if (!profile.contactIsDemo) {
    const social = [profile.linkedin, profile.github].filter(Boolean);
    if (social.length) person.sameAs = social;
  }
  const structuredData = {
    '@context': 'https://schema.org', '@type': 'ProfilePage', name: title, description,
    ...(base ? { url: base.href } : {}), mainEntity: person,
  };
  const meta = (key, value, attribute = 'name') => `<meta ${attribute}="${key}" content="${e(value)}">`;
  const tags = [
    `<title>${e(title)}</title>`, meta('description', description), meta('author', name),
    meta('robots', 'index, follow, max-image-preview:large'),
    ...(base ? [`<link rel="canonical" href="${e(base.href)}">`] : []),
    meta('og:type', 'website', 'property'), meta('og:locale', 'en_IN', 'property'),
    meta('og:site_name', `${name} · Portfolio`, 'property'), meta('og:title', title, 'property'),
    meta('og:description', description, 'property'),
    ...(base ? [meta('og:url', base.href, 'property')] : []),
    meta('og:image', image, 'property'), meta('og:image:type', 'image/png', 'property'),
    meta('og:image:width', '1200', 'property'), meta('og:image:height', '630', 'property'),
    meta('og:image:alt', imageAlt, 'property'), meta('twitter:card', 'summary_large_image'),
    meta('twitter:title', title), meta('twitter:description', description),
    meta('twitter:image', image), meta('twitter:image:alt', imageAlt),
    `<script type="application/ld+json">${JSON.stringify(structuredData).replaceAll('<', '\\u003c')}</script>`,
  ].join('\n  ');
  return { title, description, tags, structuredData, base };
}
