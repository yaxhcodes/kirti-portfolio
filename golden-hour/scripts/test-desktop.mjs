import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { profile } from '../dist/profile.js';
import { aboutView } from '../dist/views.js';
import { initialSection } from '../dist/routing.js';
import { resizeBounds } from '../dist/window-resizer.js';
import { FolderLayout } from '../dist/folder-layout.js';
import { WidgetLayout } from '../dist/widget-layout.js';
import { themes, modes, themeTokens, resolveAppearance } from '../dist/themes.js';

const { parseHTML } = createRequire(import.meta.url)('linkedom');
const { window, document } = parseHTML(readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8'));
const stylesheet = document.createElement('style');
// An embedded style element has no external-sheet encoding declaration.
stylesheet.textContent = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8').replace(/^@charset[^;]+;/, '');
document.head.append(stylesheet);
assert.ok(stylesheet.sheet.cssRules.length > 150, 'Stylesheet parses, including responsive rules');
function luminance(hex) {
  const rgb = hex.trim().replace('#', '').match(/../g).map(channel => parseInt(channel, 16) / 255);
  return rgb.map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
}
function contrast(first, second) {
  const [dark, light] = [luminance(first), luminance(second)].sort((a, b) => a - b);
  return (light + .05) / (dark + .05);
}
const rgbHex = rgb => '#' + rgb.map(value => Math.round(value).toString(16).padStart(2, '0')).join('');
const mix = (first, second, weight) => first.map((channel, index) => channel * weight + second[index] * (1 - weight));
const fromHex = hex => hex.replace('#', '').match(/../g).map(channel => parseInt(channel, 16));
for (const mode of Object.keys(modes)) {
  const selector = mode === 'light' ? ':root' : ':root[data-mode="dark"]';
  const rule = [...stylesheet.sheet.cssRules].find(item => item.selectorText === selector);
  assert.ok(rule, `${mode} has shared surface and text rules`);
  for (const [theme, palette] of Object.entries(themes)) {
    const variant = palette[mode];
    const background = '#' + variant.panel.split(',').map(channel => Number(channel.trim()).toString(16).padStart(2, '0')).join('');
    for (const token of ['--ink', '--muted', '--faint']) {
      assert.ok(contrast(rule.style.getPropertyValue(token), background) >= 4.5, `${theme}/${mode} ${token} has readable text contrast`);
    }
    assert.ok(contrast(variant.accent, background) >= 4.5, `${theme}/${mode} links have readable contrast`);
    const selectionInk = mode === 'light' ? '#ffffff' : rule.style.getPropertyValue('--ink');
    assert.ok(contrast(selectionInk, mode === 'light' ? variant.accent : variant.soft) >= 4.5, `${theme}/${mode} selected text stays readable`);
    const panel = variant.panel.split(',').map(Number);
    const opacity = .73 + .35 * .08;
    const rootOpacity = .12 + .35 * .12;
    const backing = mode === 'light' ? [0, 0, 0] : [255, 255, 255];
    const glassBody = rgbHex(mix(panel, mix(panel, backing, rootOpacity), opacity));
    for (const token of ['--ink', '--muted', '--faint']) assert.ok(contrast(rule.style.getPropertyValue(token), glassBody) >= 4.5, `${theme}/${mode} ${token} stays readable on the least opaque glass body`);
    const link = rgbHex(mix(fromHex(variant.accent), mode === 'light' ? [0, 0, 0] : [255, 255, 255], mode === 'light' ? .8 : .9));
    assert.ok(contrast(link, glassBody) >= 4.5, `${theme}/${mode} links stay readable on translucent content`);
  }
}
const defaultRule = [...stylesheet.sheet.cssRules].find(item => item.selectorText === ':root');
for (const [token, value] of Object.entries(themeTokens('silver', 'light'))) assert.equal(defaultRule.style.getPropertyValue(token).trim(), value, 'The initial CSS matches the default palette');
assert.deepEqual(resolveAppearance('pearl'), { theme: 'silver', mode: 'light' });
assert.deepEqual(resolveAppearance('dusk'), { theme: 'silver', mode: 'dark' });
assert.deepEqual(resolveAppearance('sage', 'dark'), { theme: 'sage', mode: 'dark' });
assert.deepEqual(resolveAppearance('missing', 'missing'), { theme: 'silver', mode: 'light' });
const storage = new Map([['kirti-welcome-seen-v1', 'true'], ['kirti-tint', 'true']]);
let clock = 1000;
let audioPulses = 0;
let animationCount = 0;
let reduceMotion = false;
let frameId = 0;
const cancelledFrames = new Set();
const localUrl = new URL('http://localhost:4173/#appearance');
for (const hash of ['', '#appearance', '#missing']) assert.equal(initialSection(hash), 'about');
for (const id of ['contact', 'work', 'resume']) assert.equal(initialSection(`#${id}`), id);

class TestAudioContext {
  constructor() { this.state = 'suspended'; this.currentTime = 0; this.destination = {}; }
  async resume() { this.state = 'running'; }
  createOscillator() {
    const source = { frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {}, start() { audioPulses++; }, stop() { queueMicrotask(() => source.onended?.()); } };
    return source;
  }
  createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
}

Object.assign(globalThis, {
  window, document, HTMLImageElement: window.HTMLImageElement, innerWidth: 1440, innerHeight: 900,
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  location: localUrl,
  history: { pushState: (_, __, url) => { localUrl.href = new URL(url, localUrl).href; }, replaceState: (_, __, url) => { localUrl.href = new URL(url, localUrl).href; } },
  matchMedia: query => ({ get matches() { return query.includes('hover') ? true : reduceMotion; } }),
  requestAnimationFrame: callback => {
    const id = ++frameId;
    queueMicrotask(() => { if (!cancelledFrames.has(id)) { clock += 16; callback(clock); } });
    return id;
  },
  cancelAnimationFrame: id => cancelledFrames.add(id),
  getComputedStyle: () => ({ paddingLeft: '10', getPropertyValue: name => name === '--folder-gap' ? String(innerHeight <= 430 ? 6 : innerHeight <= 560 ? 8 : 12) : [...stylesheet.sheet.cssRules].find(rule => rule.selectorText === '.desktop-folders')?.style.getPropertyValue(name) || '' }),
});
Object.defineProperty(globalThis, 'performance', { value: { now: () => clock }, configurable: true });
window.AudioContext = TestAudioContext;
window.HTMLCanvasElement.prototype.getContext = () => null;
Object.defineProperty(document, 'activeElement', { value: null, writable: true });
window.HTMLElement.prototype.focus = function () { document.activeElement = this; this.dispatchEvent(new window.Event('focusin', { bubbles: true })); };
window.HTMLElement.prototype.setPointerCapture = function () {};
window.HTMLElement.prototype.getBoundingClientRect = function () {
  const box = (left, top, width, height) => ({ x: left, y: top, left, top, right: left + width, bottom: top + height, width, height });
  if (this.id === 'window-layer' || this.id === 'desktop-folders' || this.id === 'desktop-widgets' || this.classList.contains('desktop-widgets')) return box(0, 33, innerWidth, innerHeight - 33);
  if (this.id === 'profile-widget') {
    if (innerWidth < 320 || innerHeight <= 450) return box(0, 0, 0, 0);
    const compact = innerWidth <= 540 || innerHeight <= 560;
    return box(parseFloat(this.style.left) || (compact ? 16 : 24), 33 + (parseFloat(this.style.top) || (compact ? 16 : 24)), compact ? 176 : 218, compact ? 214 : 248);
  }
  if (this.classList.contains('desktop-folder')) {
    const height = innerHeight <= 430 ? 76 : innerHeight <= 560 ? 92 : 108;
    const gap = innerHeight <= 430 ? 6 : innerHeight <= 560 ? 8 : 12;
    return box(parseFloat(this.style.left) || innerWidth - 118, 33 + (parseFloat(this.style.top) || 24 + Number(this.style.getPropertyValue('--folder-index')) * (height + gap)), 96, height);
  }
  if (this.classList.contains('portfolio-window')) {
    const mobile = innerWidth <= 760, expanded = this.classList.contains('expanded');
    const custom = this.classList.contains('has-custom-size') && !mobile && !expanded;
    const declaredWidth = parseFloat(this.style.getPropertyValue('--window-width')) || 1000;
    const declaredHeight = parseFloat(this.style.getPropertyValue('--window-height')) || 640;
    const width = expanded ? innerWidth - 24 : mobile ? innerWidth - 24 : custom ? declaredWidth : Math.min(declaredWidth, innerWidth - (innerWidth <= 1100 ? 190 : 200));
    const height = expanded ? innerHeight - 141 : mobile ? innerHeight - 139 : custom ? declaredHeight : Math.min(declaredHeight, innerHeight - 165);
    const translate = this.style.transform?.match(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/);
    const left = expanded || mobile ? 12 : custom ? parseFloat(this.style.getPropertyValue('--window-left')) : (innerWidth - width) / 2 - 64;
    const top = expanded ? 45 : mobile ? 48 : custom ? 33 + parseFloat(this.style.getPropertyValue('--window-top')) : 79;
    return box(left + Number(translate?.[1] || 0), top + Number(translate?.[2] || 0), width, height);
  }
  const dockItems = [...document.querySelectorAll('#dock .dock-item')];
  const widths = dockItems.map(button => parseFloat(button.style.width) || 57);
  const dockWidth = widths.reduce((sum, value) => sum + value, 0) + 63;
  const dockLeft = (innerWidth - dockWidth) / 2;
  if (this.id === 'dock' || this.classList.contains('dock-item') || this.classList.contains('dock-icon')) {
    let width = dockWidth, left = dockLeft;
    if (this.id !== 'dock') {
      const button = this.classList.contains('dock-item') ? this : this.parentElement;
      const index = dockItems.indexOf(button);
      width = widths[index];
      left += 11 + widths.slice(0, index).reduce((sum, value) => sum + value, 0) + index * 4 + (index >= 5 ? 17 : 0);
      if (this.classList.contains('dock-icon')) { left += (width - 45) / 2; width = 45; }
    }
    return { x: left, y: innerHeight - 80, left, top: innerHeight - 80, right: left + width, bottom: innerHeight - 18, width, height: 62 };
  }
  const width = Number.parseFloat(this.style.getPropertyValue('--window-width')) || 55;
  const height = Math.min(Number.parseFloat(this.style.getPropertyValue('--window-height')) || 62, innerHeight - 165);
  const left = this.classList.contains('portfolio-window') ? (innerWidth - width) / 2 : 300;
  const top = this.classList.contains('portfolio-window') ? 79 : innerHeight - 80;
  return { x: left, y: top, left, top, right: left + width, bottom: top + height, width, height };
};
window.HTMLElement.prototype.scrollIntoView = function () {};
window.HTMLElement.prototype.animate = function (frames) {
  animationCount++;
  assert.equal(frames.length, 49, 'Genie uses continuous sampled keyframes');
  assert.equal(frames[0].offset, 0);
  assert.equal(frames.at(-1).offset, 1);
  assert.ok(frames.every((frame, index) => index === 0 || frame.offset >= frames[index - 1].offset));
  const middle = frames[24].clipPath.match(/polygon\((.*)\)/)[1].split(',').map(point => point.trim().split(' ').map(parseFloat));
  assert.ok(middle[15][0] - middle[14][0] <= 6, 'The Genie tail narrows to a lean neck at mid-flight');
  assert.ok(middle.at(-1)[0] - middle[0][0] > 90, 'The upper window keeps its shape while the tail tapers');
  for (const frame of frames) {
    const points = frame.clipPath.match(/polygon\((.*)\)/)[1].split(',').map(point => point.trim().split(' ').map(parseFloat));
    for (let row = 0; row < 15; row++) assert.ok(points[row][0] <= points[29 - row][0], 'Tapered edges never cross');
  }
  return { finished: new Promise(resolve => setTimeout(resolve, 2)) };
};
for (const dialog of document.querySelectorAll('dialog')) {
  dialog.showModal = () => { dialog.open = true; dialog.setAttribute('open', ''); };
  dialog.close = () => {
    if (!dialog.open) return;
    dialog.open = false;
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new window.Event('close'));
  };
}

