import { useState } from 'react';
import { MARKER_TYPES, getMarkers, saveMarkers, DEFAULT_MARKERS } from '@/lib/markers';
import { RotateCcw } from 'lucide-react';

export default function MarkerSettings() {
  const [markers, setMarkers] = useState(() => getMarkers());

  const update = (id, field, val) => {
    const next = { ...markers, [id]: { ...markers[id], [field]: val } };
    setMarkers(next);
    saveMarkers(next);
  };

  const reset = () => {
    setMarkers({ ...DEFAULT_MARKERS });
    saveMarkers({ ...DEFAULT_MARKERS });
  };

  const inputCls = 'w-full bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] rounded-md px-2.5 py-1.5 text-sm font-mono text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))]';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[hsl(var(--c-dim))]">Signs applied to each detected text type.</p>
        <button onClick={reset} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-accent))] hover:opacity-80 shrink-0">
          <RotateCcw className="w-3.5 h-3.5" /> Reset all
        </button>
      </div>

      <div className="space-y-2">
        {MARKER_TYPES.map((t) => {
          const mk = markers[t.id] || { prefix: '', suffix: '' };
          return (
            <div key={t.id} className="rounded-lg border border-[hsl(var(--c-border))] bg-[hsl(var(--c-input))] p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-[hsl(var(--c-text))]">{t.label}</span>
                <span className="text-[11px] text-[hsl(var(--c-dim))] text-right">{t.desc}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-[hsl(var(--c-dim))] mb-1">Prefix</label>
                  <input value={mk.prefix} onChange={(e) => update(t.id, 'prefix', e.target.value)} placeholder="—" className={inputCls} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wide text-[hsl(var(--c-dim))] mb-1">Suffix</label>
                  <input value={mk.suffix} onChange={(e) => update(t.id, 'suffix', e.target.value)} placeholder="—" className={inputCls} />
                </div>
              </div>
              <div className="mt-2 px-2.5 py-1.5 rounded-md bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))]">
                <span className="text-xs text-[hsl(var(--c-text-soft))] font-mono break-all">{mk.prefix}<span className="text-[hsl(var(--c-dim))]">sample</span>{mk.suffix}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}