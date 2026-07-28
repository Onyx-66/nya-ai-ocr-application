import DriveFolderPicker from '@/components/DriveFolderPicker';
import { Switch } from '@/components/ui/switch';
import { Languages, BookType } from 'lucide-react';

const FORMATS = [
  { id: 'txt', label: '.txt' },
  { id: 'md', label: '.md' }
];

export const LANGUAGES = [
  'English', 'Spanish', 'French', 'Arabic', 'German', 'Italian', 'Portuguese',
  'Russian', 'Japanese', 'Korean', 'Chinese (Simplified)', 'Chinese (Traditional)',
  'Turkish', 'Indonesian', 'Vietnamese', 'Thai', 'Hindi', 'Dutch', 'Polish',
  'Persian', 'Hebrew', 'Filipino', 'Malay'
];

export default function GlobalOptions({
  serieTitle, format, translateEnabled, targetLanguage, uploadFolder, onField
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
      <h2 className="text-sm font-medium text-slate-200 flex items-center gap-2">
        <BookType className="w-4 h-4 text-indigo-400" /> Options
      </h2>

      <div>
        <label className="block text-xs text-slate-500 mb-1.5">Serie title</label>
        <input
          value={serieTitle}
          onChange={(e) => onField('serieTitle', e.target.value)}
          placeholder="e.g. Solo Leveling"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1.5">Output format</label>
        <div className="flex gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 w-fit">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => onField('format', f.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-mono transition-colors ${
                format === f.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800 pt-4">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-sm text-slate-200">
            <Languages className="w-4 h-4 text-indigo-400" /> Translate chapters
          </span>
          <Switch checked={translateEnabled} onCheckedChange={(v) => onField('translateEnabled', v)} />
        </label>
        {translateEnabled && (
          <div className="mt-3">
            <label className="block text-xs text-slate-500 mb-1.5">Translate to</label>
            <select
              value={targetLanguage}
              onChange={(e) => onField('targetLanguage', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="border-t border-slate-800 pt-4">
        <label className="block text-xs text-slate-500 mb-1.5">Default Google Drive upload folder</label>
        <DriveFolderPicker value={uploadFolder} onChange={(v) => onField('uploadFolder', v)} />
      </div>
    </div>
  );
}