const errors = [];
const originalError = console.error;
console.error = (...args) => { errors.push(args); originalError(...args); };
const nativeInterval = globalThis.setInterval;
globalThis.setInterval = () => 0;
await import('../dist/app.js');
globalThis.setInterval = nativeInterval;

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const click = selector => {
  const element = $(selector);
  assert.ok(element, `Control exists: ${selector}`);
  clock += 100;
  element.dispatchEvent(new window.Event('click', { bubbles: true }));
};
const key = (element, value, modifiers = {}) => {
  const event = new window.Event('keydown', { bubbles: true, cancelable: true });
  Object.assign(event, { key: value, ...modifiers });
  element.dispatchEvent(event);
};
async function until(condition, message) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, 2));
  }
  assert.fail(message);
}
const open = async id => {
  click(`#dock [data-nav="${id}"]`);
  await until(() => $(`#window-${id}`)?.dataset.windowState === 'open' && $(`#window-${id}`).classList.contains('is-active'), `${id} opens and becomes active`);
};

await until(() => $('#window-about')?.dataset.windowState === 'open', 'Initial About window opens');
assert.equal($('#window-appearance'), null, 'An old settings URL does not reopen preferences on refresh');
assert.equal(location.hash, '#about');
assert.equal(document.documentElement.dataset.tint, 'tinted', 'Saved glass tint is restored at startup');
assert.equal($('#welcome').open, undefined, 'The intro stays closed on return visits');
assert.equal($$('[data-prerendered]').length, 0, 'The initial HTML window is adopted by the desktop');
assert.equal($$('#window-about').length, 1, 'Prerendered and interactive content are not duplicated');
assert.equal($('#sidebar'), null);
assert.match($('#window-about').textContent, /KIRTI JOSHI/);
assert.equal($$('.desktop-folder').length, 3);
assert.match($('#window-about').textContent, /8\+ years/);
assert.ok($('#window-about .portrait-placeholder'));
const configuredPortrait = profile.portrait;
assert.equal($('#window-about .portrait-image')?.getAttribute('src'), configuredPortrait || undefined);
profile.portrait = 'assets/portrait-example.webp';
const portraitFixture = document.createElement('div');
portraitFixture.innerHTML = aboutView();
document.body.append(portraitFixture);
assert.equal(portraitFixture.querySelector('.portrait-image').getAttribute('src'), 'assets/portrait-example.webp');
assert.equal(portraitFixture.querySelector('.portrait-image').getAttribute('alt'), profile.fullName || profile.name);
const originalWarn = console.warn;
const portraitWarnings = [];
console.warn = (...args) => portraitWarnings.push(args);
portraitFixture.querySelector('.portrait-image').dispatchEvent(new window.Event('error', { bubbles: true }));
console.warn = originalWarn;
assert.equal(portraitFixture.querySelector('.portrait-image'), null);
assert.equal(portraitFixture.querySelector('.portrait-frame').classList.contains('has-image'), false);
assert.equal(portraitWarnings.length, 1);
portraitFixture.remove();
profile.portrait = configuredPortrait;
assert.doesNotMatch(document.body.textContent, /♡|♥|little universe|lovely to have/);
const about = $('#window-about');
const hovered = $('#dock [data-nav="work"]');
const dockBeforeHover = $('#dock').getBoundingClientRect().width;
const hover = new window.Event('pointermove', { bubbles: true });
Object.assign(hover, { clientX: hovered.getBoundingClientRect().left + 28.5, pointerType: 'mouse' });
hovered.dispatchEvent(hover);
await until(() => Number(hovered.style.getPropertyValue('--dock-scale')) > 1.4, 'Hover magnifies the active dock icon');
assert.ok($('#dock').getBoundingClientRect().width > dockBeforeHover, 'Dock expands so neighboring icons are pushed outward');
assert.ok(Number($('#dock [data-nav="experience"]').style.getPropertyValue('--dock-scale')) > 1, 'Neighboring icons magnify too');
assert.equal($('#dock-tooltip').textContent, 'Selected work');
assert.equal($('#dock-tooltip').parentElement.id, 'dock', 'Tooltip is outside icon stacking contexts');
assert.ok(parseFloat($('#dock-tooltip').style.getPropertyValue('--tooltip-rise')) > 30, 'Tooltip clears the enlarged icon');
const tooltipRule = [...stylesheet.sheet.cssRules].find(rule => rule.selectorText === '.dock-tooltip');
assert.equal(tooltipRule.style.getPropertyValue('z-index'), '10', 'Tooltip is above all icons');
$('#dock').dispatchEvent(new window.Event('pointerleave'));
await until(() => hovered.style.width === '', 'Dock springs back to its original layout');
assert.equal($('#dock-tooltip').hidden, true);
key(document, 'Tab');
hovered.focus();
assert.equal($('#dock-tooltip').hidden, false, 'Keyboard focus also exposes the dock label');
assert.equal($('#dock-tooltip').textContent, 'Selected work');
document.dispatchEvent(new window.Event('pointerdown'));
assert.equal($('#dock-tooltip').hidden, true, 'Pointer use clears keyboard-only labels');
about.querySelector('.content-scroll').scrollTop = 137;
await open('experience');
assert.equal($$('.portfolio-window').length, 2);
assert.ok(about.isConnected);
await open('about');
assert.equal($('#window-about'), about);
assert.equal(about.querySelector('.content-scroll').scrollTop, 137);

