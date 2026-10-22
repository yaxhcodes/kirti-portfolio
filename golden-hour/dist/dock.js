const spring = { stiffness: 330, damping: 24, peak: 1.62, radius: 115 };

export class DockMagnifier {
  constructor(dock) {
    this.dock = dock;
    this.buttons = [...dock.querySelectorAll('.dock-item')];
    this.tooltip = dock.querySelector('#dock-tooltip');
    this.hoveredButton = null;
    this.focusedButton = null;
    this.keyboardFocus = false;
    this.tooltipWidth = 0;
    this.finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.pointer = null;
    this.frame = null;
    this.previousTime = null;
    this.dock.classList.add('has-magnification');
    this.measure();
    dock.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      this.hoveredButton = event.target.closest('.dock-item');
      this.updateTooltip();
      if (!this.enabled) return;
      this.pointer = event.clientX - this.center;
      this.start();
    });
    dock.addEventListener('pointerleave', () => {
      this.hoveredButton = null;
      this.pointer = null;
      this.updateTooltip();
      this.start();
    });
    dock.addEventListener('focusin', event => {
      this.focusedButton = this.keyboardFocus ? event.target.closest('.dock-item') : null;
      this.updateTooltip();
    });
    dock.addEventListener('focusout', event => {
      this.focusedButton = this.keyboardFocus ? event.relatedTarget?.closest('.dock-item') || null : null;
      this.updateTooltip();
    });
    document.addEventListener('keydown', event => { if (event.key === 'Tab') this.keyboardFocus = true; });
    document.addEventListener('pointerdown', () => {
      this.keyboardFocus = false;
      this.focusedButton = null;
      this.updateTooltip();
    });
    window.addEventListener('resize', () => this.measure());
    this.finePointer.addEventListener?.('change', () => this.measure());
    this.reducedMotion.addEventListener?.('change', () => this.measure());
  }

  get enabled() { return this.finePointer.matches && !this.reducedMotion.matches && innerWidth > 760; }

  measure() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.previousTime = null;
    this.pointer = null;
    this.dock.classList.remove('is-magnifying');
    this.buttons.forEach(button => {
      button.style.removeProperty('width');
      button.style.removeProperty('--dock-scale');
      button.style.removeProperty('--dock-lift');
    });
    const dockRect = this.dock.getBoundingClientRect();
    this.center = dockRect.left + dockRect.width / 2;
    this.baseWidth = dockRect.width;
    this.padding = parseFloat(getComputedStyle(this.dock).paddingLeft) || 0;
    this.items = this.buttons.map(button => {
      const rect = button.getBoundingClientRect();
      return {
        button, width: rect.width, iconWidth: button.querySelector('.dock-icon').getBoundingClientRect().width,
        center: rect.left + rect.width / 2 - this.center, left: rect.left - dockRect.left,
        scale: 1, velocity: 0,
      };
    });
    this.updateLens();
    this.updateTooltip();
  }

  start() {
    if (!this.enabled) return;
    this.dock.classList.add('is-magnifying');
    if (this.frame === null) {
      this.previousTime = null;
      this.frame = requestAnimationFrame(time => this.step(time));
    }
  }

  extraWidth(item) { return Math.max(0, item.scale - 1) * item.iconWidth * .94; }

  step(time) {
    const dt = this.previousTime === null ? 1 / 60 : Math.max(1 / 240, Math.min((time - this.previousTime) / 1000, 1 / 30));
    this.previousTime = time;
    const totalExtra = this.items.reduce((sum, item) => sum + this.extraWidth(item), 0);
    let precedingExtra = 0;
    let moving = false;
    for (const item of this.items) {
      const extra = this.extraWidth(item);
      const center = item.center + precedingExtra + extra / 2 - totalExtra / 2;
      const distance = this.pointer === null ? spring.radius : Math.abs(this.pointer - center);
      const influence = Math.cos(Math.min(distance / spring.radius, 1) * Math.PI / 2) ** 2;
      const target = 1 + (spring.peak - 1) * influence;
      const acceleration = spring.stiffness * (target - item.scale) - spring.damping * item.velocity;
      item.velocity += acceleration * dt;
      item.scale += item.velocity * dt;
      moving ||= Math.abs(target - item.scale) > .0006 || Math.abs(item.velocity) > .004;
      item.button.style.width = `${(item.width + this.extraWidth(item)).toFixed(2)}px`;
      item.button.style.setProperty('--dock-scale', item.scale.toFixed(4));
      item.button.style.setProperty('--dock-lift', (Math.max(0, item.scale - 1) * 12).toFixed(3));
      precedingExtra += extra;
    }
    this.updateLens();
    this.updateTooltip();
    if (moving) this.frame = requestAnimationFrame(next => this.step(next));
    else {
      this.frame = null;
      this.previousTime = null;
      if (this.pointer === null) this.measure();
    }
  }

  updateLens() {
    let precedingExtra = 0;
    for (const item of this.items) {
      if (item.button.classList.contains('active')) {
        const lens = this.dock.querySelector('.dock-lens');
        lens.style.transform = `translateX(${item.left + precedingExtra - this.padding}px)`;
        lens.style.width = `${item.width + this.extraWidth(item)}px`;
        break;
      }
      precedingExtra += this.extraWidth(item);
    }
  }

  updateTooltip() {
    const target = this.hoveredButton || this.focusedButton;
    this.tooltip.hidden = !target;
    if (!target) return;
    let precedingExtra = 0;
    for (const item of this.items) {
      if (item.button === target) {
        if (this.tooltip.textContent !== target.dataset.tooltip) {
          this.tooltip.textContent = target.dataset.tooltip;
          this.tooltipWidth = this.tooltip.getBoundingClientRect().width;
        }
        const totalExtra = this.items.reduce((sum, sibling) => sum + this.extraWidth(sibling), 0);
        const dockLeft = this.center - (this.baseWidth + totalExtra) / 2;
        const center = dockLeft + item.left + precedingExtra + (item.width + this.extraWidth(item)) / 2;
        const gutter = this.tooltipWidth / 2 + 12;
        const constrained = Math.max(gutter, Math.min(innerWidth - gutter, center));
        this.tooltip.style.left = `${constrained - dockLeft}px`;
        this.tooltip.style.setProperty('--tooltip-rise', `${12 + Math.max(0, item.scale - 1) * (item.iconWidth + 12)}px`);
        return;
      }
      precedingExtra += this.extraWidth(item);
    }
  }
}
