import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { profile, professionalSummary, navigation, projects, experience, personalFolders } from '../dist/profile.js';
import { views, projectDetail } from '../dist/views.js';
import { buildMetadata } from './site-metadata.mjs';
import { aboutView } from '../dist/views.js';
import { personalFolderView, personalDetail } from '../dist/personal.js';

const root = fileURLToPath(new URL('../', import.meta.url));
for (const file of readdirSync(`${root}/dist`).filter(file => file.endsWith('.js'))) execFileSync(process.execPath, ['--check', `${root}/dist/${file}`]);
for (const entry of navigation) assert.equal(typeof views[entry.id], 'function', `${entry.id} has a view`);
for (const [id, render] of Object.entries(views)) {
  const html = render();
  assert.match(html, /<h1[ >]/, `${id} has a main heading`);
  assert.doesNotMatch(html, /undefined|\[object Object\]/, `${id} has valid content`);
  for (const match of html.matchAll(/(?:src|href)="(assets\/[^"#]+)"/g)) assert.ok(existsSync(`${root}/dist/${match[1]}`), `${match[1]} exists`);
}
assert.equal(new Set(navigation.map(item => item.id)).size, navigation.length);
assert.equal(new Set(projects.map(item => item.id)).size, projects.length);
assert.equal(projects.length, 5);
assert.equal(experience.length, 3);
assert.equal(profile.experience, '8+');
assert.match(professionalSummary, /8\+ years/);
for (const project of projects) assert.ok(projectDetail(project.id).includes(project.title));
for (const folder of personalFolders) {
  assert.match(personalFolderView(folder.id), /<h1[ >]/);
  if (folder.sample) assert.match(personalFolderView(folder.id), /Sample content/);
  for (const entry of folder.entries) assert.ok(personalDetail(`${folder.id}/${entry.id}`).includes(entry.title));
}
for (const logo of readdirSync(`${root}/dist/assets/brands`).filter(file => file.endsWith('.svg'))) assert.doesNotMatch(readFileSync(`${root}/dist/assets/brands/${logo}`, 'utf8'), /<script|<foreignObject|onload=|href="https?:/i, `${logo} is a self-contained image`);
const index = readFileSync(`${root}/dist/index.html`, 'utf8');
for (const match of index.matchAll(/(?:src|href)="((?:assets\/|\.\/)?[^"#:]+\.(?:css|js|svg|webp|pdf|txt))"/g)) assert.ok(existsSync(`${root}/dist/${match[1]}`), `${match[1]} exists`);
for (const link of [profile.linkedin, profile.github].filter(Boolean)) assert.equal(new URL(link).protocol, 'https:');
assert.ok(readFileSync(`${root}/dist/assets/kirti-resume.pdf`).subarray(0,5).equals(Buffer.from('%PDF-')));
assert.doesNotMatch(index, /sidebar|♡|♥|7\+ years/);
assert.match(readFileSync(`${root}/dist/assets/kirti-resume.txt`, 'utf8'), /8\+ years/);
const metadata = buildMetadata();
assert.ok(index.includes(metadata.tags), 'Generated metadata is current');
assert.ok(index.includes(aboutView()), 'Readable initial HTML matches the interactive profile');
assert.ok(index.includes('application/ld+json'));
if (profile.contactIsDemo) assert.equal(metadata.structuredData.mainEntity.sameAs, undefined, 'Dummy contacts do not enter structured data');
assert.equal(metadata.structuredData.mainEntity.name, profile.fullName || profile.name);
const publicMetadata = buildMetadata('https://portfolio.example.test');
assert.match(publicMetadata.tags, /rel="canonical" href="https:\/\/portfolio.example.test\/"/);
assert.match(publicMetadata.tags, /property="og:image" content="https:\/\/portfolio.example.test\/assets\/og-image.png"/);
assert.match(publicMetadata.tags, /property="og:url"/);
assert.throws(() => buildMetadata('http://portfolio.example.test'));
assert.throws(() => buildMetadata('https://portfolio.example.test/#appearance'));
const png = readFileSync(`${root}/dist/assets/og-image.png`);
assert.equal(png.toString('hex', 0, 8), '89504e470d0a1a0a');
assert.equal(png.readUInt32BE(16), 1200);
assert.equal(png.readUInt32BE(20), 630);
assert.match(readFileSync(`${root}/dist/robots.txt`, 'utf8'), /User-agent: \*\nAllow: \//);
console.log(`Passed: JavaScript syntax, ${Object.keys(views).length} portfolio views, ${personalFolders.length} personal folders and their entries, 5 projects, navigation, local brand assets, résumé content, initial HTML, social metadata, structured data, canonical URL generation, and the 1200×630 Open Graph image.`);