await open('work');
click('#window-work [data-filter="Finance"]');
assert.equal($$('#window-work .project-card').length, 1);
const work = $('#window-work');
work.querySelector('.content-scroll').scrollTop = 81;
await open('skills');
await open('work');
assert.equal($('#window-work'), work);
assert.equal($$('#window-work .project-card').length, 1);
assert.equal(work.querySelector('.content-scroll').scrollTop, 81);

click('#window-skills .traffic.minimize');
await until(() => $('#window-skills').hidden, 'One window is minimized before showing the desktop');
const visibleBeforeDesktop = $$('.portfolio-window').filter(element => !element.hidden);
const activeBeforeDesktop = $('.portfolio-window.is-active');
const placementBeforeDesktop = visibleBeforeDesktop.map(element => [element.id, element.getBoundingClientRect(), element.style.zIndex]);
click('.desktop-button');
await until(() => $$('.portfolio-window').every(element => element.hidden), 'Show Desktop hides every visible window');
assert.equal($('.desktop-button').getAttribute('aria-pressed'), 'true');
assert.equal($('#desktop-widgets').inert, false);
assert.equal(document.activeElement, $('#desktop'));
click('.desktop-button');
await until(() => visibleBeforeDesktop.every(element => !element.hidden && element.dataset.windowState === 'open'), 'Restore returns the previously visible windows');
assert.equal($('#window-skills').hidden, true, 'Restore leaves an already minimized window alone');
assert.equal($('.portfolio-window.is-active'), activeBeforeDesktop, 'Restore returns focus to the previous front window');
assert.equal(work.querySelector('.content-scroll').scrollTop, 81, 'Show Desktop preserves content position and filters');
for (const [id, rect, stacking] of placementBeforeDesktop) {
  assert.deepEqual($(`#${id}`).getBoundingClientRect(), rect, 'Show Desktop preserves window geometry');
  assert.equal($(`#${id}`).style.zIndex, stacking, 'Show Desktop preserves stacking order');
}
click('.desktop-button');
click('.desktop-button');
await until(() => visibleBeforeDesktop.every(element => !element.hidden && element.dataset.windowState === 'open'), 'Rapid desktop toggle settles back into the visible state');
click('.desktop-button');
await until(() => $$('.portfolio-window').every(element => element.hidden), 'The desktop can be shown again');
await open('about');
assert.equal($('.desktop-button').getAttribute('aria-pressed'), 'false', 'Opening an app exits Show Desktop');
assert.equal($('#window-skills').hidden, true);
await open('work');

