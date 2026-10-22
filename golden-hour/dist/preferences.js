let storageWarningShown = false;

function warnStorage(error) {
  if (storageWarningShown) return;
  storageWarningShown = true;
  console.warn('Preferences cannot be saved in this browser. Settings remain available for this visit.', error.name);
}

export function readPreference(key, fallback = null) {
  try { return localStorage.getItem(`kirti-${key}`) ?? fallback; }
  catch (error) { warnStorage(error); return fallback; }
}

export function savePreference(key, value) {
  try { localStorage.setItem(`kirti-${key}`, String(value)); return true; }
  catch (error) { warnStorage(error); return false; }
}
