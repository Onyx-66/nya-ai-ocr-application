import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw } from 'lucide-react';

export default function DriveFolderPicker({ value, onChange, placeholder = 'Root of My Drive' }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="flex items-center gap-2">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={loading}
        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {folders.map((f) => (
          <option key={f.id} value={f.id}>{f.name}</option>
        ))}
      </select>
      <button
        onClick={load}
        disabled={loading}
        title="Refresh folders"
        className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
      </button>
      {error && <span className="text-xs text-rose-400">{error}</span>}
    </div>
  );
}