click('#window-experience .traffic.close');
await until(() => !$('#window-experience'), 'Closing removes only the requested window');
assert.ok($('#window-about') && $('#window-work') && $('#window-skills'));
assert.equal($('#dock [data-nav="experience"]').classList.contains('running'), false);
click('#window-work .traffic.minimize');
await until(() => work.hidden, 'Minimize hides the window');
assert.ok(work.isConnected);
assert.equal($('#dock [data-nav="work"]').classList.contains('window-minimized'), true);
await open('work');
assert.equal($('#window-work'), work);
assert.equal(work.querySelector('.content-scroll').scrollTop, 81);

click('#window-work .traffic.close');
click('#dock [data-nav="work"]');
await until(() => $('#window-work')?.dataset.windowState === 'open' && $('#window-work').classList.contains('is-active'), 'An immediate reopen wins over a pending close');
assert.equal($('#window-work'), work);
assert.equal($$('#window-work').length, 1);

click('#dock [data-nav="experience"]');
click('#dock [data-nav="contact"]');
await until(() => $('#window-experience')?.dataset.windowState === 'open' && $('#window-contact')?.dataset.windowState === 'open', 'Rapid opens both complete');
assert.equal($('.portfolio-window.is-active').dataset.windowId, 'contact');
about.dispatchEvent(new window.Event('pointerdown', { bubbles: true }));
assert.equal($('.portfolio-window.is-active'), about);
const toolbar = about.querySelector('.window-toolbar');
toolbar.setPointerCapture = () => {};
const positionBeforeDrag = about.style.transform;
const otherPosition = $('#window-work').style.transform;
const pointer = (type, x, y) => {
  const event = new window.Event(type, { bubbles: true });
  Object.assign(event, { button: 0, pointerId: 1, clientX: x, clientY: y });
  toolbar.dispatchEvent(event);
};
pointer('pointerdown', 500, 200);
pointer('pointermove', 570, 235);
pointer('pointerup', 570, 235);
assert.notEqual(about.style.transform, positionBeforeDrag);
assert.equal($('#window-work').style.transform, otherPosition);
click('#window-about .traffic.maximize');
assert.equal(about.classList.contains('expanded'), true);
click('#window-about .traffic.maximize');
assert.equal(about.classList.contains('expanded'), false);

