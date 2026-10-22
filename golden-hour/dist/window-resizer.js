const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function limits(viewport) {
  const maxWidth = Math.max(1, viewport.width - 36);
  const maxHeight = Math.max(56, viewport.height - 148);
  return { left: 18, top: 43, right: viewport.width - 18, bottom: viewport.height - 105, minWidth: Math.min(440, maxWidth), minHeight: Math.min(300, maxHeight), maxWidth, maxHeight };
}

export function fitBounds(bounds, viewport) {
  const area = limits(viewport);
  const width = clamp(bounds.width, area.minWidth, area.maxWidth);
  const height = clamp(bounds.height, area.minHeight, area.maxHeight);
  return { left: clamp(bounds.left, area.left, area.right - width), top: clamp(bounds.top, area.top, area.bottom - height), width, height };
}

export function resizeBounds(start, direction, dx, dy, viewport) {
  const area = limits(viewport);
  let { left, top } = start;
  let right = left + start.width, bottom = top + start.height;
  if (direction.includes('e')) right = clamp(right + dx, left + area.minWidth, area.right);
  if (direction.includes('s')) bottom = clamp(bottom + dy, top + area.minHeight, area.bottom);
  if (direction.includes('w')) left = clamp(left + dx, area.left, right - area.minWidth);
  if (direction.includes('n')) top = clamp(top + dy, area.top, bottom - area.minHeight);
  return { left, top, width: right - left, height: bottom - top };
}

export class WindowResizer {
  constructor(element, { signal, enabled, onChange }) {
    this.element = element;
    this.enabled = enabled;
    this.onChange = onChange;
    this.bounds = null;
    let gesture = null;
    const viewport = () => ({ width: innerWidth, height: innerHeight });
    const end = () => { gesture = null; element.classList.remove('resizing'); };
    window.addEventListener('resize', end, { signal });
    for (const direction of ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']) {
      const handle = document.createElement(direction === 'se' ? 'button' : 'span');
      handle.className = `resize-handle resize-${direction}`;
      handle.dataset.resize = direction;
      if (direction === 'se') {
        handle.type = 'button';
        handle.setAttribute('aria-label', `Resize ${element.dataset.windowTitle} window`);
        handle.setAttribute('aria-keyshortcuts', 'ArrowUp ArrowDown ArrowLeft ArrowRight');
        handle.title = 'Drag to resize, or focus and use arrow keys';
        handle.addEventListener('keydown', event => {
          if (!this.enabled() || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
          event.preventDefault();
          const step = event.shiftKey ? 40 : 16;
          const start = fitBounds(element.getBoundingClientRect(), viewport());
          this.origin = element.parentElement.getBoundingClientRect();
          this.apply(resizeBounds(start, 'se', event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0, event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0, viewport()));
        }, { signal });
      } else handle.setAttribute('aria-hidden', 'true');
      handle.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !this.enabled()) return;
        event.preventDefault();
        this.origin = element.parentElement.getBoundingClientRect();
        const bounds = fitBounds(element.getBoundingClientRect(), viewport());
        gesture = { x: event.clientX, y: event.clientY, direction, bounds, viewport: viewport() };
        handle.setPointerCapture(event.pointerId);
        element.classList.add('resizing');
        this.apply(bounds);
      }, { signal });
      handle.addEventListener('pointermove', event => {
        if (gesture) this.apply(resizeBounds(gesture.bounds, gesture.direction, event.clientX - gesture.x, event.clientY - gesture.y, gesture.viewport));
      }, { signal });
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) handle.addEventListener(event, end, { signal });
      element.append(handle);
    }
  }

  apply(bounds) {
    this.bounds = bounds;
    this.element.classList.add('has-custom-size');
    this.element.style.setProperty('--window-left', `${bounds.left - this.origin.left}px`);
    this.element.style.setProperty('--window-top', `${bounds.top - this.origin.top}px`);
    this.element.style.setProperty('--window-width', `${bounds.width}px`);
    this.element.style.setProperty('--window-height', `${bounds.height}px`);
    this.onChange();
  }

  fitViewport(position) {
    this.origin = this.element.parentElement.getBoundingClientRect();
    this.apply(fitBounds({ ...this.bounds, left: this.bounds.left + position.x, top: this.bounds.top + position.y }, { width: innerWidth, height: innerHeight }));
  }
}
