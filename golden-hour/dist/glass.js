import { GlassScene } from './glass-scene.js';

// Distort a clipped copy of the source. Foreground text never enters the filter.
const neutralPixel = new Uint32Array(new Uint8Array([128, 128, 128, 255]).buffer)[0];

export function displacementPixels(width, height, radius, edge = 12) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  new Uint32Array(pixels.buffer).fill(neutralPixel);
  const halfX = width / 2, halfY = height / 2;
  const r = Math.min(radius, halfX, halfY);
  const band = Math.ceil(Math.max(r, edge));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    // The flat center needs no optics. Skip its expensive distance calculations.
    if (x === band && y >= band && y < height - band) { x = Math.max(x, width - band); if (x >= width) break; }
    const dx = x + .5 - halfX, dy = y + .5 - halfY;
    const qx = Math.abs(dx) - (halfX - r), qy = Math.abs(dy) - (halfY - r);
    const ox = Math.max(qx, 0), oy = Math.max(qy, 0), length = Math.hypot(ox, oy);
    const distance = length + Math.min(Math.max(qx, qy), 0) - r;
    const depth = Math.max(0, Math.min(1, -distance / edge));
    const bend = distance < 0 ? Math.sin(depth * Math.PI) ** .9 : 0;
    const nx = length ? ox / length : qx > qy ? 1 : 0;
    const ny = length ? oy / length : qy >= qx ? 1 : 0;
    const index = (y * width + x) * 4;
    pixels[index] = Math.round(128 - Math.sign(dx) * nx * bend * 126);
    pixels[index + 1] = Math.round(128 - Math.sign(dy) * ny * bend * 126);
  }
  return pixels;
}

const svgNamespace = 'http://www.w3.org/2000/svg';
let nextFilterId = 0;

