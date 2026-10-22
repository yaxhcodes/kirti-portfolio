import { WindowResizer } from './window-resizer.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function curvePolygon(amount) {
  const left = [], right = [];
  for (let i = 0; i <= 14; i++) {
    const y = i / 14;
      const bend = amount * (Math.pow(y, 1.25) * 47.5 + Math.sin(y * Math.PI) * 2);
    left.push(`${bend}% ${y * 100}%`);
    right.unshift(`${100 - bend}% ${y * 100}%`);
  }
  return `polygon(${left.concat(right).join(',')})`;
}

function smoothStep(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export class WindowManager {
  constructor(element, dockTarget, { onStateChange, onFocus, offset = 0 }) {
    this.element = element;
    this.dockTarget = dockTarget;
    this.onStateChange = onStateChange;
    this.onFocus = onFocus;
    this.offset = offset;
    this.state = 'minimized';
    this.busy = false;
    this.visibleRequested = false;
    this.operation = Promise.resolve();
    this.events = new AbortController();
    this.resetPosition();
    this.setupDrag();
    this.resizer = new WindowResizer(element, {
      signal: this.events.signal,
      enabled: () => innerWidth > 760 && !this.busy && !element.hidden && !element.classList.contains('expanded'),
      onChange: () => { this.position = { x: 0, y: 0 }; element.style.transform = 'translate(0px, 0px)'; },
    });
  }

  frames() {
    const rect = this.element.getBoundingClientRect();
    const dock = this.dockTarget.getBoundingClientRect();
    const x = dock.left + dock.width / 2 - (rect.left + rect.width / 2);
    const y = dock.top + dock.height / 2 - rect.bottom;
    const base = `translate(${this.position.x}px, ${this.position.y}px)`;
    return Array.from({ length: 49 }, (_, index) => {
      const t = index / 48;
      const travel = smoothStep(t);
      const scaleX = 1 - .965 * smoothStep((t - .16) / .84);
      const scaleY = 1 - .985 * smoothStep(t);
      const curvature = smoothStep(t / .38) * (1 - smoothStep((t - .9) / .1));
      return {
        offset: t,
        transform: `${base} translate(${(x * travel).toFixed(3)}px, ${(y * travel).toFixed(3)}px) scale(${scaleX.toFixed(5)}, ${scaleY.toFixed(5)})`,
        clipPath: curvePolygon(curvature),
        opacity: 1 - smoothStep((t - .84) / .16),
      };
    });
  }

  setVisible(visible, animate = true) {
    this.visibleRequested = visible;
    const run = async () => {
      if (visible === !this.element.hidden) return;
      this.busy = true;
      this.element.hidden = false;
      if (visible) this.constrainPosition();
      this.setState(visible ? 'opening' : 'minimizing');
      try {
        if (animate && !reducedMotion.matches && this.element.animate) {
          let frames = this.frames();
          if (visible) frames = frames.reverse().map(frame => ({ ...frame, offset: 1 - frame.offset }));
          this.element.style.transformOrigin = '50% 100%';
          const animation = this.element.animate(frames, { duration: visible ? 620 : 650, easing: 'linear' });
          try { await animation.finished; }
          catch (error) { if (error.name !== 'AbortError') throw error; }
        }
      } finally {
        this.element.hidden = !visible;
        this.busy = false;
        this.setState(visible ? 'open' : 'minimized');
      }
    };
    this.operation = this.operation.then(run, run);
    return this.operation;
  }

  setState(state) {
    this.state = state;
    this.element.dataset.windowState = state;
    this.onStateChange();
  }

  maximize() {
    if (this.busy || this.element.hidden || this.element.classList.contains('resizing')) return;
    if (!this.element.classList.contains('expanded') && this.resizer.bounds && innerWidth > 760) this.resizer.fitViewport(this.position);
    this.element.classList.toggle('expanded');
    this.resetPosition();
    const expanded = this.element.classList.contains('expanded');
    this.element.querySelector('.traffic.maximize').setAttribute('aria-label', `${expanded ? 'Restore' : 'Expand'} ${this.element.dataset.windowTitle} window`);
  }

  resetPosition() {
    const desktop = innerWidth > 760 && !this.element.classList.contains('expanded');
    if (desktop && this.resizer?.bounds) { this.resizer.fitViewport(this.position); return; }
    this.position = { x: desktop ? this.offset * 24 : 0, y: desktop ? this.offset * 17 : 0 };
    this.element.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
    this.constrainPosition();
  }

  constrainPosition() {
    if (innerWidth <= 760 || this.element.hidden || this.element.classList.contains('expanded')) return;
    const rect = this.element.getBoundingClientRect();
    this.position.x += Math.max(0, 18 - rect.left) - Math.max(0, rect.right - innerWidth + 18);
    this.position.y += Math.max(0, 43 - rect.top) - Math.max(0, rect.bottom - innerHeight + 105);
    this.element.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
  }

  setupDrag() {
    const toolbar = this.element.querySelector('.window-toolbar');
    const options = { signal: this.events.signal };
    let drag = null;
    this.element.addEventListener('pointerdown', () => this.onFocus(), options);
    this.element.addEventListener('focusin', () => this.onFocus(), options);
    toolbar.addEventListener('pointerdown', event => {
      if (event.target.closest('button, a, input') || event.button !== 0 || innerWidth <= 760 || this.busy || this.element.classList.contains('expanded')) return;
      drag = { x: event.clientX, y: event.clientY, startX: this.position.x, startY: this.position.y, rect: this.element.getBoundingClientRect() };
      toolbar.setPointerCapture(event.pointerId);
      this.element.classList.add('dragging');
    }, options);
    toolbar.addEventListener('pointermove', event => {
      if (!drag) return;
      const dx = Math.max(36 - drag.rect.right, Math.min(innerWidth - 36 - drag.rect.left, event.clientX - drag.x));
      const dy = Math.max(40 - drag.rect.top, Math.min(innerHeight - 145 - drag.rect.top, event.clientY - drag.y));
      this.position = { x: drag.startX + dx, y: drag.startY + dy };
      this.element.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
    }, options);
    const end = () => { drag = null; this.element.classList.remove('dragging'); };
    toolbar.addEventListener('pointerup', end, options);
    toolbar.addEventListener('pointercancel', end, options);
    toolbar.addEventListener('dblclick', event => { if (!event.target.closest('button')) this.maximize(); }, options);
  }

  destroy() { this.events.abort(); }
}
