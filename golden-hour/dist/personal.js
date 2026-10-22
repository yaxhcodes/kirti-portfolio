import { personalFolders } from './profile.js';
import { icon, escapeHtml as e } from './icons.js';

function folderIcon(id) {
  return `<svg class="desktop-folder-icon" viewBox="0 0 80 68" aria-hidden="true"><defs><linearGradient id="folder-back-${id}" x2="0" y2="1"><stop stop-color="#97c8e7"/><stop offset="1" stop-color="#6da5ce"/></linearGradient><linearGradient id="folder-front-${id}" x2="0" y2="1"><stop stop-color="#acd6f0"/><stop offset=".2" stop-color="#8fc5e8"/><stop offset="1" stop-color="#68a8d5"/></linearGradient></defs><path d="M5 17a5 5 0 0 1 5-5h23l7 7h30a5 5 0 0 1 5 5v32a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5Z" fill="url(#folder-back-${id})" stroke="#5d94bc"/><path d="M9 23h62v29H9Z" fill="#e5f0f8"/><rect x="4" y="27" width="72" height="35" rx="5" fill="url(#folder-front-${id})" stroke="#649cc4"/><path d="M10 28h60" stroke="#e1f4ff" stroke-opacity=".9"/></svg>`;
}

export function desktopFolders() {
  return personalFolders.map((folder, index) => `<button class="desktop-folder" data-nav="${e(folder.id)}" style="--folder-index:${index}" aria-label="Open ${e(folder.label)} folder" aria-description="Drag to move; release to snap to the grid. Shift and arrow keys move between free slots." aria-keyshortcuts="Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight">${folderIcon(folder.id)}<span class="desktop-folder-label">${e(folder.label)}</span><small>${folder.entries.length} items</small></button>`).join('');
}

function artwork(entry) {
  return `<div class="sample-art art-${e(entry.art)}" aria-hidden="true"></div>`;
}

export function personalFolderView(id) {
  const folder = personalFolders.find(item => item.id === id);
  if (!folder) return '';
  return `<div class="page personal-page"><div class="personal-heading"><div><h1>${e(folder.label)}</h1><p>${e(folder.description)}</p></div>${folder.sample ? '<span class="sample-badge">Sample content</span>' : ''}</div><div class="personal-files ${folder.id === 'snapshots' ? 'snapshot-files' : ''}">${folder.entries.map(entry => `<button class="personal-file" data-personal-item="${e(folder.id)}/${e(entry.id)}">${entry.art ? artwork(entry) : `<span class="personal-file-icon ${folder.color}">${icon(entry.icon)}</span>`}<strong>${e(entry.title)}</strong><span>${e(entry.summary)}</span><small>${e(entry.type)}</small></button>`).join('')}</div><p class="personal-folder-footer">${folder.entries.length} items</p></div>`;
}

export function personalDetail(key) {
  const [folderId, entryId] = key.split('/');
  const folder = personalFolders.find(item => item.id === folderId);
  const entry = folder?.entries.find(item => item.id === entryId);
  if (!entry) return '';
  return `<button class="dialog-close icon-button" data-close="personal-dialog" aria-label="Close personal item">${icon('close')}</button><div class="personal-preview">${entry.art ? artwork(entry) : `<span class="personal-file-icon ${folder.color}">${icon(entry.icon)}</span>`}${folder.sample ? '<span class="sample-badge">Sample content</span>' : ''}<h2>${e(entry.title)}</h2><p>${e(entry.body)}</p></div>`;
}
