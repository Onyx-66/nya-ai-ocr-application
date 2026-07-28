import { useState } from 'react';
import { getDefaults, setDefault } from '@/lib/appDefaults';
import LanguageSelect from '@/components/batch/LanguageSelect';
import { Switch } from '@/components/ui/switch';
import { Settings2 } from 'lucide-react';

const FORMATS = [{ id: 'txt', label: '.txt' }, { id: 'md', label: '.md' }];

export default function DefaultSettings() {
  const d = getDefaults();
  const [format, setFormat] = useState(d.format);
  const [translate, setTranslate] = useState(d.translate);
  const [language, setLanguage] = useState(d.language);
  const [serie, setSerie] = useState(d.serie);
  const [emptyLine, setEmptyLine] = useState(d.emptyLine);

  return (
    <div className="space-y-4">
      <p className="text-xs text-[hsl(var(--c-dim))]">These apply to new sessions of the workspace.</p>

      <div>
        <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Default serie title</label>
        <input
          value={serie}
          onChange={(e) => { setSerie(e.target.value); setDefault('serie', e.target.value); }}
          placeholder="e.g. Solo Leveling"
          className="w-full bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none focus:border-[hsl(var(--c-accent))]"
        />
      </div>

      <div>
        <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Default output format</label>
        <div className="flex gap-1 p-1 bg-[hsl(var(--c-input))] rounded-lg border border-[hsl(var(--c-border))] w-fit">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFormat(f.id); setDefault('format', f.id); }}
              className={`px-4 py-1.5 rounded-md text-sm font-mono transition-colors ${format === f.id ? 'bg-[hsl(var(--c-accent))] text-white' : 'text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]'}`}
            >{f.label}</button>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between cursor-pointer">
        <span className="flex items-center gap-2 text-sm text-[hsl(var(--c-text))]"><Settings2 className="w-4 h-4 text-[hsl(var(--c-accent))]" /> Translate by default</span>
        <Switch checked={translate} onCheckedChange={(v) => { setTranslate(v); setDefault('translate', v); }} className="data-[state=checked]:bg-[hsl(var(--c-accent))]" />
      </label>

      {translate && (
        <div>
          <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Default target language</label>
          <LanguageSelect value={language} onChange={(v) => { setLanguage(v); setDefault('language', v); }} />
        </div>
      )}

      <label className="flex items-center justify-between cursor-pointer border-t border-[hsl(var(--c-border))] pt-4">
        <span>
          <span className="block text-sm text-[hsl(var(--c-text))]">Empty line after each bubble</span>
          <span className="block text-xs text-[hsl(var(--c-dim))]">Adds a blank line after every bubble in OCR &amp; translation files.</span>
        </span>
        <Switch checked={emptyLine} onCheckedChange={(v) => { setEmptyLine(v); setDefault('emptyLine', v); }} className="data-[state=checked]:bg-[hsl(var(--c-accent))]" />
      </label>
    </div>
  );
}