import { navigation, personalFolders } from './profile.js';

const sections = new Set([...navigation.map(item => item.id), ...personalFolders.map(item => item.id), 'resume']);

export function isSection(id) { return sections.has(id); }

export function initialSection(hash) {
  const id = hash.replace(/^#/, '');
  return isSection(id) ? id : 'about';
}
