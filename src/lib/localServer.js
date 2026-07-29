// Optional local OCR server endpoint — when set, ocrEngine.js can route
// processing to a self-hosted server (the future "external PC app") instead of
// the Base44 cloud function. Persisted in localStorage for offline reliability.
const KEY = 'mangaocr_local_server';

export function getLocalServer() {
  return localStorage.getItem(KEY) || '';
}
export function setLocalServer(url) {
  if (url) localStorage.setItem(KEY, url);
  else localStorage.removeItem(KEY);
}
export function hasLocalServer() {
  return !!getLocalServer();
}