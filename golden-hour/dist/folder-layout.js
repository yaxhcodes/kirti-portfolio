import { readPreference, savePreference } from './preferences.js';
import { installDesktopDrag, placeDesktopItem, overlaps } from './desktop-drag.js';

export class FolderLayout {
  constructor(root, { obstacles = () => [] } = {}) {
    this.root = root;
    this.obstacles = obstacles;
    this.buttons = [...root.querySelectorAll('.desktop-folder')];
    this.positions = {};
    try {
      const saved = JSON.parse(readPreference('folder-layout-v1', '{}'));
      for (const button of this.buttons) {
        const value = saved?.[button.dataset.nav];
        if (Number.isFinite(value?.x) && Number.isFinite(value?.y)) this.positions[button.dataset.nav] = { x: value.x, y: value.y };
      }
    } catch (error) { console.warn('The saved folder layout could not be read:', error.name); }
    this.restore();
    const drag = installDesktopDrag(root, {
      selector: '.desktop-folder', geometry: button => this.geometry(button),
      place: placeDesktopItem, commit: (button, position, geometry) => this.commit(button, position, geometry),
    });
    root.addEventListener('keydown', event => {
      const button = event.target.closest('.desktop-folder');
      if (!button || !event.shiftKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const geometry = this.geometry(button);
      const rect = button.getBoundingClientRect();
      const cells = this.cells(geometry);
      const current = this.nearest(cells, this.positions[button.dataset.nav] || { x: rect.left - geometry.workspace.left, y: rect.top - geometry.workspace.top });
      const occupied = this.occupied(button, cells, geometry);
      const dx = event.key === 'ArrowLeft' ? 1 : event.key === 'ArrowRight' ? -1 : 0;
      const dy = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
      let column = current.column + dx, row = current.row + dy;
      while (column >= 0 && column < geometry.columns && row >= 0 && row < geometry.rows) {
        const cell = cells[column * geometry.rows + row];
        if (!occupied.has(cell.key)) { this.remember(button, cell, geometry); break; }
        column += dx; row += dy;
      }
    });
    window.addEventListener('resize', () => {
      drag.cancel();
      this.restore();
    });
  }

  geometry(button) {
    const workspace = this.root.getBoundingClientRect();
    const { width, height } = button.getBoundingClientRect();
    const style = getComputedStyle(this.root);
    const value = (name, fallback) => {
      const numeric = parseFloat(style.getPropertyValue(name));
      return Number.isFinite(numeric) ? numeric : fallback;
    };
    const edge = value('--folder-edge', 8);
    const stepX = width + value('--folder-gap', 12), stepY = height + value('--folder-gap', 12);
    const maxX = Math.max(edge, workspace.width - width - edge);
    const maxY = Math.max(edge, workspace.height - height - value('--folder-dock-clearance', 102));
    const originX = Math.max(edge, Math.min(maxX, workspace.width - width - value('--folder-right', 22)));
    const originY = Math.max(edge, Math.min(maxY, value('--folder-top', 24)));
    return { workspace, width, height, edge, maxX, maxY, originX, originY, stepX, stepY, columns: Math.floor((originX - edge) / stepX) + 1, rows: Math.floor((maxY - originY) / stepY) + 1 };
  }

  cells(geometry) {
    const cells = [];
    for (let column = 0; column < geometry.columns; column++) {
      for (let row = 0; row < geometry.rows; row++) {
        cells.push({ x: geometry.originX - column * geometry.stepX, y: geometry.originY + row * geometry.stepY, column, row, key: `${column}:${row}` });
      }
    }
    return cells;
  }

  nearest(cells, position, occupied = new Set()) {
    let nearest = null, distance = Infinity;
    for (const cell of cells) {
      if (occupied.has(cell.key)) continue;
      const next = (cell.x - position.x) ** 2 + (cell.y - position.y) ** 2;
      if (nearest === null || next < distance) { nearest = cell; distance = next; }
    }
    return nearest;
  }

  reserved(cells, geometry) {
    const occupied = new Set();
    for (const obstacle of this.obstacles()) {
      if (obstacle.width <= 0 || obstacle.height <= 0) continue;
      const left = obstacle.left - geometry.workspace.left, top = obstacle.top - geometry.workspace.top;
      for (const cell of cells) {
        if (overlaps({ ...cell, width: geometry.width, height: geometry.height }, { x: left, y: top, width: obstacle.width, height: obstacle.height })) occupied.add(cell.key);
      }
    }
    return occupied;
  }

  occupied(button, cells, geometry) {
    const occupied = this.reserved(cells, geometry);
    for (const sibling of this.buttons) {
      if (sibling === button) continue;
      const rect = sibling.getBoundingClientRect();
      const position = this.positions[sibling.dataset.nav] || { x: rect.left - geometry.workspace.left, y: rect.top - geometry.workspace.top };
      occupied.add(this.nearest(cells, position).key);
    }
    return occupied;
  }

  commit(button, position, geometry) {
    const cells = this.cells(geometry);
    const cell = this.nearest(cells, position, this.occupied(button, cells, geometry));
    if (cell) this.remember(button, cell, geometry);
    else this.restore();
  }

  remember(button, position, geometry) {
    placeDesktopItem(button, position, geometry);
    this.positions[button.dataset.nav] = { x: position.x, y: position.y };
    this.save();
  }

  restore() {
    if (!this.buttons.length) return;
    const geometry = this.geometry(this.buttons[0]);
    const cells = this.cells(geometry);
    const occupied = this.reserved(cells, geometry);
    let changed = false;
    const buttons = [...this.buttons].sort((a, b) => Number(Boolean(this.positions[a.dataset.nav])) - Number(Boolean(this.positions[b.dataset.nav])));
    for (const button of buttons) {
      const saved = this.positions[button.dataset.nav];
      const original = { x: geometry.originX, y: geometry.originY + Number(button.style.getPropertyValue('--folder-index')) * geometry.stepY };
      const desired = saved || cells[Math.min(this.buttons.indexOf(button), cells.length - 1)];
      const cell = this.nearest(cells, desired, occupied) || this.nearest(cells, desired);
      occupied.add(cell.key);
      if (saved || cell.x !== original.x || cell.y !== original.y) {
        placeDesktopItem(button, cell, geometry);
        if (!saved || saved.x !== cell.x || saved.y !== cell.y) changed = true;
        this.positions[button.dataset.nav] = { x: cell.x, y: cell.y };
      }
    }
    if (changed) this.save();
  }

  reset() {
    this.positions = {};
    for (const button of this.buttons) for (const property of ['left', 'top', 'right']) button.style.removeProperty(property);
    this.restore();
    this.save();
  }

  save() { savePreference('folder-layout-v1', JSON.stringify(this.positions)); }
}