const resize = (element, direction, dx, dy) => {
  const handle = element.querySelector(`[data-resize="${direction}"]`);
  const rect = element.getBoundingClientRect();
  for (const [type, x, y] of [['pointerdown', rect.right, rect.bottom], ['pointermove', rect.right + dx, rect.bottom + dy], ['pointerup', rect.right + dx, rect.bottom + dy]]) {
    const event = new window.Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, { button: 0, pointerId: 7, clientX: x, clientY: y });
    handle.dispatchEvent(event);
  }
};
const beforeResize = about.getBoundingClientRect();
const otherWidth = work.style.getPropertyValue('--window-width');
resize(about, 'se', 100, 60);
assert.equal(about.getBoundingClientRect().width, beforeResize.width + 100, 'Dragging the corner grows width');
assert.equal(about.getBoundingClientRect().height, beforeResize.height + 60, 'Dragging the corner grows height');
assert.equal(about.getBoundingClientRect().left, beforeResize.left, 'Resizing the east edge does not shift the west edge');
assert.equal(work.style.getPropertyValue('--window-width'), otherWidth, 'Other windows keep their size');
const priorWest = about.getBoundingClientRect();
resize(about, 'nw', 60, 30);
assert.equal(about.getBoundingClientRect().right, priorWest.right);
assert.equal(about.getBoundingClientRect().bottom, priorWest.bottom);
const beforeKeyResize = about.getBoundingClientRect().width;
key(about.querySelector('[data-resize="se"]'), 'ArrowRight');
assert.equal(about.getBoundingClientRect().width, beforeKeyResize + 16, 'The focused resize handle supports keyboard resizing');
resize(about, 'w', 10000, 0);
assert.equal(about.getBoundingClientRect().width, 440, 'The window has a usable minimum width');
resize(about, 's', 0, 10000);
assert.ok(about.getBoundingClientRect().bottom <= innerHeight - 105, 'Resize stays above the dock');
const customRect = about.getBoundingClientRect();
click('#window-about .traffic.maximize');
click('#window-about .traffic.maximize');
assert.equal(about.getBoundingClientRect().width, customRect.width, 'Restore remembers a manually resized width');
assert.equal(about.getBoundingClientRect().height, customRect.height);
click('#window-about .traffic.minimize');
await until(() => about.hidden, 'A resized window can minimize');
await open('about');
assert.equal(about.getBoundingClientRect().width, customRect.width);
for (const direction of ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']) {
  const result = resizeBounds({ left: 200, top: 100, width: 600, height: 400 }, direction, -2000, -2000, { width: 1440, height: 900 });
  assert.ok(result.width >= 440 && result.height >= 300 && result.left >= 18 && result.top >= 43, `${direction} respects resize constraints`);
}

