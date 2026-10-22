import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { appearanceBootScript, appearancePreferences } from '../dist/appearance.js';
import { themes, modes, themeTokens } from '../dist/themes.js';

const { parseHTML } = createRequire(import.meta.url)('linkedom');
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const boot = html.match(/<!-- appearance-boot:start -->\s*<script>([\s\S]*?)<\/script>\s*<!-- appearance-boot:end -->/)?.[1];
assert.equal(boot, appearanceBootScript(), 'The head script is generated from the current appearance functions');
assert.ok(html.indexOf('<!-- appearance-boot:start -->') < html.indexOf('<link rel="stylesheet"'), 'Saved appearance is applied synchronously before CSS can paint the default palette');
assert.doesNotMatch(boot, /type="module"|import\(/, 'First paint does not wait for a module request');
function bootFixture(values, { blocked = false } = {}) {
  const { document } = parseHTML('<html><head><meta name="theme-color"></head><body></body></html>');
  const storage = new Map(Object.entries(values).map(([key, value]) => [`kirti-${key}`, value]));
  const warnings = [];
  const window = { localStorage: { getItem: key => { if (blocked) throw new Error('Storage denied'); return storage.get(key) ?? null; } } };
  runInNewContext(boot, { window, document, console: { warn: (...args) => warnings.push(args) } });
  return { root: document.documentElement, warnings, storage };
}
for (const theme of Object.keys(themes)) for (const mode of Object.keys(modes)) {
  const values = { theme, mode, glass: '56', tint: 'true' };
  const { root, storage } = bootFixture(values);
  assert.equal(root.dataset.theme, theme);
  assert.equal(root.dataset.mode, mode);
  assert.equal(root.dataset.tint, 'tinted');
  assert.equal(Number(root.style.getPropertyValue('--glass-opacity')), .56);
  for (const [token, value] of Object.entries(themeTokens(theme, mode))) assert.equal(root.style.getPropertyValue(token), value);
  assert.equal(root.querySelector('meta[name="theme-color"]').content, themes[theme][mode].wallpaper);
  assert.deepEqual(appearancePreferences((key, fallback = null) => storage.get(`kirti-${key}`) ?? fallback), { theme, mode, glass: 56, tinted: true }, 'The app and pre-paint bootstrap resolve the same settings');
  assert.deepEqual([...storage], Object.entries(values).map(([key, value]) => [`kirti-${key}`, value]), 'Refreshing does not overwrite the saved preference');
}
assert.equal(bootFixture({ theme: 'dusk' }).root.dataset.mode, 'dark', 'Legacy theme migration also runs before first paint');
assert.equal(bootFixture({ theme: 'unknown' }).root.dataset.theme, 'silver');
assert.equal(Number(bootFixture({ glass: '1000' }).root.style.getPropertyValue('--glass-opacity')), .95);
assert.equal(Number(bootFixture({ glass: 'invalid' }).root.style.getPropertyValue('--glass-opacity')), .72);
const blocked = bootFixture({}, { blocked: true });
assert.equal(blocked.root.dataset.theme, 'silver');
assert.equal(blocked.warnings.length, 1, 'A storage failure has one diagnostic and a usable default appearance');
console.log('Passed: pre-stylesheet first-paint appearance for all ten palettes/modes, matching app preferences, saved tint/depth, unchanged storage, legacy migration, invalid settings, and blocked storage.');
