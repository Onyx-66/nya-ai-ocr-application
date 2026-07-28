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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[hsl(var(--c-dim))]">Signs applied to each detected text type. Edit them freely.</p>
        <button onClick={reset} className="flex items-center gap-1 text-xs text-[hsl(var(--c-accent))] hover:opacity-80">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
      <div className="space-y-2">
        {MARKER_TYPES.map((t) => {
          const mk = markers[t.id] || { prefix: '', suffix: '' };
          return (
            <div key={t.id} className="rounded-lg border border-[hsl(var(--c-border))] bg-[hsl(var(--c-input))] p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-[hsl(var(--c-text))]">{t.label}</span>
                <span className="text-xs text-[hsl(var(--c-dim))]">{t.desc}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={mk.prefix}
                  onChange={(e) => update(t.id, 'prefix', e.target.value)}
                  placeholder="prefix"
                  className="w-24 bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] rounded-md px-2 py-1 text-sm font-mono text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))]"
                />
                <span className="text-xs text-[hsl(var(--c-dim))]">+ text +</span>
                <input
                  value={mk.suffix}
                  onChange={(e) => update(t.id, 'suffix', e.target.value)}
                  placeholder="suffix"
                  className="w-24 bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] rounded-md px-2 py-1 text-sm font-mono text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))]"
                />
                <span className="ml-auto text-xs text-[hsl(var(--c-text-soft))] font-mono truncate">
                  {mk.prefix}sample{mk.suffix}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}