export class LiquidGlass {
  constructor() {
    this.canvas = document.createElement('canvas');
    try { this.context = this.canvas.getContext('2d'); }
    catch (error) { console.warn('Refraction is unavailable; using the CSS glass material:', error.name); }
    this.surfaces = new Map();
    this.frame = null;
    if (!this.context) return;
    this.svg = document.createElementNS(svgNamespace, 'svg');
    this.svg.setAttribute('aria-hidden', 'true');
    this.svg.setAttribute('width', '0');
    this.svg.setAttribute('height', '0');
    this.svg.classList.add('glass-definitions');
    this.defs = document.createElementNS(svgNamespace, 'defs');
    this.svg.append(this.defs);
    document.body.append(this.svg);
    this.observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.schedule()) : null;
    document.addEventListener('pointermove', () => this.schedule(), { passive: true });
    window.addEventListener('resize', () => { this.refreshScenes(); this.schedule(); });
    document.addEventListener('scroll', () => { this.refreshScenes(); this.schedule(); }, { capture: true, passive: true });
    document.addEventListener('animationend', () => this.schedule(), true);
  }

  attach(element, { photo = null } = {}) {
    if (!this.context || !element) return;
    const existing = this.surfaces.get(element);
    if (existing?.optics.isConnected) { this.schedule(); return; }
    if (existing) this.detach(element);
    let scene = null;
    if (element.matches('.menu-dropdown')) {
      try { scene = new GlassScene(element.getBoundingClientRect()); }
      catch (error) { console.warn('The menu is using the wallpaper glass fallback:', error.name); }
    }
    const source = photo || document.querySelector('body>.wallpaper');
    if (!source) return;
    const optics = document.createElement('span');
    optics.className = `liquid-optics ${scene ? 'liquid-menu-optics' : photo ? 'liquid-photo-optics' : 'liquid-edge-optics'}`;
    optics.setAttribute('aria-hidden', 'true');
    const refractor = document.createElement('span');
    refractor.className = 'liquid-refractor';
    const sample = scene?.element || source.cloneNode(true);
    sample.removeAttribute('id');
    sample.removeAttribute('data-profile-photo');
    if (!scene) sample.className = photo ? 'liquid-photo' : 'wallpaper liquid-wallpaper';
    sample.querySelector('.wallpaper-grain')?.remove();
    refractor.append(sample);
    optics.append(refractor);
    element.prepend(optics);
    element.classList.add('has-liquid-glass');
    element.classList.toggle('has-scene-glass', Boolean(scene));
    const surface = { element, optics, refractor, sample, photo, scene, sceneDirty: false, filter: null, size: '', pendingSize: '', timer: null };
    this.surfaces.set(element, surface);
    this.observer?.observe(element);
    photo?.addEventListener('error', () => this.detach(element), { once: true });
    this.sync(surface, true);
  }

  detach(element) {
    const surface = this.surfaces.get(element);
    if (!surface) return;
    clearTimeout(surface.timer);
    this.observer?.unobserve(element);
    surface.filter?.remove();
    surface.optics.remove();
    element.classList.remove('has-liquid-glass');
    element.classList.remove('has-scene-glass');
    this.surfaces.delete(element);
  }

  schedule() {
    if (this.frame !== null) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      for (const surface of this.surfaces.values()) this.sync(surface);
    });
  }

  refreshScenes() {
    for (const surface of this.surfaces.values()) if (surface.scene) surface.sceneDirty = true;
  }

  sync(surface, immediately = false) {
    const { element, sample, photo, scene } = surface;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height || element.closest('[hidden]') || element.matches('dialog:not([open])') || ['opening', 'minimizing'].includes(element.dataset.windowState)) return;
    if (surface.sceneDirty) { scene.refresh(rect); surface.sceneDirty = false; }
    const width = Math.round(rect.width), height = Math.round(rect.height);
    const size = `${width}:${height}`;
    if (size !== surface.size && (size !== surface.pendingSize || immediately)) {
      clearTimeout(surface.timer);
      surface.pendingSize = size;
      const refresh = () => {
        try { this.filter(surface, width, height); surface.size = size; surface.pendingSize = ''; }
        catch (error) { this.detach(element); console.warn('A glass surface is using the CSS fallback:', error.name); }
      };
      if (immediately || !surface.filter) refresh();
      else surface.timer = setTimeout(refresh, 120);
    }
    const source = photo?.getBoundingClientRect() || { left: 0, top: 0, width: innerWidth, height: innerHeight };
    const zoom = scene ? 1.012 : 1;
    const x = (source.left - rect.left) * zoom + rect.width * (1 - zoom) / 2;
    const y = (source.top - rect.top) * zoom + rect.height * (1 - zoom) / 2;
    const placement = `${source.width}:${source.height}:${x.toFixed(2)}:${y.toFixed(2)}`;
    if (placement !== surface.placement) {
      sample.style.width = `${source.width}px`;
      sample.style.height = `${source.height}px`;
      sample.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)${scene ? ` scale(${zoom})` : ''}`;
      surface.placement = placement;
    }
    scene?.restoreScroll();
  }

  filter(surface, width, height) {
    const factor = Math.min(1, 1400 / width, 900 / height);
    const mapWidth = Math.max(1, Math.round(width * factor)), mapHeight = Math.max(1, Math.round(height * factor));
    const declaredRadius = parseFloat(getComputedStyle(surface.element).borderRadius);
    const radius = Number.isFinite(declaredRadius) ? declaredRadius : surface.photo ? 16 : 23;
    this.canvas.width = mapWidth;
    this.canvas.height = mapHeight;
    const pixels = this.context.createImageData(mapWidth, mapHeight);
    pixels.data.set(displacementPixels(mapWidth, mapHeight, radius * factor, (surface.scene ? 16 : 12) * factor));
    this.context.putImageData(pixels, 0, 0);
    const filter = document.createElementNS(svgNamespace, 'filter');
    // A new ID also invalidates Safari's cached SVG output when the shape changes.
    const id = `liquid-lens-${++nextFilterId}`;
    filter.id = id;
    filter.setAttribute('x', '0'); filter.setAttribute('y', '0');
    filter.setAttribute('width', '100%'); filter.setAttribute('height', '100%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    filter.innerHTML = `<feImage href="${this.canvas.toDataURL()}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="lens-map"/><feDisplacementMap in="SourceGraphic" in2="lens-map" scale="${surface.scene ? 26 : 18}" xChannelSelector="R" yChannelSelector="G"/>`;
    this.defs.append(filter);
    surface.refractor.style.filter = `url(#${id})${surface.scene ? ' blur(1.2px)' : ''}`;
    surface.filter?.remove();
    surface.filter = filter;
  }
}
