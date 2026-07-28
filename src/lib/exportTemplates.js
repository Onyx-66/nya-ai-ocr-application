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

// Seed sensible defaults. Additive: never remove user templates, only add
// any built-in default that is missing (matched by name) so new defaults
// (e.g. the .docx template) also appear for existing users.
const DEFAULT_TEMPLATE_LIST = [
  { name: 'Plain text', format: 'txt', emptyLine: false },
  { name: 'Markdown', format: 'md', emptyLine: false },
  { name: 'Word document', format: 'docx', emptyLine: false },
  { name: 'Spaced dialogue', format: 'txt', emptyLine: true },
];
export function ensureDefaultTemplates() {
  const existing = getTemplates();
  const have = new Set(existing.map((t) => t.name));
  const missing = DEFAULT_TEMPLATE_LIST.filter((d) => !have.has(d.name));
  if (!missing.length) return;
  saveTemplates([
    ...existing,
    ...missing.map((d) => ({ id: crypto.randomUUID(), markers: { ...DEFAULT_MARKERS }, ...d })),
  ]);
}

export function blankTemplate() {
  return { id: crypto.randomUUID(), name: 'New template', format: 'txt', markers: { ...DEFAULT_MARKERS }, emptyLine: false };
}