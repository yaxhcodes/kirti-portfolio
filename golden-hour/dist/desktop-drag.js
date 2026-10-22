// Shared pointer handling keeps desktop items clickable after a tap, but not after a drag.
export function installDesktopDrag(root, { selector, geometry, place, commit }) {
  let drag = null, suppressed = null;
  root.addEventListener('pointerdown', event => {
    const button = event.target.closest(selector);
    if (!button || event.button !== 0 || drag) return;
    const bounds = geometry(button);
    const rect = button.getBoundingClientRect();
    drag = { ...bounds, button, pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left - bounds.workspace.left, top: rect.top - bounds.workspace.top, moved: false };
    button.setPointerCapture(event.pointerId);
  });
  root.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    event.preventDefault();
    drag.moved = true;
    drag.button.classList.add('is-dragging');
    place(drag.button, { x: drag.left + dx, y: drag.top + dy }, drag);
  });
  const end = event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const current = drag;
    drag = null;
    current.button.classList.remove('is-dragging');
    if (!current.moved) return;
    commit(current.button, { x: parseFloat(current.button.style.left), y: parseFloat(current.button.style.top) }, current);
    if (event.type === 'pointerup') {
      suppressed = current.button;
      setTimeout(() => { suppressed = null; }, 0);
    }
  };
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) root.addEventListener(event, end);
  root.addEventListener('click', event => {
    if (suppressed && event.target.closest(selector) === suppressed) {
      event.preventDefault(); event.stopImmediatePropagation(); suppressed = null;
    }
  }, true);
  return { cancel: () => { if (drag) end({ type: 'pointercancel', pointerId: drag.pointerId }); } };
}

export function placeDesktopItem(button, position, geometry) {
  button.style.left = `${Math.max(geometry.edge, Math.min(geometry.maxX, position.x))}px`;
  button.style.top = `${Math.max(geometry.edge, Math.min(geometry.maxY, position.y))}px`;
  button.style.right = 'auto';
}

export function overlaps(a, b, gap = 8) {
  return b.width > 0 && b.height > 0 && a.x < b.x + b.width + gap && a.x + a.width > b.x - gap && a.y < b.y + b.height + gap && a.y + a.height > b.y - gap;
}
