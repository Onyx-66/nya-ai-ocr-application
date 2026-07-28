// Lightweight usage log: one entry per credit spent (OCR or translation).
const KEY = 'ocr_usage';
export function logUsage(entry) {
  const arr = getUsage();
  arr.push({ ts: Date.now(), ...entry });
  try { localStorage.setItem(KEY, JSON.stringify(arr.slice(-1000))); } catch {}
}
export function getUsage() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch { return []; }
}
export function clearUsage() { try { localStorage.removeItem(KEY); } catch {} }