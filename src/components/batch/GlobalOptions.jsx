import DriveFolderPicker from '@/components/DriveFolderPicker';
import LanguageSelect from '@/components/batch/LanguageSelect';
import { Switch } from '@/components/ui/switch';
import { Languages, BookType } from 'lucide-react';

const FORMATS = [
  { id: 'txt', label: '.txt' },
  { id: 'md', label: '.md' }
];

export default function GlobalOptions({
  serieTitle, format, translateEnabled, targetLanguage, uploadFolder, onField
}) {
  return (
    <div className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-5 space-y-4">
      <h2 className="text-sm font-medium text-[hsl(var(--c-text))] flex items-center gap-2">
        <BookType className="w-4 h-4 text-[hsl(var(--c-accent))]" /> Options
      </h2>

      <div>
        <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Serie title</label>
        <input
          value={serieTitle}
          onChange={(e) => onField('serieTitle', e.target.value)}
          placeholder="e.g. Solo Leveling"
          className="w-full bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none focus:border-[hsl(var(--c-accent))]"
        />
      </div>

      <div>
        <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Output format</label>
        <div className="flex gap-1 p-1 bg-[hsl(var(--c-input))] rounded-lg border border-[hsl(var(--c-border))] w-fit">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => onField('format', f.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-mono transition-colors ${
                format === f.id ? 'bg-[hsl(var(--c-accent))] text-white' : 'text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[hsl(var(--c-border))] pt-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-sm text-[hsl(var(--c-text))]">
            <Languages className="w-4 h-4 text-[hsl(var(--c-accent))]" /> Translate chapters
          </span>
          <Switch
            checked={translateEnabled}
            onCheckedChange={(v) => onField('translateEnabled', v)}
            className="data-[state=checked]:bg-[hsl(var(--c-accent))]"
          />
        </label>
        {translateEnabled && (
          <div className="mt-3">
            <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Translate to</label>
            <LanguageSelect value={targetLanguage} onChange={(v) => onField('targetLanguage', v)} />
          </div>
        )}
      </div>

      <div className="border-t border-[hsl(var(--c-border))] pt-4">
        <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Default Google Drive upload folder</label>
        <DriveFolderPicker value={uploadFolder} onChange={(v) => onField('uploadFolder', v)} />
      </div>
    </div>
  );
}