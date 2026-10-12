// Úložiště aplikace: jeden JSON dokument v localStorage prohlížeče. Nic se neodesílá na server.
const KEY = 'ocd-app-v1';
const blank = () => ({
  v: 1,
  consent: null,
  draft: null,
  assessments: [],
  progress: { done: [], active: null },
  exposures: [],
  texts: [],
  compulsions: [],
  timer: null,
});
let mem = null;

export function data() {
  if (mem) return mem;
  try {
    const raw = localStorage.getItem(KEY);
    mem = raw ? Object.assign(blank(), JSON.parse(raw)) : blank();
  } catch (e) {
    mem = blank();
  }
  return mem;
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data()));
    return true;
  } catch (e) {
    return false;
  }
}

export function canStore() {
  try {
    localStorage.setItem(KEY + '-t', '1');
    localStorage.removeItem(KEY + '-t');
    return true;
  } catch (e) {
    return false;
  }
}

export const hasConsent = () => !!data().consent;
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const exportJson = () => JSON.stringify(data(), null, 2);

export function importJson(text) {
  const o = JSON.parse(text);
  if (!o || o.v !== 1 || !Array.isArray(o.assessments) || !Array.isArray(o.exposures)) throw new Error('Neplatný soubor');
  mem = Object.assign(blank(), o);
  save();
}

export function wipe() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* nic */
  }
  mem = blank();
}

export function dayKey(ts) {
  const d = new Date(ts);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export const fmtDate = (ts) => new Date(ts).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
export const fmtDateLong = (ts) => new Date(ts).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });

export function latestAssessment() {
  const a = data().assessments;
  return a.length ? a[a.length - 1] : null;
}
