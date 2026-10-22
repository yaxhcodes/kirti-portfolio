import { readPreference, savePreference } from './preferences.js';

const preference = 'welcome-seen-v1';

export const greetings = [
  { id: 'hello', language: 'en', text: 'hello' },
  { id: 'namaste', language: 'hi', text: 'नमस्ते' },
  { id: 'bonjour', language: 'fr', text: 'bonjour' },
  { id: 'konnichiwa', language: 'ja', text: 'こんにちは' },
  { id: 'hola', language: 'es', text: 'hola' },
];

const stepDuration = 1180;
const fadeDuration = 500;

function claimFirstVisit() {
  if (readPreference(preference) === 'true') return false;
  // Session storage avoids repeated intros when persistent storage is restricted.
  let seenInSession = false;
  try { seenInSession = sessionStorage.getItem(`kirti-${preference}`) === 'true'; }
  catch (error) { console.warn('Welcome session preference is unavailable:', error.name); }
  if (seenInSession) return false;
  if (savePreference(preference, true)) return true;
  try { sessionStorage.setItem(`kirti-${preference}`, 'true'); return true; }
  catch (error) {
    console.warn('Skipping the welcome animation because its dismissal cannot be saved:', error.name);
    return false;
  }
}

export function showFirstVisitWelcome({ replay = false } = {}) {
  const dialog = document.querySelector('#welcome');
  if (!dialog?.showModal || dialog.open || (!replay && !claimFirstVisit())) return false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!replay && reducedMotion) return false;
  const words = greetings.map(greeting => {
    const word = document.createElement('span');
    word.className = 'welcome-word';
    word.dataset.greeting = greeting.id;
    word.lang = greeting.language;
    word.textContent = greeting.text;
    return word;
  });
  dialog.querySelector('.welcome-words').replaceChildren(...words);
  const selectGreeting = index => {
    dialog.dataset.greeting = greetings[index].id;
    words.forEach((word, wordIndex) => word.classList.toggle('is-current', wordIndex === index));
  };
  const timers = [];
  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    timers.forEach(clearTimeout);
    window.removeEventListener('pagehide', dismiss);
    dialog.removeEventListener('close', dismiss);
    dialog.removeEventListener('cancel', dismiss);
    dialog.querySelector('[data-dismiss-welcome]').removeEventListener('click', dismiss);
    dialog.close();
  };
  dialog.classList.remove('is-leaving');
  dialog.addEventListener('close', dismiss, { once: true });
  dialog.addEventListener('cancel', dismiss, { once: true });
  dialog.querySelector('[data-dismiss-welcome]').addEventListener('click', dismiss, { once: true });
  window.addEventListener('pagehide', dismiss, { once: true });
  dialog.showModal();
  const start = () => {
    if (dismissed) return;
    selectGreeting(0);
    if (!reducedMotion) {
      greetings.slice(1).forEach((_, index) => timers.push(setTimeout(() => selectGreeting(index + 1), stepDuration * (index + 1))));
      timers.push(setTimeout(() => { dialog.classList.add('is-leaving'); }, stepDuration * greetings.length));
      timers.push(setTimeout(dismiss, stepDuration * greetings.length + fadeDuration));
    }
  };
  if (document.fonts?.load) {
    let started = false;
    const startOnce = () => {
      if (started || dismissed) return;
      started = true;
      clearTimeout(fontWait);
      start();
    };
    const fontWait = setTimeout(startOnce, 600);
    timers.push(fontWait);
    Promise.all([
      document.fonts.load('600 160px "Welcome Script"', 'hello bonjour hola'),
      document.fonts.load('400 130px "Welcome Devanagari"', 'नमस्ते'),
      document.fonts.load('400 90px "Welcome Japanese"', 'こんにちは'),
    ]).catch(error => console.warn('Welcome fonts could not load; using system lettering:', error.name)).then(startOnce);
  } else {
    start();
  }
  return true;
}
