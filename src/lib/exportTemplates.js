import { DEFAULT_MARKERS } from '@/lib/markers';

const KEY = 'mangaocr_export_templates';
const ACTIVE_KEY = 'mangaocr_active_template';

export function getTemplates() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function saveTemplates(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
export function addTemplate(t) { const list = getTemplates(); list.push(t); saveTemplates(list); return t; }
export function updateTemplate(id, patch) {
  saveTemplates(getTemplates().map((t) => (t.id === id ? { ...t, ...patch } : t)));
}
export function deleteTemplate(id) {
  saveTemplates(getTemplates().filter((t) => t.id !== id));
  if (getActiveTemplateId() === id) setActiveTemplateId(null);
}
export function getActiveTemplateId() { return localStorage.getItem(ACTIVE_KEY) || null; }
export function setActiveTemplateId(id) {
  if (id) localStorage.setItem(ACTIVE_KEY, id); else localStorage.removeItem(ACTIVE_KEY);
}
export function getActiveTemplate() {
  const id = getActiveTemplateId();
  return getTemplates().find((t) => t.id === id) || null;
}

// Seed sensible defaults once.
export function ensureDefaultTemplates() {
  if (getTemplates().length) return;
  saveTemplates([
    { id: crypto.randomUUID(), name: 'Plain text', format: 'txt', markers: { ...DEFAULT_MARKERS }, emptyLine: false },
    { id: crypto.randomUUID(), name: 'Markdown', format: 'md', markers: { ...DEFAULT_MARKERS }, emptyLine: false },
    { id: crypto.randomUUID(), name: 'Spaced dialogue', format: 'txt', markers: { ...DEFAULT_MARKERS }, emptyLine: true },
  ]);
}

export function blankTemplate() {
  return { id: crypto.randomUUID(), name: 'New template', format: 'txt', markers: { ...DEFAULT_MARKERS }, emptyLine: false };
}