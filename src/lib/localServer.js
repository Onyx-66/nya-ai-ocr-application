// Optional local server endpoints for each pipeline stage. When set, that
// stage routes to a self-hosted controller instead of the Base44 cloud
// function. Persisted in localStorage (one key per stage). The OCR key is
// kept as the original 'mangaocr_local_server' for backward compatibility.
const KEYS = {
  ocr: 'mangaocr_local_server',
  cleaning: 'mangaocr_local_server_cleaning',
  translation: 'mangaocr_local_server_translation',
  typesetting: 'mangaocr_local_server_typesetting',
};

export const STAGES = ['ocr', 'cleaning', 'translation', 'typesetting'];

export function getLocalServerFor(stage) {
  const key = KEYS[stage] || `mangaocr_local_server_${stage}`;
  return localStorage.getItem(key) || '';
}

export function setLocalServerFor(stage, url) {
  const key = KEYS[stage] || `mangaocr_local_server_${stage}`;
  if (url) localStorage.setItem(key, url);
  else localStorage.removeItem(key);
}

export function hasLocalServer(stage) {
  return !!getLocalServerFor(stage);
}

export function getStageModes() {
  return Object.fromEntries(STAGES.map((s) => [s, hasLocalServer(s) ? 'local' : 'cloud']));
}

// Backward-compatible OCR aliases (ocrEngine.js imports these)
export function getLocalServer() { return getLocalServerFor('ocr'); }
export function setLocalServer(url) { setLocalServerFor('ocr', url); }