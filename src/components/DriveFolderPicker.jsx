import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, Link2 } from 'lucide-react';
import MobileSelect from '@/components/ui/MobileSelect';

function extractId(link) {
  if (!link) return '';
  const mFolder = link.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (mFolder) return mFolder[1];
  const mId = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (mId) return mId[1];
  return /^[a-zA-Z0-9_-]{10,}$/.test(link.trim()) ? link.trim() : '';
}

export default function DriveFolderPicker({ value, onChange, placeholder = 'Root of My Drive' }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [link, setLink] = useState('');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke('driveListFolders', {});
      setFolders((res.data && res.data.folders) || []);
    } catch (e) {
      setError(e.message || 'Cannot reach Google Drive');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onLink = (v) => {
    setLink(v);
    const id = extractId(v);
    if (id) onChange(id);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 focus-within:border-[hsl(var(--c-accent))]">
        <Link2 className="w-4 h-4 text-[hsl(var(--c-dim))]" />
        <input
          value={link}
          onChange={(e) => onLink(e.target.value)}
          placeholder="Paste a Drive folder link…"
          className="flex-1 bg-transparent text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none py-2"
        />
      </div>
      <div className="flex items-center gap-2">
        <MobileSelect
          value={folders.some((f) => f.id === value) ? value : ''}
          onChange={(v) => { onChange(v || null); setLink(''); }}
          options={[{ value: '', label: value ? 'Custom folder (from link)' : placeholder }, ...folders.map((f) => ({ value: f.id, label: f.name }))]}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))] disabled:opacity-50"
        />
        <button
          onClick={load}
          disabled={loading}
          title="Refresh folders"
          className="p-2 rounded-lg border border-[hsl(var(--c-border))] text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))] hover:bg-[hsl(var(--c-soft))]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}