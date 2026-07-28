import { useState } from 'react';
import { Languages, BookType, ChevronDown, Zap, FileText } from 'lucide-react';
import LanguageSelect from '@/components/batch/LanguageSelect';
import { Switch } from '@/components/ui/switch';
import DriveFolderButton from '@/components/batch/DriveFolderButton';
import ExportTemplateSelect from '@/components/batch/ExportTemplateSelect';

const FORMATS = [{ id: 'txt', label: '.txt' }, { id: 'md', label: '.md' }];

export default function GlobalOptions({ serieTitle, format, translateEnabled, targetLanguage, emptyLine, uploadFolder, onField }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 p-4 text-left">
        <BookType className="w-4 h-4 text-[hsl(var(--c-accent))]" />
        <span className="text-sm font-medium text-[hsl(var(--c-text))] flex-1">Options</span>
        <ChevronDown className={`w-4 h-4 text-[hsl(var(--c-dim))] transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4">
          {/* Export template */}
          <div>
            <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Export template</label>
            <ExportTemplateSelect onChange={(t) => onField('template', t)} />
          </div>

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
                  className={`px-4 py-1.5 rounded-md text-sm font-mono transition-colors ${format === f.id ? 'bg-[hsl(var(--c-accent))] text-white' : 'text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]'}`}
                >{f.label}</button>
              ))}
            </div>
          </div>

          <div className="border-t border-[hsl(var(--c-border))] pt-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2 text-sm text-[hsl(var(--c-text))]">
                <Languages className="w-4 h-4 text-[hsl(var(--c-accent))]" /> Translate chapters
              </span>
              <Switch checked={translateEnabled} onCheckedChange={(v) => onField('translateEnabled', v)} className="data-[state=checked]:bg-[hsl(var(--c-accent))]" />
            </label>
            {translateEnabled && (
              <div className="mt-3">
                <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Translate to</label>
                <LanguageSelect value={targetLanguage} onChange={(v) => onField('targetLanguage', v)} />
              </div>
            )}
          </div>

          <label className="flex items-center justify-between cursor-pointer border-t border-[hsl(var(--c-border))] pt-4">
            <span>
              <span className="block text-sm text-[hsl(var(--c-text))]">Empty line after each bubble</span>
              <span className="block text-xs text-[hsl(var(--c-dim))]">Adds a blank line in OCR &amp; translation files.</span>
            </span>
            <Switch checked={emptyLine} onCheckedChange={(v) => onField('emptyLine', v)} className="data-[state=checked]:bg-[hsl(var(--c-accent))]" />
          </label>

          <div className="border-t border-[hsl(var(--c-border))] pt-4">
            <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Google Drive upload folder</label>
            <DriveFolderButton value={uploadFolder} onChange={(v) => onField('uploadFolder', v)} />
          </div>
        </div>
      )}
    </div>
  );
}