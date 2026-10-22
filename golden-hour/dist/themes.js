export const modes = { light: 'Light', dark: 'Dark' };

export const themes = {
  silver: {
    label: 'Silver', description: 'Cool neutrals',
    light: { accent: '#0066cc', soft: '#dfeaf7', panel: '255, 255, 255', surface: '245, 245, 247', tint: '122, 139, 160', wallpaper: '#667c98', folds: ['#294c78', '#7f8fa6', '#436b7b'] },
    dark: { accent: '#8bbcff', soft: '#253c57', panel: '28, 28, 30', surface: '44, 44, 46', tint: '91, 117, 159', wallpaper: '#121c2b', folds: ['#1d3656', '#3a4c65', '#22494d'] },
  },
  sage: {
    label: 'Sage', description: 'Soft botanicals',
    light: { accent: '#34634f', soft: '#e0eae3', panel: '252, 253, 251', surface: '240, 244, 239', tint: '96, 135, 111', wallpaper: '#667e74', folds: ['#354e48', '#7d9283', '#486c62'] },
    dark: { accent: '#a3c3ae', soft: '#293c33', panel: '24, 31, 27', surface: '36, 46, 40', tint: '107, 146, 121', wallpaper: '#101e19', folds: ['#233d32', '#40594b', '#1d3733'] },
  },
  coffee: {
    label: 'Coffee', description: 'Warm espresso',
    light: { accent: '#76543c', soft: '#eee3d6', panel: '253, 250, 246', surface: '243, 237, 229', tint: '157, 125, 95', wallpaper: '#8d7969', folds: ['#574638', '#9b8977', '#6f6157'] },
    dark: { accent: '#d9b898', soft: '#45352a', panel: '32, 27, 24', surface: '47, 39, 33', tint: '139, 108, 80', wallpaper: '#1d1713', folds: ['#35281e', '#64503d', '#3f332b'] },
  },
  ocean: {
    label: 'Ocean', description: 'Coastal blue',
    light: { accent: '#2d628a', soft: '#e1edf5', panel: '250, 252, 254', surface: '235, 242, 247', tint: '103, 143, 173', wallpaper: '#5c7d96', folds: ['#234d70', '#7892ab', '#426c80'] },
    dark: { accent: '#91c1df', soft: '#203e52', panel: '22, 29, 36', surface: '33, 43, 54', tint: '80, 125, 158', wallpaper: '#0e1925', folds: ['#173850', '#34576b', '#173d4b'] },
  },
  rosewood: {
    label: 'Rosewood', description: 'Muted rose',
    light: { accent: '#895961', soft: '#f0e3e7', panel: '254, 250, 251', surface: '245, 235, 238', tint: '166, 125, 141', wallpaper: '#8a747e', folds: ['#59414f', '#9d8891', '#6d606f'] },
    dark: { accent: '#d8acba', soft: '#4a303d', panel: '33, 26, 31', surface: '47, 36, 44', tint: '149, 105, 124', wallpaper: '#211820', folds: ['#3c2735', '#684c5b', '#3b3041'] },
  },
};

export function resolveAppearance(savedTheme, savedMode) {
  const legacy = { pearl: 'silver', dusk: 'silver' };
  const theme = legacy[savedTheme] || savedTheme;
  return {
    theme: Object.hasOwn(themes, theme) ? theme : 'silver',
    mode: Object.hasOwn(modes, savedMode) ? savedMode : savedTheme === 'dusk' ? 'dark' : 'light',
  };
}

export function themeTokens(theme, mode) {
  const variant = themes[theme]?.[mode];
  if (!variant) throw new Error(`Unknown appearance: ${theme}/${mode}`);
  return {
    '--accent': variant.accent, '--accent-soft': variant.soft,
    '--panel': variant.panel, '--surface': variant.surface,
    '--glass-tint': variant.tint, '--wallpaper': variant.wallpaper,
    '--fold-1': variant.folds[0], '--fold-2': variant.folds[1], '--fold-3': variant.folds[2],
  };
}
