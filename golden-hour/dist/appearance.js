import { themes, modes, resolveAppearance, themeTokens } from './themes.js';
import { readPreference } from './preferences.js';

export function appearancePreferences(read) {
  return {
    ...resolveAppearance(read('theme'), read('mode')),
    glass: Math.max(35, Math.min(95, Number(read('glass', 72)) || 72)),
    tinted: read('tint', 'false') === 'true',
  };
}

export function applyAppearance(root, appearance) {
  root.dataset.theme = appearance.theme;
  root.dataset.mode = appearance.mode;
  root.dataset.tint = appearance.tinted ? 'tinted' : 'clear';
  for (const [token, value] of Object.entries(themeTokens(appearance.theme, appearance.mode))) root.style.setProperty(token, value);
  root.style.setProperty('--glass-opacity', appearance.glass / 100);
  const meta = root.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = themes[appearance.theme][appearance.mode].wallpaper;
}

export function readAppearance() { return appearancePreferences(readPreference); }

// Generate the synchronous head script from the same functions used by the app.
export function appearanceBootScript() {
  const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
  return `(() => {\nconst themes = ${json(themes)};\nconst modes = ${json(modes)};\n${resolveAppearance.toString()}\n${themeTokens.toString()}\n${appearancePreferences.toString()}\n${applyAppearance.toString()}\nlet storage, warned = false;\nconst warn = error => { if (!warned) { warned = true; console.warn('Saved appearance is unavailable:', error.name); } };\ntry { storage = window.localStorage; } catch (error) { warn(error); }\nconst read = (key, fallback = null) => { try { return storage?.getItem('kirti-' + key) ?? fallback; } catch (error) { warn(error); return fallback; } };\napplyAppearance(document.documentElement, appearancePreferences(read));\n})();`;
}
