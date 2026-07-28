import { useEffect, useRef, useState } from 'react';
import { getTemplates, getActiveTemplateId, setActiveTemplateId } from '@/lib/exportTemplates';
import { FileText, ChevronDown, Check } from 'lucide-react';

export default function ExportTemplateSelect({ onChange }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(() => getActiveTemplateId());
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const templates = getTemplates();
  const active = templates.find((t) => t.id === activeId) || null;

  const pick = (t) => {
    setActiveId(t.id); setActiveTemplateId(t.id);
    onChange && onChange(t);
    setOpen(false);
  };
  const clear = () => { setActiveId(null); setActiveTemplateId(null); onChange && onChange(null); setOpen(false); };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))]" >
        <FileText className="w-4 h-4 text-[hsl(var(--c-accent))] shrink-0" />
        <span className="flex-1 text-left truncate">{active ? active.name : 'No template (manual settings)'}</span>
        <ChevronDown className={`w-4 h-4 text-[hsl(var(--c-dim))] transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] shadow-xl">
          <button onClick={clear} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--c-dim))] hover:bg-[hsl(var(--c-soft))] text-left">
            {!activeId && <Check className="w-3.5 h-3.5 text-[hsl(var(--c-accent))]" />} No template (manual settings)
          </button>
          {templates.map((t) => (
            <button key={t.id} onClick={() => pick(t)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--c-text))] hover:bg-[hsl(var(--c-soft))] text-left border-t border-[hsl(var(--c-border))]">
              {activeId === t.id ? <Check className="w-3.5 h-3.5 text-[hsl(var(--c-accent))]" /> : <span className="w-3.5" />}
              <span className="flex-1 truncate">{t.name}</span>
              <span className="text-[10px] text-[hsl(var(--c-dim))] font-mono">{t.format} · {t.emptyLine ? 'spaced' : 'compact'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}