const interestsFolder = $('#desktop-folders [data-nav="interests"]');
const folderRect = interestsFolder.getBoundingClientRect();
assert.ok($$('.desktop-folder').every(folder => folder.getBoundingClientRect().width === folderRect.width && folder.getBoundingClientRect().height === folderRect.height), 'Desktop folders share one size');
assert.ok($$('.desktop-folder').every(folder => folder.getBoundingClientRect().left === folderRect.left), 'Default folders form one column');
const folderPointer = (type, x, y) => {
  const event = new window.Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { button: 0, pointerId: 9, clientX: x, clientY: y });
  interestsFolder.dispatchEvent(event);
};
folderPointer('pointerdown', folderRect.left + 30, folderRect.top + 30);
folderPointer('pointermove', folderRect.left - 70, folderRect.top + 90);
folderPointer('pointerup', folderRect.left - 70, folderRect.top + 90);
click('#desktop-folders [data-nav="interests"]');
assert.equal($('#window-interests'), null, 'Moving a folder does not accidentally open it');
assert.ok(JSON.parse(storage.get('kirti-folder-layout-v1')).interests.x < folderRect.left);
const firstSlot = JSON.parse(storage.get('kirti-folder-layout-v1')).interests;
assert.equal((folderRect.left - firstSlot.x) % (folderRect.width + 12), 0, 'Dropped folders align to grid columns');
assert.equal((firstSlot.y - 24) % (folderRect.height + 12), 0, 'Dropped folders align to grid rows');
key(interestsFolder, 'ArrowLeft', { shiftKey: true });
assert.equal(JSON.parse(storage.get('kirti-folder-layout-v1')).interests.x, firstSlot.x - folderRect.width - 12, 'Keyboard movement advances one grid column');
const moveFolderTo = (x, y) => {
  const rect = interestsFolder.getBoundingClientRect();
  folderPointer('pointerdown', rect.left + 20, rect.top + 20);
  folderPointer('pointermove', x + 20, y + 20);
  folderPointer('pointerup', x + 20, y + 20);
  click('#desktop-folders [data-nav="interests"]');
};
const readingFolder = $('#desktop-folders [data-nav="reading-list"]');
const readingSlot = readingFolder.getBoundingClientRect();
moveFolderTo(readingSlot.left, readingSlot.top);
assert.deepEqual(readingFolder.getBoundingClientRect(), readingSlot, 'Dropping onto another folder leaves that folder in place');
const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
assert.equal(overlaps(interestsFolder.getBoundingClientRect(), readingSlot), false, 'Occupied slots are skipped');
moveFolderTo(70, 100);
assert.equal(overlaps(interestsFolder.getBoundingClientRect(), $('#profile-widget').getBoundingClientRect()), false, 'Snapping reserves space for the profile widget');
innerWidth = 360;
for (const height of [450, 400]) {
  innerHeight = height;
  window.dispatchEvent(new window.Event('resize'));
  const compactFolders = $$('.desktop-folder').map(folder => folder.getBoundingClientRect());
  for (const rect of compactFolders) {
    assert.ok(rect.left >= 8 && rect.right <= innerWidth - 8 && rect.top >= 41 && rect.bottom <= innerHeight - 102, 'Resized layouts stay inside the desktop and above the dock');
  }
  for (let index = 0; index < compactFolders.length; index++) for (const sibling of compactFolders.slice(index + 1)) assert.equal(overlaps(compactFolders[index], sibling), false, 'Responsive snapping keeps folders apart');
}
innerWidth = 1440; innerHeight = 900;
window.dispatchEvent(new window.Event('resize'));
assert.equal(overlaps(interestsFolder.getBoundingClientRect(), $('#profile-widget').getBoundingClientRect()), false, 'Expanding the desktop keeps the widget clear');
const savedSlots = JSON.parse(storage.get('kirti-folder-layout-v1'));
const savedX = savedSlots.interests.x;
savedSlots.interests.x += 19;
savedSlots.interests.y += 14;
storage.set('kirti-folder-layout-v1', JSON.stringify(savedSlots));
const restoredFolders = $('#desktop-folders').cloneNode(true);
for (const folder of restoredFolders.querySelectorAll('.desktop-folder')) for (const property of ['left', 'top', 'right']) folder.style.removeProperty(property);
new FolderLayout(restoredFolders, { obstacles: () => [$('#profile-widget').getBoundingClientRect()] });
assert.equal(parseFloat(restoredFolders.querySelector('[data-nav="interests"]').style.left), savedX, 'Existing freeform saved positions migrate to the nearest grid slot');
assert.equal(parseFloat(restoredFolders.querySelector('[data-nav="interests"]').style.left), JSON.parse(storage.get('kirti-folder-layout-v1')).interests.x, 'Saved folder positions are restored by a new layout instance');
key(interestsFolder, 'ArrowLeft', { shiftKey: true });
assert.ok(interestsFolder.style.left);
click('[data-action="arrange-folders"]');
assert.equal(interestsFolder.style.left, '', 'Arrange folders restores the column');
assert.deepEqual(JSON.parse(storage.get('kirti-folder-layout-v1')), {});
key(interestsFolder, 'ArrowDown', { shiftKey: true });
assert.equal(JSON.parse(storage.get('kirti-folder-layout-v1')).interests.y, 24 + 3 * (folderRect.height + 12), 'Keyboard movement skips occupied slots in its direction');
click('[data-action="arrange-folders"]');
const widget = $('#profile-widget');
const widgetPointer = (type, x, y, pointerId = 12) => {
  const event = new window.Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { button: 0, pointerId, clientX: x, clientY: y });
  widget.dispatchEvent(event);
};
const widgetStart = widget.getBoundingClientRect();
widgetPointer('pointerdown', widgetStart.left + 40, widgetStart.top + 40);
widgetPointer('pointermove', widgetStart.left + 270, widgetStart.top + 180, 99);
assert.equal(widget.style.left, '24px', 'Other pointers cannot move an active widget gesture');
widgetPointer('pointermove', widgetStart.left + 270, widgetStart.top + 180);
widgetPointer('pointerup', widgetStart.left + 270, widgetStart.top + 180);
const savedWidget = JSON.parse(storage.get('kirti-widget-layout-v1'));
assert.equal((savedWidget.x - 24) % 12, 0, 'The widget snaps horizontally');
assert.equal((savedWidget.y - 24) % 12, 0, 'The widget snaps vertically');
assert.ok(savedWidget.x > 24);
const activeBeforeWidgetDrag = $('.portfolio-window.is-active');
click('#profile-widget');
assert.equal($('.portfolio-window.is-active'), activeBeforeWidgetDrag, 'Moving the widget does not open its About window');
key(widget, 'ArrowRight', { shiftKey: true });
assert.equal(JSON.parse(storage.get('kirti-widget-layout-v1')).x, savedWidget.x + 12, 'Keyboard placement advances on the same grid');
const widgetSavedRoot = $('#desktop-widgets').cloneNode(true);
document.body.append(widgetSavedRoot);
const restoredWidget = widgetSavedRoot.querySelector('.desktop-profile-widget');
restoredWidget.style.left = '24px'; restoredWidget.style.top = '24px';
new WidgetLayout(widgetSavedRoot, { obstacles: () => $$('.desktop-folder').map(folder => folder.getBoundingClientRect()) });
assert.equal(parseFloat(restoredWidget.style.left), savedWidget.x + 12, 'A new widget layout restores the saved position');
widgetSavedRoot.remove();
const beforeCollision = widget.getBoundingClientRect();
widgetPointer('pointerdown', beforeCollision.left + 30, beforeCollision.top + 30);
widgetPointer('pointermove', readingSlot.left + 30, readingSlot.top + 30);
widgetPointer('pointerup', readingSlot.left + 30, readingSlot.top + 30);
click('#profile-widget');
assert.ok($$('.desktop-folder').every(folder => !overlaps(widget.getBoundingClientRect(), folder.getBoundingClientRect())), 'The widget avoids folders when dropped');
innerWidth = 360; innerHeight = 700;
window.dispatchEvent(new window.Event('resize'));
const compactWidget = widget.getBoundingClientRect();
assert.ok(compactWidget.left >= 16 && compactWidget.right <= innerWidth - 16 && compactWidget.bottom <= innerHeight - 102, 'A saved widget position adapts to mobile bounds');
assert.ok($$('.desktop-folder').every(folder => !overlaps(compactWidget, folder.getBoundingClientRect())), 'Responsive widget placement keeps folders clear');
innerWidth = 1440; innerHeight = 900;
window.dispatchEvent(new window.Event('resize'));
click('#desktop-folders [data-nav="interests"]');
await until(() => $('#window-interests')?.dataset.windowState === 'open', 'The Interests folder opens its own window');
assert.match($('#window-interests').textContent, /Sample content/);
assert.equal($$('#window-interests .personal-file').length, 3);
click('[data-personal-item="interests/photography"]');
assert.equal($('#personal-dialog').open, true);
assert.match($('#personal-dialog').textContent, /sample interest/i);
click('#personal-dialog [data-close]');
for (const id of ['reading-list', 'snapshots']) {
  click(`#desktop-folders [data-nav="${id}"]`);
  await until(() => $(`#window-${id}`)?.dataset.windowState === 'open', `${id} opens independently`);
}
assert.equal($$('#window-snapshots .sample-art').length, 3);
click('#window-interests .traffic.minimize');
await until(() => $('#window-interests').hidden, 'Personal folders minimize into the Finder icon');
click('#desktop-folders [data-nav="interests"]');
await until(() => !$('#window-interests').hidden && $('#window-interests').dataset.windowState === 'open', 'Desktop folder restores its existing window');

