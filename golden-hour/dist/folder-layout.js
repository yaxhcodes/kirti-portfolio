import { readPreference, savePreference } from './preferences.js';

export class FolderLayout {
  constructor(root) {
    this.root = root;
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
    let drag = null, suppressed = null;
    root.addEventListener('pointerdown', event => {
      const button = event.target.closest('.desktop-folder');
      if (!button || event.button !== 0) return;
      const rect = button.getBoundingClientRect();
      const workspace = root.getBoundingClientRect();
      drag = { button, x: event.clientX, y: event.clientY, left: rect.left - workspace.left, top: rect.top - workspace.top, width: rect.width, height: rect.height, workspace, moved: false };
      button.setPointerCapture(event.pointerId);
    });
    root.addEventListener('pointermove', event => {
      if (!drag) return;
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      event.preventDefault();
      drag.moved = true;
      drag.button.classList.add('is-dragging');
      this.place(drag.button, { x: drag.left + dx, y: drag.top + dy }, drag);
    });
    const end = event => {
      if (!drag) return;
      drag.button.classList.remove('is-dragging');
      if (drag.moved) {
        this.positions[drag.button.dataset.nav] = { x: parseFloat(drag.button.style.left), y: parseFloat(drag.button.style.top) };
        this.save();
        if (event.type === 'pointerup') {
          suppressed = drag.button;
          setTimeout(() => { suppressed = null; }, 0);
        }
      }
      drag = null;
    };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) root.addEventListener(event, end);
    root.addEventListener('click', event => {
      if (suppressed && event.target.closest('.desktop-folder') === suppressed) {
        event.preventDefault(); event.stopImmediatePropagation(); suppressed = null;
      }
    }, true);
    root.addEventListener('keydown', event => {
      const button = event.target.closest('.desktop-folder');
      if (!button || !event.shiftKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const workspace = root.getBoundingClientRect();
      const rect = button.getBoundingClientRect();
      this.place(button, { x: rect.left - workspace.left + (event.key === 'ArrowRight' ? 16 : event.key === 'ArrowLeft' ? -16 : 0), y: rect.top - workspace.top + (event.key === 'ArrowDown' ? 16 : event.key === 'ArrowUp' ? -16 : 0) }, { width: rect.width, height: rect.height, workspace });
      this.positions[button.dataset.nav] = { x: parseFloat(button.style.left), y: parseFloat(button.style.top) };
      this.save();
    });
    window.addEventListener('resize', () => this.restore());
  }

  place(button, position, { width, height, workspace }) {
    button.style.left = `${Math.max(8, Math.min(workspace.width - width - 8, position.x))}px`;
    button.style.top = `${Math.max(8, Math.min(workspace.height - height - 102, position.y))}px`;
    button.style.right = 'auto';
  }

  restore() {
    const workspace = this.root.getBoundingClientRect();
    for (const button of this.buttons) {
      const position = this.positions[button.dataset.nav];
      if (position) this.place(button, position, { ...button.getBoundingClientRect(), workspace });
    }
  }

  reset() {
    this.positions = {};
    for (const button of this.buttons) for (const property of ['left', 'top', 'right']) button.style.removeProperty(property);
    this.save();
  }

  save() { savePreference('folder-layout-v1', JSON.stringify(this.positions)); }
}
