const intersects = (a, b) => a.left < b.right + 24 && a.right > b.left - 24 && a.top < b.bottom + 24 && a.bottom > b.top - 24;

function sceneStyles() {
  const sheets = [...document.querySelectorAll('link[rel="stylesheet"],style')].map(node => node.sheet).filter(Boolean);
  const css = sheets.map(sheet => [...sheet.cssRules].map(rule => rule.cssText).join('\n')).join('\n');
  if (!css) throw new Error('The scene stylesheet is not available');
  return css;
}

// A menu-sized lens can sample our own static UI without filtering its controls.
// Shadow DOM isolates decorative copies from app selectors and keyboard focus.
export class GlassScene {
  constructor(bounds) {
    this.element = document.createElement('span');
    this.element.className = 'liquid-scene';
    this.element.setAttribute('inert', '');
    this.element.setAttribute('aria-hidden', 'true');
    this.root = this.element.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `${sceneStyles()}\n:host { display:block; pointer-events:none; } .scene-world { position:absolute; inset:0; overflow:hidden; pointer-events:none; } .scene-world *, .scene-world *:before, .scene-world *:after { animation:none !important; transition:none !important; pointer-events:none !important; }`;
    this.world = document.createElement('div');
    this.world.className = 'scene-world';
    this.root.append(style, this.world);
    this.refresh(bounds);
  }

  refresh(bounds) {
    this.world.replaceChildren();
    this.scrollPositions = [];
    const wallpaper = document.querySelector('body>.wallpaper')?.cloneNode(true);
    if (wallpaper) {
      wallpaper.querySelector('.wallpaper-grain')?.remove();
      wallpaper.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0';
      this.world.append(wallpaper);
    }
    const candidates = [...document.querySelectorAll('#profile-widget,.desktop-folder,#window-layer>.portfolio-window')]
      .filter(element => !element.hidden && getComputedStyle(element).visibility !== 'hidden')
      .map(element => ({ element, rect: element.getBoundingClientRect(), order: element.classList.contains('portfolio-window') ? 100 + Number(element.style.zIndex || 0) : 1 }))
      .filter(item => item.rect.width > 0 && item.rect.height > 0 && intersects(bounds, item.rect))
      .sort((a, b) => a.order - b.order);
    for (const { element, rect } of candidates) {
      const copy = element.cloneNode(true);
      copy.querySelectorAll('.liquid-optics,.resize-handle').forEach(node => node.remove());
      copy.style.position = 'absolute';
      copy.style.left = `${rect.left}px`; copy.style.top = `${rect.top}px`;
      copy.style.width = `${rect.width}px`; copy.style.height = `${rect.height}px`;
      copy.style.margin = '0'; copy.style.transform = 'none';
      copy.style.zIndex = String(this.world.children.length);
      this.world.append(copy);
      const originals = element.querySelectorAll('.content-scroll');
      copy.querySelectorAll('.content-scroll').forEach((node, index) => {
        this.scrollPositions.push({ node, top: originals[index].scrollTop, left: originals[index].scrollLeft });
      });
    }
  }

  restoreScroll() {
    if (!this.scrollPositions.length) return;
    // The host must be attached before scroll offsets can be applied to copies.
    void this.world.clientHeight;
    for (const { node, top, left } of this.scrollPositions) { node.scrollTop = top; node.scrollLeft = left; }
    this.scrollPositions = [];
  }
}