globalThis.innerWidth = 390;
globalThis.innerHeight = 844;
window.dispatchEvent(new window.Event('resize'));
const mobileCustomWidth = about.style.getPropertyValue('--window-width');
resize(about, 'se', 100, 100);
assert.equal(about.style.getPropertyValue('--window-width'), mobileCustomWidth, 'Mobile uses fitted windows instead of edge resizing');
assert.ok($$('.portfolio-window.is-background').every(element => element.inert));
await open('contact');
assert.equal($$('#window-contact .contact-link').length, 3);
assert.equal($$('#window-contact .brand-logo').length, 2, 'LinkedIn and GitHub use official brand marks');
assert.match($('#window-contact').textContent, /kirti@example.com/);
assert.match($('#window-contact').textContent, /Sample contact details/);
assert.equal($('#window-contact').inert, false);
assert.ok($$('.portfolio-window.is-background').every(element => element.inert));

await open('appearance');
assert.equal(location.hash, '#contact', 'Settings does not replace the last portfolio section in the URL');
assert.equal($('.tint-switch').getAttribute('aria-checked'), 'true');
click('.tint-switch');
assert.equal(document.documentElement.dataset.tint, 'clear');
assert.equal(storage.get('kirti-tint'), 'false');
assert.equal($('.tint-switch').getAttribute('aria-checked'), 'false');
assert.equal($$('#window-appearance [data-theme]').length, 5);
for (const theme of Object.keys(themes)) {
  for (const mode of Object.keys(modes)) {
    click(`#window-appearance [data-theme="${theme}"]`);
    click(`#window-appearance [data-mode="${mode}"]`);
    assert.equal(document.documentElement.dataset.theme, theme);
    assert.equal(document.documentElement.dataset.mode, mode);
    assert.equal(document.documentElement.style.getPropertyValue('--panel'), themes[theme][mode].panel);
    assert.equal($$('#window-appearance [data-theme][aria-pressed="true"]').length, 1);
    assert.equal($$('#window-appearance [data-mode][aria-pressed="true"]').length, 1);
  }
}
assert.equal(storage.get('kirti-theme'), 'rosewood');
assert.equal(storage.get('kirti-mode'), 'dark');
assert.equal(document.documentElement.dataset.tint, 'clear', 'Theme selection is independent of tint');
click('.tint-switch');
assert.equal(document.documentElement.dataset.tint, 'tinted');
assert.equal(storage.get('kirti-tint'), 'true');
click('#window-appearance .traffic.close');
await until(() => !$('#window-appearance'), 'Appearance closes');
await open('appearance');
assert.equal($('.tint-switch').getAttribute('aria-checked'), 'true', 'New windows synchronize their tint control');
assert.equal($('#window-appearance [data-theme="rosewood"]').getAttribute('aria-pressed'), 'true');
assert.equal($('#window-appearance [data-mode="dark"]').getAttribute('aria-pressed'), 'true');
click('[data-action="replay-welcome"]');
assert.equal($('#welcome').open, true);
assert.equal($$('#welcome .welcome-word').length, 5, 'Replay opens the multilingual glass greeting');
click('[data-dismiss-welcome]');
assert.equal($('#welcome').open, false);
assert.equal(location.hash, '#contact', 'Replaying the greeting preserves the active section');
assert.equal(storage.get('kirti-welcome-seen-v1'), 'true', 'Replay does not reset the first-visit preference');
const range = $('[data-glass-range]');
range.value = '120';
range.dispatchEvent(new window.Event('input', { bubbles: true }));
assert.equal(range.getAttribute('aria-valuetext'), '95% frosted');
click('.sound-button');
assert.equal(document.body.dataset.sound, 'muted');
assert.equal(storage.get('kirti-muted'), 'true');
assert.equal($('.sound-switch').getAttribute('aria-checked'), 'false');
const silentCount = audioPulses;
await open('about');
assert.equal(audioPulses, silentCount);
await open('appearance');
click('.sound-switch');
await new Promise(resolve => setTimeout(resolve, 2));
assert.equal(document.body.dataset.sound, 'on');
assert.equal(storage.get('kirti-muted'), 'false');
assert.ok(audioPulses > silentCount);

