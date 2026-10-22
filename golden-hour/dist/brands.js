import { escapeHtml as e } from './icons.js';

const brands = {
  mphasis: 'mphasis-icon.png', capgemini: 'capgemini.svg', acnovate: 'acnovate-icon.png',
  hp: 'hp-icon.png', synchrony: 'synchrony.png', adidas: 'adidas.svg',
  linkedin: 'linkedin.png', github: 'github.svg',
};

export function brandIcon(id) {
  return brands[id] ? `<img class="brand-logo brand-${e(id)}" src="assets/brands/${brands[id]}" alt="" width="28" height="28" decoding="async">` : '';
}
