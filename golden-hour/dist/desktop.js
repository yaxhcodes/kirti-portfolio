import { WindowManager } from './window-manager.js';
import { icon } from './icons.js';

export class DesktopWindows {
  constructor({ definitions, render, onCreate, onActiveChange, onStateChange, onRemove }) {
    this.definitions = definitions;
    this.render = render;
    this.onCreate = onCreate;
    this.onActiveChange = onActiveChange;
    this.onStateChange = onStateChange;
    this.onRemove = onRemove;
    this.windows = new Map();
    this.order = [];
    this.activeId = null;
    this.requestedId = null;
    this.desktopSnapshot = null;
    this.layer = document.querySelector('#window-layer');
    window.addEventListener('resize', () => {
      this.windows.forEach(entry => entry.controller.resetPosition());
      this.update();
    });
  }

  create(id) {
    const definition = this.definitions[id];
    const prerendered = this.layer.querySelector(`[data-prerendered="${id}"]`);
    const element = prerendered || document.querySelector('#window-template').content.firstElementChild.cloneNode(true);
    element.removeAttribute('data-prerendered');
    element.hidden = true;
    element.id = `window-${id}`;
    element.dataset.windowId = id;
    element.dataset.windowTitle = definition.label;
    element.setAttribute('aria-label', `${definition.label} window`);
    element.style.setProperty('--window-width', `${definition.width}px`);
    element.style.setProperty('--window-height', `${definition.height}px`);
    element.querySelector('.window-title').textContent = definition.label;
    element.querySelector('.window-app-icon').innerHTML = icon(definition.icon);
    element.querySelector('.window-app-icon').classList.add(definition.color);
    element.querySelector('.window-search').innerHTML = icon('search');
    for (const action of ['close', 'minimize', 'maximize']) {
      element.querySelector(`[data-action="${action}"]`).setAttribute('aria-label', `${action === 'maximize' ? 'Expand' : action[0].toUpperCase() + action.slice(1)} ${definition.label} window`);
    }
    if (!prerendered) element.querySelector('.window-content').innerHTML = this.render(id);
    this.layer.append(element);
    const entry = { id, element, closing: false, controller: null };
    entry.controller = new WindowManager(element, document.querySelector(`#dock [data-nav="${definition.dockId || id}"]`), {
      offset: this.windows.size % 4,
      onFocus: () => this.focus(id),
      onStateChange: () => { this.update(); this.onStateChange?.(); },
    });
    this.windows.set(id, entry);
    this.onCreate(element, id);
    return entry;
  }

  async open(id, { animate = true, focusContent = true } = {}) {
    if (!this.definitions[id]) return;
    await this.restoreDesktop();
    const entry = this.windows.get(id) || this.create(id);
    entry.closing = false;
    this.focus(id);
    await entry.controller.setVisible(true, animate);
    // A newer dock selection takes precedence over an earlier opening animation.
    if (this.requestedId === id && !entry.closing && !this.desktopSnapshot) {
      this.focus(id);
      if (focusContent) entry.element.querySelector('.content-scroll').focus({ preventScroll: true });
    }
  }

  focus(id) {
    const entry = this.windows.get(id);
    if (!entry || entry.closing || this.desktopSnapshot) return;
    const changed = this.activeId !== id;
    this.requestedId = id;
    this.activeId = id;
    this.order = this.order.filter(item => item !== id).concat(id);
    this.update(false);
    if (changed) this.onActiveChange(id);
  }

  async minimize(id = this.activeId) {
    const entry = this.windows.get(id);
    if (!entry) return;
    if (this.requestedId === id) this.requestedId = null;
    await entry.controller.setVisible(false);
    this.update();
    entry.controller.dockTarget.focus({ preventScroll: true });
  }

  async close(id = this.activeId) {
    const entry = this.windows.get(id);
    if (!entry) return;
    if (this.requestedId === id) this.requestedId = null;
    entry.closing = true;
    await entry.controller.setVisible(false);
    if (entry.closing) {
      entry.controller.destroy();
      this.onRemove?.(entry.element);
      entry.element.remove();
      this.windows.delete(id);
      this.order = this.order.filter(item => item !== id);
    }
    this.update();
    entry.controller.dockTarget.focus({ preventScroll: true });
  }

  maximize(id = this.activeId) { this.windows.get(id)?.controller.maximize(); }

  async toggleDesktop() {
    if (this.desktopSnapshot) return this.restoreDesktop();
    const ids = this.order.filter(id => {
      const entry = this.windows.get(id);
      return entry && !entry.closing && entry.controller.visibleRequested;
    });
    if (!ids.length) return;
    const snapshot = { ids, activeId: this.activeId };
    this.desktopSnapshot = snapshot;
    this.requestedId = null;
    this.update();
    await Promise.all(ids.map(id => this.windows.get(id).controller.setVisible(false)));
    this.update();
    if (this.desktopSnapshot === snapshot) document.querySelector('#desktop').focus({ preventScroll: true });
  }

  async restoreDesktop() {
    const snapshot = this.desktopSnapshot;
    if (!snapshot) return;
    this.desktopSnapshot = null;
    this.update();
    await Promise.all(snapshot.ids.map(id => {
      const entry = this.windows.get(id);
      return entry && !entry.closing ? entry.controller.setVisible(true) : undefined;
    }));
    if (!this.desktopSnapshot && !this.requestedId && this.windows.has(snapshot.activeId)) this.focus(snapshot.activeId);
    this.update();
  }

  update(chooseActive = true) {
    const isVisible = id => {
      const entry = this.windows.get(id);
      return entry && !entry.element.hidden;
    };
    if (chooseActive && !isVisible(this.activeId)) {
      const next = [...this.order].reverse().find(isVisible) || null;
      if (this.activeId !== next) { this.activeId = next; this.onActiveChange(next); }
    }
    const mobile = innerWidth <= 760;
    this.windows.forEach((entry, id) => {
      const active = id === this.activeId;
      entry.element.style.zIndex = String(2 + this.order.indexOf(id));
      entry.element.classList.toggle('is-active', active);
      entry.element.classList.toggle('is-background', !active);
      entry.element.inert = mobile && !active;
    });
    document.querySelectorAll('#dock [data-nav]').forEach(button => {
      const id = button.dataset.nav;
      const entries = [...this.windows.values()].filter(entry => (this.definitions[entry.id].dockId || entry.id) === id && !entry.closing);
      const running = entries.length > 0;
      const minimized = running && entries.every(entry => entry.element.hidden);
      button.classList.toggle('running', running);
      button.classList.toggle('active', id === (this.definitions[this.activeId]?.dockId || this.activeId));
      button.classList.toggle('window-minimized', minimized);
      button.setAttribute('aria-description', running ? (minimized ? 'Minimized windows.' : 'Open windows.') : 'Activate to open window.');
    });
    document.querySelector('#desktop-widgets').inert = innerWidth <= 760 && [...this.windows.keys()].some(isVisible);
    document.querySelectorAll('[data-action="show-desktop"]').forEach(button => {
      button.setAttribute('aria-pressed', String(Boolean(this.desktopSnapshot)));
      button.setAttribute('aria-label', this.desktopSnapshot ? 'Restore windows' : 'Show desktop');
      button.title = this.desktopSnapshot ? 'Restore windows' : 'Show desktop';
      const label = button.querySelector('[data-desktop-label]');
      if (label) label.textContent = this.desktopSnapshot ? 'Restore windows' : 'Show desktop';
    });
  }

  focusContent() { this.windows.get(this.activeId)?.element.querySelector('.content-scroll').focus({ preventScroll: true }); }
}
