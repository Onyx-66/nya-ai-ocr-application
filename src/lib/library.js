// Library: persist OCR/translation outputs locally and write them to the
// device as a structured folder:  nya ai ocr/library/[Serie]/ocr|translation/[lang]/Chapter N.ext
const KEY = 'nya_library_entries';
const ROOT_KEY = 'nya-root-handle';
const DB_NAME = 'nya_ai_ocr';
const STORE = 'handles';

/* ---------- localStorage entries ---------- */
export function getLibrary() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}
function saveAll(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
export function addEntry(e) {
  const all = getLibrary();
  const i = all.findIndex((x) => x.id === e.id);
  if (i >= 0) all[i] = e; else all.unshift(e);
  saveAll(all);
}
export function removeEntry(id) { saveAll(getLibrary().filter((x) => x.id !== id)); }
export function clearLibrary() { saveAll([]); }
export function markSaved(ids) {
  const set = new Set(ids);
  saveAll(getLibrary().map((x) => (set.has(x.id) ? { ...x, saved: true } : x)));
}

/* ---------- IndexedDB for the directory handle ---------- */
function openDb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export async function saveRootHandle(h) {
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(h, ROOT_KEY);
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
  db.close();
}
export async function getRootHandle() {
  try {
    const db = await openDb();
    const h = await new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readonly');
      const rq = tx.objectStore(STORE).get(ROOT_KEY);
      rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
    });
    db.close();
    return h || null;
  } catch { return null; }
}
export async function clearRootHandle() {
  try {
    const db = await openDb();
    await new Promise((res) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(ROOT_KEY); tx.oncomplete = res; });
    db.close();
  } catch {}
}

/* ---------- File System Access API ---------- */
export const fsSupported = typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';

export async function pickRoot() {
  if (!fsSupported) throw new Error('This browser cannot pick a folder. Use Download ZIP instead.');
  const h = await window.showDirectoryPicker({ mode: 'readwrite', id: 'nya-ai-ocr' });
  await saveRootHandle(h);
  return h;
}
async function ensurePerm(h) {
  if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
  return (await h.requestPermission({ mode: 'readwrite' })) === 'granted';
}

function safeName(s, fallback) { return (String(s || '').trim() || fallback).replace(/[\\/:*?"<>|]/g, '_'); }

export async function saveToLibrary(entries) {
  if (!entries.length) return { saved: 0 };
  let root = await getRootHandle();
  if (!root) root = await pickRoot();
  if (!(await ensurePerm(root))) throw new Error('Folder permission denied — reconnect the folder.');

  const nya = await root.getDirectoryHandle('nya ai ocr', { create: true });
  const lib = await nya.getDirectoryHandle('library', { create: true });
  let saved = 0;
  for (const e of entries) {
    const serieDir = await lib.getDirectoryHandle(safeName(e.serie, 'Untitled'), { create: true });
    const ext = e.format === 'md' ? 'md' : e.format === 'docx' ? 'docx' : 'txt';
    const fileName = `Chapter ${e.chapter}.${ext}`;
    const dir = e.type === 'translation'
      ? await (await serieDir.getDirectoryHandle('translation', { create: true })).getDirectoryHandle(safeName(e.language, 'Unknown'), { create: true })
      : await serieDir.getDirectoryHandle('ocr', { create: true });
    const fh = await dir.getFileHandle(fileName, { create: true });
    const w = await fh.createWritable();
    if (e.format === 'docx') { const { docxBlobFromText } = await import('@/lib/docx'); await w.write(await docxBlobFromText(e.content)); }
    else { await w.write(e.content); }
    await w.close();
    saved++;
  }
  markSaved(entries.map((e) => e.id));
  return { saved };
}

/* ---------- ZIP fallback ---------- */
export async function downloadZip(entries) {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const base = 'nya ai ocr/library/';
  for (const e of entries) {
    const serie = safeName(e.serie, 'Untitled');
    const ext = e.format === 'md' ? 'md' : e.format === 'docx' ? 'docx' : 'txt';
    const file = `Chapter ${e.chapter}.${ext}`;
    const path = e.type === 'translation'
      ? `${base}${serie}/translation/${safeName(e.language, 'Unknown')}/${file}`
      : `${base}${serie}/ocr/${file}`;
    if (e.format === 'docx') { const { docxBlobFromText } = await import('@/lib/docx'); zip.file(path, await docxBlobFromText(e.content)); }
    else { zip.file(path, e.content); }
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'nya ai ocr library.zip'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}