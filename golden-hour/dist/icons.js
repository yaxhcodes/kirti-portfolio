const paths = {
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  case: '<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a22 22 0 0 0 18 0M12 11v4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="4"/><path d="m3 6 9 7 9-7"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  arrowUp: '<path d="M6 18 18 6M6 6h12v12"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8m-8 4h5"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  settings: '<path d="m9.5 3-.7 2.2-2.2 1L4.4 6 2 10l1.5 1.8v2.4L2 16l2.4 4 2.2-.2 2.2 1 .7 2.2h5l.7-2.2 2.2-1 2.2.2L22 16l-1.5-1.8v-2.4L22 10l-2.4-4-2.2.2-2.2-1L14.5 3Z" transform="translate(1 -1) scale(.92)"/><circle cx="12" cy="12" r="3.5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  layers: '<path d="m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5"/>',
  chart: '<path d="M3 3v18h18M7 16l4-5 4 2 6-8"/>',
  cube: '<path d="m12 2 10 5v10l-10 5-10-5V7Zm0 10L2 7m10 5 10-5m-10 5v10M7 4.5l10 5"/>',
  tool: '<path d="M14 6a5 5 0 0 0-6 6L2.5 18a2.5 2.5 0 0 0 3.5 3.5L12 16a5 5 0 0 0 6-6l-4 4-4-4Z"/>',
  volume: '<path d="m11 3-6 5H2v8h3l6 5Zm4 5a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  muted: '<path d="m11 3-6 5H2v8h3l6 5Zm6 6 5 6m0-6-5 6"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5ZM20 2v4m-2-2h4"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  folder: '<path d="M3 7V5a2 2 0 0 1 2-2h5l3 3h6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M3 9h18"/>',
  book: '<path d="M12 5C8 2 4 3 2 4v15c3-1 6-1 10 1 4-2 7-2 10-1V4c-2-1-6-2-10 1Zm0 0v15"/>',
  camera: '<rect x="2" y="6" width="20" height="15" rx="3"/><path d="m7 6 2-3h6l2 3"/><circle cx="12" cy="13.5" r="4"/>',
  apple: '<path d="M16.8 12.7c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.2-2.6.8-3.3.8-.7 0-1.7-.8-2.9-.8-1.5 0-2.8.9-3.6 2.1-1.5 2.6-.4 6.4 1.1 8.5.7 1 1.5 2.1 2.6 2 1.1 0 1.5-.7 2.9-.7s1.8.7 3 .7 1.9-1 2.6-2c.8-1.2 1.1-2.4 1.2-2.4-.1 0-2.3-.9-2.3-3.1ZM14.4 6.1c.6-.8 1.1-1.8 1-2.9-.9 0-2 .6-2.7 1.3-.6.6-1.2 1.7-1.1 2.8 1 .1 2-.5 2.8-1.2Z" fill="currentColor" stroke="none"/>',
};
export function icon(name, className = '') {
  return `<svg class="icon ${className}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
}
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
