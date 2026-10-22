// Refract only a small decorative surface. Text and controls stay on a crisp layer.
export function installDockGlass() {
  const size = 72;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) return;
  const pixels = context.createImageData(size, size);
  const radius = 17;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - size / 2;
      const dy = y - size / 2;
      const qx = Math.abs(dx) - (size / 2 - radius);
      const qy = Math.abs(dy) - (size / 2 - radius);
      const distance = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
      const edge = distance < 0 ? Math.max(0, 1 + distance / 9) : 0;
      const strength = Math.sin(edge * Math.PI) * .9;
      const index = (y * size + x) * 4;
      pixels.data[index] = Math.round(128 + dx / (size / 2) * strength * 110);
      pixels.data[index + 1] = Math.round(128 + dy / (size / 2) * strength * 110);
      pixels.data[index + 2] = 128;
      pixels.data[index + 3] = 255;
    }
  }
  context.putImageData(pixels, 0, 0);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = `<defs><filter id="dock-glass" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feImage href="${canvas.toDataURL()}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="lens-map"/><feDisplacementMap in="SourceGraphic" in2="lens-map" scale="12" xChannelSelector="R" yChannelSelector="G"/></filter></defs>`;
  document.body.append(svg);
}
