import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { displacementPixels, LiquidGlass } from '../dist/glass.js';

const width = 160, height = 80;
const pixels = displacementPixels(width, height, 18);
const pixel = (x, y) => [...pixels.slice((y * width + x) * 4, (y * width + x + 1) * 4)];
for (const [x, y] of [[80, 40], [40, 30], [120, 50], [0, 0]]) assert.deepEqual(pixel(x, y), [128, 128, 128, 255], 'The center and clipped corners are neutral');
assert.ok(pixel(5, 40)[0] > 220, 'The left edge samples inward instead of pulling transparent pixels outside the source');
assert.ok(pixel(154, 40)[0] < 36);
assert.ok(pixel(80, 5)[1] > 220);
assert.ok(pixel(80, 74)[1] < 36);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const current = pixel(x, y), opposite = pixel(width - x - 1, height - y - 1);
  assert.ok(Math.abs(current[0] + opposite[0] - 256) <= 1 && Math.abs(current[1] + opposite[1] - 256) <= 1, 'Opposite edges refract symmetrically');
  assert.equal(current[2], 128);
  assert.equal(current[3], 255);
}

const { parseHTML } = createRequire(import.meta.url)('linkedom');
const { window, document } = parseHTML('<html><body><div class="wallpaper"><div class="wallpaper-fold fold-one"></div><div class="wallpaper-grain"></div></div><section id="surface"><h1>Readable foreground</h1><button>Open</button></section><div id="widget"><img id="photo" src="photo.webp" data-profile-photo alt=""><span id="caption"><strong>Kirti Joshi</strong></span></div></body></html>');
const observed = new Set();
let resizeCallback, maps = 0, reducedMotion = false, failEncoding = false;
Object.assign(globalThis, {
  window, document, innerWidth: 1440, innerHeight: 900,
  getComputedStyle: () => ({ borderRadius: '18px' }),
  matchMedia: () => ({ get matches() { return reducedMotion; } }),
  requestAnimationFrame: callback => { queueMicrotask(callback); return 1; },
  ResizeObserver: class {
    constructor(callback) { resizeCallback = callback; }
    observe(element) { observed.add(element); }
    unobserve(element) { observed.delete(element); }
  },
});
const context = {
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
  putImageData: () => { maps++; },
};
window.HTMLCanvasElement.prototype.getContext = () => context;
window.HTMLCanvasElement.prototype.toDataURL = () => {
  if (failEncoding) throw new Error('Canvas encoding unavailable');
  return 'data:image/png;base64,fixture';
};
const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
const surface = document.querySelector('#surface');
let bounds = rect(100, 80, 640, 420);
surface.getBoundingClientRect = () => bounds;
const photo = document.querySelector('#photo');
photo.getBoundingClientRect = () => rect(24, 57, 218, 248);
const caption = document.querySelector('#caption');
caption.getBoundingClientRect = () => rect(34, 233, 198, 62);
const tick = () => new Promise(resolve => setTimeout(resolve, 1));
const glass = new LiquidGlass();
glass.attach(surface);
assert.equal(surface.querySelectorAll('.liquid-optics').length, 1);
assert.equal(surface.querySelector('h1').textContent, 'Readable foreground');
assert.equal(surface.querySelector('.liquid-optics h1'), null, 'Text is never cloned into a refracted surface');
assert.equal(surface.querySelector('.liquid-optics').getAttribute('aria-hidden'), 'true');
assert.equal(surface.querySelector('.liquid-wallpaper').style.transform, 'translate(-100.00px,-80.00px)', 'The optical wallpaper aligns with the actual desktop');
assert.equal(surface.querySelector('.wallpaper-grain'), null, 'Each lens avoids another turbulence layer');
assert.equal(document.querySelectorAll('filter').length, 1);
assert.ok(observed.has(surface));
const originalFilter = document.querySelector('filter').id;
glass.attach(surface);
await tick();
assert.equal(surface.querySelectorAll('.liquid-optics').length, 1, 'Repeated attachment does not duplicate optical layers');
assert.equal(maps, 1);

bounds = rect(230, 110, 640, 420);
const move = new window.Event('pointermove');
Object.assign(move, { clientX: 400, clientY: 140, pointerType: 'mouse' });
document.dispatchEvent(move);
await tick();
assert.equal(surface.querySelector('.liquid-wallpaper').style.transform, 'translate(-230.00px,-110.00px)');
assert.equal(maps, 1, 'Moving a window repositions its source without rebuilding the displacement map');
assert.equal(surface.style.getPropertyValue('--glass-light-x'), '', 'Glass reflections stay fixed instead of tracking the pointer');
const highlight = surface.style.getPropertyValue('--glass-light-x');
reducedMotion = true;
Object.assign(move, { clientX: 500 });
document.dispatchEvent(move);
await tick();
assert.equal(surface.style.getPropertyValue('--glass-light-x'), highlight, 'Pointer highlights stay disabled with reduced motion too');
reducedMotion = false;

