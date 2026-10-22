import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { showFirstVisitWelcome } from '../dist/welcome.js';

const { parseHTML } = createRequire(import.meta.url)('linkedom');
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const nativeTimeout = globalThis.setTimeout;
const nativeClearTimeout = globalThis.clearTimeout;
const local = new Map(), session = new Map();
let blockedLocal = false, blockedSession = false, reduced = false;
const timers = new Map();
const key = 'kirti-welcome-seen-v1';
function fixture() {
  const { window, document } = parseHTML(html);
  const dialog = document.querySelector('#welcome');
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => {
    if (!dialog.open) return;
    dialog.open = false;
    dialog.dispatchEvent(new window.Event('close'));
  };
  const get = (storage, blocked) => ({
    getItem: key => { if (blocked()) throw new DOMException('Storage is restricted', 'SecurityError'); return storage.get(key) ?? null; },
    setItem: (key, value) => { if (blocked()) throw new DOMException('Storage is restricted', 'SecurityError'); storage.set(key, value); },
  });
  Object.assign(globalThis, {
    window, document,
    localStorage: get(local, () => blockedLocal), sessionStorage: get(session, () => blockedSession),
    matchMedia: () => ({ matches: reduced }),
    setTimeout: (callback, delay) => { timers.set(delay, callback); return delay; },
    clearTimeout: id => timers.delete(id),
  });
  return { window, dialog };
}
try {
  let { window, dialog } = fixture();
  assert.equal(showFirstVisitWelcome(), true);
  assert.equal(dialog.open, true);
  assert.equal(local.get(key), 'true', 'Visit is remembered before the animation completes');
  assert.equal(dialog.dataset.greeting, 'hello');
  assert.deepEqual([...dialog.querySelectorAll('.welcome-word')].map(word => word.textContent), ['hello', 'नमस्ते', 'bonjour', 'こんにちは', 'hola']);
  assert.equal(dialog.querySelector('.is-current').textContent, 'hello');
  for (const [delay, id, text, language] of [[1180, 'namaste', 'नमस्ते', 'hi'], [2360, 'bonjour', 'bonjour', 'fr'], [3540, 'konnichiwa', 'こんにちは', 'ja'], [4720, 'hola', 'hola', 'es']]) {
    timers.get(delay)();
    assert.equal(dialog.dataset.greeting, id);
    assert.equal(dialog.querySelectorAll('.is-current').length, 1);
    assert.equal(dialog.querySelector('.is-current').textContent, text);
    assert.equal(dialog.querySelector('.is-current').getAttribute('lang'), language);
  }
  timers.get(5900)();
  assert.equal(dialog.classList.contains('is-leaving'), true);
  timers.get(6400)();
  assert.equal(dialog.open, false);
  assert.equal(timers.size, 0);
  ({ dialog } = fixture());
  assert.equal(showFirstVisitWelcome(), false, 'A new page instance skips the intro after refresh');
  assert.notEqual(dialog.open, true);
  assert.equal(showFirstVisitWelcome({ replay: true }), true, 'Replay works without clearing the saved visit');
  assert.equal(showFirstVisitWelcome({ replay: true }), false, 'An open greeting cannot start overlapping timers');
  assert.equal(local.get(key), 'true');
  dialog.close();
  assert.equal(timers.size, 0);

  local.clear();
  ({ window, dialog } = fixture());
  const fontResolvers = [];
  document.fonts = { load: () => new Promise(resolve => fontResolvers.push(resolve)) };
  assert.equal(showFirstVisitWelcome(), true);
  assert.equal(dialog.querySelector('.is-current'), null, 'Lettering waits briefly for its fonts');
  dialog.querySelector('[data-dismiss-welcome]').dispatchEvent(new window.Event('click'));
  fontResolvers.forEach(resolve => resolve([]));
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.equal(dialog.open, false, 'Late font loading cannot reopen a dismissed greeting');
  assert.equal(timers.size, 0);

  local.clear();
  ({ window, dialog } = fixture());
  showFirstVisitWelcome();
  dialog.querySelector('[data-dismiss-welcome]').dispatchEvent(new window.Event('click'));
  assert.equal(dialog.open, false, 'Skip immediately dismisses the intro');
  assert.equal(timers.size, 0);

  local.clear();
  ({ window, dialog } = fixture());
  showFirstVisitWelcome();
  window.dispatchEvent(new window.Event('pagehide'));
  assert.equal(dialog.open, false, 'Leaving the page dismisses the intro');
  assert.equal(timers.size, 0);
  local.clear();
  ({ window, dialog } = fixture());
  showFirstVisitWelcome();
  dialog.dispatchEvent(new window.Event('cancel'));
  assert.equal(dialog.open, false, 'Escape dismisses the intro');
  assert.equal(timers.size, 0);

  local.clear(); reduced = true;
  fixture();
  assert.equal(showFirstVisitWelcome(), false, 'Reduced motion goes directly to the portfolio');
  assert.equal(local.get(key), 'true');
  ({ dialog } = fixture());
  assert.equal(showFirstVisitWelcome({ replay: true }), true, 'Explicit replay supports a still greeting with reduced motion');
  assert.equal(dialog.querySelector('.is-current').textContent, 'hello');
  assert.equal(timers.size, 0, 'Reduced-motion replay does not cycle or animate');
  dialog.close();
  reduced = false; local.clear(); blockedLocal = true;
  const warnings = [];
  const warn = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    ({ dialog } = fixture());
    assert.equal(showFirstVisitWelcome(), true, 'Session storage handles blocked persistent storage');
    assert.equal(session.get(key), 'true');
    dialog.close();
    fixture();
    assert.equal(showFirstVisitWelcome(), false, 'Session fallback also survives a refresh');
    session.clear(); blockedSession = true;
    fixture();
    assert.equal(showFirstVisitWelcome(), false, 'The intro is skipped if dismissal cannot be remembered');
    assert.ok(warnings.length > 0, 'Storage failures are reported');
  } finally { console.warn = warn; }
  assert.equal(timers.size, 0);
  console.log('Passed: five greetings with language tags, first-visit persistence, refresh, replay, skip, Escape, page exit, reduced motion, storage fallback, and timer cleanup.');
} finally {
  globalThis.setTimeout = nativeTimeout;
  globalThis.clearTimeout = nativeClearTimeout;
}
