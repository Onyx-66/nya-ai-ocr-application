import { useState } from 'react';
import { getTemplates, addTemplate, updateTemplate, deleteTemplate, blankTemplate, getActiveTemplateId, setActiveTemplateId } from '@/lib/exportTemplates';
import { MARKER_TYPES } from '@/lib/markers';
import { Plus, Trash2, Check, Edit2, X } from 'lucide-react';

const FORMATS = [{ id: 'txt', label: '.txt' }, { id: 'md', label: '.md' }, { id: 'docx', label: '.docx' }];

export default function ExportTemplateManager() {
  const [templates, setTemplates] = useState(() => getTemplates());
  const [activeId, setActiveIdState] = useState(() => getActiveTemplateId());
  const [editing, setEditing] = useState(null); // template being edited

  const refresh = () => { setTemplates(getTemplates()); };
  const setActive = (id) => { setActiveIdState(id); setActiveTemplateId(id); };

  const startNew = () => setEditing(blankTemplate());
  const startEdit = (t) => setEditing(JSON.parse(JSON.stringify(t)));
  const saveEditing = () => {
    if (!editing.name.trim()) return;
    const exists = templates.find((t) => t.id === editing.id);
    if (exists) updateTemplate(editing.id, editing);
    else addTemplate(editing);
    setEditing(null); refresh();
  };
  const remove = (id) => { deleteTemplate(id); refresh(); if (activeId === id) setActive(null); };

  const inputCls = 'w-full bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] rounded-md px-2.5 py-1.5 text-sm font-mono text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))]';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[hsl(var(--c-dim))]">Save combinations of format, signs and spacing to apply with one click in the workspace.</p>
        <button onClick={startNew} className="flex items-center gap-1.5 text-xs bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-lg px-3 py-1.5 font-medium shrink-0">
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {editing && (
        <div className="rounded-lg border border-[hsl(var(--c-accent))] bg-[hsl(var(--c-input))] p-3 space-y-3">
          <div className="flex items-center gap-2">
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Template name" className="flex-1 bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] rounded-md px-2.5 py-1.5 text-sm text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))]" />
            <button onClick={saveEditing} className="flex items-center gap-1 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-md px-2.5 py-1.5 text-sm"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditing(null)} className="text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))] rounded-md px-2 py-1.5"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 p-1 bg-[hsl(var(--c-card))] rounded-md border border-[hsl(var(--c-border))]">
              {FORMATS.map((f) => (
                <button key={f.id} onClick={() => setEditing({ ...editing, format: f.id })} className={`px-3 py-1 rounded text-xs font-mono ${editing.format === f.id ? 'bg-[hsl(var(--c-accent))] text-white' : 'text-[hsl(var(--c-dim))]'}`}>{f.label}</button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-[hsl(var(--c-text))] cursor-pointer">
              <input type="checkbox" checked={editing.emptyLine} onChange={(e) => setEditing({ ...editing, emptyLine: e.target.checked })} className="accent-[hsl(var(--c-accent))]" /> Empty line after each bubble
            </label>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-auto pr-1">
            {MARKER_TYPES.map((t) => {
              const mk = editing.markers[t.id] || { prefix: '', suffix: '' };
              return (
                <div key={t.id} className="grid grid-cols-[90px_1fr_1fr] gap-1.5 items-center">
                  <span className="text-[11px] text-[hsl(var(--c-dim))] truncate">{t.label}</span>
                  <input value={mk.prefix} onChange={(e) => setEditing({ ...editing, markers: { ...editing.markers, [t.id]: { ...mk, prefix: e.target.value } } })} placeholder="prefix" className={inputCls} />
                  <input value={mk.suffix} onChange={(e) => setEditing({ ...editing, markers: { ...editing.markers, [t.id]: { ...mk, suffix: e.target.value } } })} placeholder="suffix" className={inputCls} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {templates.length === 0 && <p className="text-xs text-[hsl(var(--c-dim))] text-center py-4">No templates yet — click “New” to create one.</p>}
        {templates.map((t) => (
          <div key={t.id} className={`rounded-lg border p-3 flex items-center gap-3 ${activeId === t.id ? 'border-[hsl(var(--c-accent))] bg-[hsl(var(--c-soft))]' : 'border-[hsl(var(--c-border))] bg-[hsl(var(--c-input))]'}`}>
            <button onClick={() => setActive(activeId === t.id ? null : t.id)} className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-[hsl(var(--c-text))] truncate">{t.name}</p>
              <p className="text-[11px] text-[hsl(var(--c-dim))] font-mono">{t.format} · {t.emptyLine ? 'spaced' : 'compact'} · {Object.values(t.markers).filter((m) => m.prefix || m.suffix).length} markers</p>
            </button>
            {activeId === t.id && <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[hsl(var(--c-accent))]/15 text-[hsl(var(--c-accent))] shrink-0">Active</span>}
            <button onClick={() => startEdit(t)} className="text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))] shrink-0"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => remove(t.id)} className="text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))] shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}