for (const next of [700, 780, 840]) {
  bounds = rect(230, 110, next, 420);
  resizeCallback();
  await tick();
}
assert.equal(maps, 1, 'A resizing surface temporarily reuses its map');
await new Promise(resolve => setTimeout(resolve, 145));
assert.equal(maps, 2, 'The final shape generates one replacement map');
assert.equal(document.querySelectorAll('filter').length, 1, 'Old filter resources are released');
assert.notEqual(document.querySelector('filter').id, originalFilter, 'A resized surface has a fresh filter identity');
surface.hidden = true;
bounds = rect(230, 110, 900, 420);
resizeCallback();
await tick();
assert.equal(maps, 2, 'Hidden windows do not regenerate optics');
surface.hidden = false;

glass.attach(caption, { photo });
assert.equal(caption.querySelector('.liquid-photo').getAttribute('src'), photo.getAttribute('src'));
assert.equal(caption.querySelector('.liquid-photo').hasAttribute('data-profile-photo'), false);
assert.equal(caption.querySelector('.liquid-photo').style.transform, 'translate(-10.00px,-176.00px)', 'The lens samples the part of the actual photo behind its caption');
assert.equal(caption.querySelector('.liquid-photo').style.width, '218px');
photo.dispatchEvent(new window.Event('error'));
assert.equal(caption.querySelector('.liquid-optics'), null, 'A missing image removes its lens and leaves readable text');
assert.equal(caption.querySelector('strong').textContent, 'Kirti Joshi');
glass.detach(surface);
assert.equal(document.querySelectorAll('filter').length, 0);
assert.equal(observed.size, 0);
assert.equal(surface.querySelector('.liquid-optics'), null);

const sceneStyle = document.createElement('style');
sceneStyle.textContent = '.portfolio-window { position:absolute; } .content-scroll { height:100px; overflow:auto; }';
document.head.append(sceneStyle);
const layer = document.createElement('div');
layer.id = 'window-layer';
layer.innerHTML = '<section class="portfolio-window" id="scene-window" style="z-index:7"><div class="content-scroll"><h1>Visible work</h1><button>Background control</button><span class="liquid-optics">Old lens</span></div></section><section class="portfolio-window" id="hidden-window" hidden>Hidden content</section>';
document.body.append(layer);
const backgroundWindow = layer.firstElementChild;
let backgroundBounds = rect(180, 79, 680, 450);
backgroundWindow.getBoundingClientRect = () => backgroundBounds;
backgroundWindow.querySelector('.content-scroll').scrollTop = 137;
const menu = document.createElement('div');
menu.className = 'menu-dropdown';
menu.innerHTML = '<button>Menu command</button>';
menu.getBoundingClientRect = () => rect(220, 60, 245, 220);
document.body.append(menu);
glass.attach(menu);
assert.ok(menu.classList.contains('has-scene-glass'));
const scene = menu.querySelector('.liquid-scene');
assert.ok(scene.shadowRoot.querySelector('#scene-window'), 'The lens samples the visible window beneath the menu');
assert.equal(scene.shadowRoot.querySelector('#hidden-window'), null);
assert.equal(scene.shadowRoot.querySelector('#scene-window .liquid-optics'), null, 'Scene copies do not recursively clone their own optics');
assert.equal(document.querySelectorAll('#scene-window').length, 1, 'Shadow DOM prevents duplicate app IDs and controls from entering document selectors');
assert.equal(scene.shadowRoot.querySelector('.content-scroll').scrollTop, 137, 'The sampled content keeps its actual scroll position');
assert.ok(scene.hasAttribute('inert'));
assert.match(menu.querySelector('.liquid-refractor').style.filter, /blur\(1\.2px\)/);
assert.match(scene.style.transform, /scale\(1\.012\)/, 'The menu lens has restrained convex magnification');
const mapCountBeforeSceneMove = maps;
backgroundBounds = rect(210, 79, 680, 450);
backgroundWindow.querySelector('.content-scroll').scrollTop = 250;
document.dispatchEvent(new window.Event('scroll'));
await tick();
assert.equal(scene.shadowRoot.querySelector('#scene-window').style.left, '210px');
assert.equal(scene.shadowRoot.querySelector('.content-scroll').scrollTop, 250);
assert.equal(maps, mapCountBeforeSceneMove, 'Refreshing the sampled scene reuses the menu lens map');
glass.detach(menu);
assert.equal(menu.querySelector('.liquid-scene'), null);
assert.equal(document.querySelectorAll('filter').length, 0);
layer.remove(); menu.remove(); sceneStyle.remove();

const warn = console.warn, warnings = [];
console.warn = (...args) => warnings.push(args);
failEncoding = true;
glass.attach(surface);
assert.equal(surface.querySelector('.liquid-optics'), null, 'An encoding failure retains the CSS fallback');
assert.equal(surface.querySelector('h1').textContent, 'Readable foreground');
assert.equal(warnings.length, 1);
console.warn = warn;
window.HTMLCanvasElement.prototype.getContext = () => null;
new LiquidGlass().attach(surface);
assert.equal(surface.querySelector('.liquid-optics'), null, 'Canvas-disabled browsers retain the CSS material');
console.log('Passed: inward refraction, neutral centers, edge symmetry, aligned wallpaper/photo sources, isolated menu scene sampling, visible windows and scroll offsets, convex lensing, crisp foreground, map reuse, resize coalescing, hidden surfaces, reduced motion, cleanup, and CSS fallback. Rendering still requires real-browser review.');
