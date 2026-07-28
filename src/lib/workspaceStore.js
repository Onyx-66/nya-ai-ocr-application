// Canonical workspace state (chapters + options) with pub/sub + persisted storage.
// Module-level so it survives component unmount / navigation; the OCR engine and
// the workspace UI both read and write through this store.
const KEY = 'ocr_workspace';
const DEFAULTS = {
  chapters: [], serieTitle: '', format: 'txt', translateEnabled: false,
  targetLanguage: 'English', emptyLine: false, uploadFolder: null
};
let state = { ...DEFAULTS };
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) state = { ...state, ...s }; } catch {}

const subs = new Set();
let pTimer = null;
function persist() {
  clearTimeout(pTimer);
  pTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }, 150);
}
function emit() { subs.forEach((cb) => cb()); }

export function flush() { clearTimeout(pTimer); try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} }
export function subscribe(cb) { subs.add(cb); cb(); return () => subs.delete(cb); }
export function getState() { return state; }
export function setState(patch) { state = { ...state, ...patch }; persist(); emit(); }
export function setChapters(chapters) { state = { ...state, chapters }; persist(); emit(); }
export function updateChapter(id, patch) {
  state = { ...state, chapters: state.chapters.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
  persist(); emit();
}
export function addChapters(list) { state = { ...state, chapters: [...state.chapters, ...list] }; persist(); emit(); }
export function removeChapter(id) { state = { ...state, chapters: state.chapters.filter((c) => c.id !== id) }; persist(); emit(); }