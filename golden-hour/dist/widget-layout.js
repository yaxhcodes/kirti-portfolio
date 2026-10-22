import { readPreference, savePreference } from './preferences.js';
import { installDesktopDrag, placeDesktopItem, overlaps } from './desktop-drag.js';

export class WidgetLayout {
  constructor(root, { obstacles = () => [] } = {}) {
    this.root = root;
    this.button = root.querySelector('.desktop-profile-widget');
    this.obstacles = obstacles;
    try {
      const saved = JSON.parse(readPreference('widget-layout-v1', 'null'));
      if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) this.position = saved;
    } catch (error) { console.warn('The saved widget position could not be read:', error.name); }
    this.restore();
    const drag = installDesktopDrag(root, {
      selector: '.desktop-profile-widget', geometry: () => this.geometry(),
      place: placeDesktopItem, commit: (_, position) => this.commit(position),
    });
    root.addEventListener('keydown', event => {
      if (!event.target.closest('.desktop-profile-widget') || !event.shiftKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const geometry = this.geometry();
      const rect = this.button.getBoundingClientRect();
      const position = this.placedPosition || { x: rect.left - geometry.workspace.left, y: rect.top - geometry.workspace.top };
      const dx = event.key === 'ArrowLeft' ? -12 : event.key === 'ArrowRight' ? 12 : 0;
      const dy = event.key === 'ArrowUp' ? -12 : event.key === 'ArrowDown' ? 12 : 0;
      this.commit({ x: position.x + dx, y: position.y + dy });
    });
    window.addEventListener('resize', () => { drag.cancel(); this.restore(); });
  }

  geometry() {
    const workspace = this.root.getBoundingClientRect();
    const { width, height } = this.button.getBoundingClientRect();
    const edge = innerWidth <= 540 || innerHeight <= 560 ? 16 : 24;
    return { workspace, width, height, edge, maxX: Math.max(edge, workspace.width - width - edge), maxY: Math.max(edge, workspace.height - height - 102) };
  }

  nearest(position, geometry) {
    const obstacles = this.obstacles().map(rect => ({ x: rect.left - geometry.workspace.left, y: rect.top - geometry.workspace.top, width: rect.width, height: rect.height }));
    const xs = [], ys = [];
    for (let x = geometry.edge; x <= geometry.maxX; x += 12) xs.push(x);
    for (let y = geometry.edge; y <= geometry.maxY; y += 12) ys.push(y);
    let nearest = null, distance = Infinity;
    for (const x of xs) for (const y of ys) {
      if (obstacles.some(obstacle => overlaps({ x, y, width: geometry.width, height: geometry.height }, obstacle))) continue;
      const next = (x - position.x) ** 2 + (y - position.y) ** 2;
      if (nearest === null || next < distance) { nearest = { x, y }; distance = next; }
    }
    return nearest;
  }

  commit(position) {
    const geometry = this.geometry();
    if (!geometry.width || !geometry.height) return;
    const snapped = this.nearest(position, geometry);
    if (!snapped) { this.restore(); return; }
    this.position = snapped;
    this.placedPosition = snapped;
    placeDesktopItem(this.button, snapped, geometry);
    savePreference('widget-layout-v1', JSON.stringify(snapped));
  }

  restore() {
    const geometry = this.geometry();
    if (!geometry.width || !geometry.height) return;
    const snapped = this.nearest(this.position || { x: geometry.edge, y: geometry.edge }, geometry);
    if (snapped) { placeDesktopItem(this.button, snapped, geometry); this.placedPosition = snapped; }
  }
}