key(document, 'k', { metaKey: true });
assert.equal($('#spotlight').open, true);
$('#spotlight-input').value = 'accessibility';
$('#spotlight-input').dispatchEvent(new window.Event('input', { bubbles: true }));
assert.equal($$('.search-result').length, 2);
key($('#spotlight-input'), 'ArrowDown');
key($('#spotlight-input'), 'Enter');
assert.equal($('#project-dialog').open, true);
assert.match($('#project-dialog').textContent, /HP/);
click('#project-dialog [data-close]');
key(document, ',', { ctrlKey: true });
await until(() => $('#window-appearance').classList.contains('is-active'), 'Keyboard shortcut focuses preferences');

reduceMotion = true;
const priorAnimations = animationCount;
await open('resume');
assert.equal(animationCount, priorAnimations);
assert.match($('#window-resume').textContent, /8\+ years/);
assert.equal($$('#window-resume .resume-job').length, 3);
for (const element of $$('.portfolio-window')) click(`#${element.id} .traffic.close`);
await until(() => $$('.portfolio-window').length === 0, 'All windows close independently');
assert.equal($('#desktop-widgets').inert, false);
assert.equal($('#profile-widget .profile-widget-name').textContent, profile.fullName);
assert.equal($$('#dock .running').length, 0);
click('#profile-widget');
await until(() => $('#window-about')?.dataset.windowState === 'open', 'The profile widget opens About');
assert.ok($('#profile-widget .profile-widget-photo'), 'The photo widget remains on the desktop behind windows');
click('#window-about .traffic.close');
await until(() => !$('#window-about'), 'The widget-launched window closes normally');
assert.equal(errors.length, 0);
console.error = originalError;
console.log('Passed: CSS and translucent-content contrast for ten appearances, full name, refresh routing, initial HTML, independent windows and dragging, Show Desktop/restore and rapid toggles, constrained resizing, folder grid snapping and migration, movable widget/keyboard placement/persistence/collision avoidance, responsive bounds, sample previews, brand marks, dock magnification and labels, mobile focus, saved preferences, greeting replay, search, lean Genie frames, résumé, and reduced motion.');
