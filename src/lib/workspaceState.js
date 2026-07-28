// Persists workspace chapters + options so imported folders survive navigation away.
const KEY = 'ocr_workspace';
export function saveWorkspace(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}
export function loadWorkspace() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
export function clearWorkspace() { try { localStorage.removeItem(KEY); } catch {} }