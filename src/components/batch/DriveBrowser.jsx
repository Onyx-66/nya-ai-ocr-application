import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOverlayBack } from '@/lib/overlayHistory';
import { Loader2, Folder, ChevronRight, ArrowLeft, Check, X, HardDrive } from 'lucide-react';

export default function DriveBrowser({ open, onClose, onSelect }) {
  const [stack, setStack] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { close } = useOverlayBack('drive', open, onClose);

  const parent = stack[stack.length - 1] || null;

  const load = async (pid) => {
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke('driveBrowseFolders', { parentId: pid || null });
      setFolders((res.data && res.data.folders) || []);
    } catch (e) { setError(e.message || 'Failed to load folders'); setFolders([]); }
    setLoading(false);
  };

  useEffect(() => { if (open) { setStack([]); load(null); } }, [open]);
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && close();
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, close]);

  const into = (f) => { setStack((s) => [...s, f]); load(f.id); };
  const up = () => { const n = stack.slice(0, -1); setStack(n); load(n[n.length - 1]?.id || null); };
  const goRoot = () => { setStack([]); load(null); };
  const select = () => { onSelect(parent ? { id: parent.id, name: parent.name } : { id: null, name: 'My Drive (root)' }); close(); };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-3" onClick={close}>
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--c-border))]">
          <p className="text-sm font-medium text-[hsl(var(--c-text))]">Browse Google Drive</p>
          <button onClick={close} className="text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))] p-2 -m-2 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-1 px-4 py-2 text-xs text-[hsl(var(--c-dim))] overflow-x-auto border-b border-[hsl(var(--c-border))] whitespace-nowrap">
          <button onClick={goRoot} className="flex items-center gap-1 hover:text-[hsl(var(--c-text))] shrink-0"><HardDrive className="w-3.5 h-3.5" /> My Drive</button>
          {stack.map((s, i) => (
            <span key={i} className="flex items-center gap-1 shrink-0"><ChevronRight className="w-3 h-3" />{s.name}</span>
          ))}
        </div>
        <div className="flex-1 overflow-auto p-2 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--c-accent))]" /></div>
          ) : error ? (
            <p className="text-xs text-rose-400 p-3">{error}</p>
          ) : folders.length === 0 ? (
            <p className="text-xs text-[hsl(var(--c-dim))] p-8 text-center">No subfolders in this folder.</p>
          ) : folders.map((f) => (
            <button key={f.id} onClick={() => into(f)} className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-[hsl(var(--c-soft))] text-left min-h-[44px]">
              <Folder className="w-4 h-4 text-[hsl(var(--c-accent))] shrink-0" />
              <span className="text-sm text-[hsl(var(--c-text))] truncate flex-1">{f.name}</span>
              <ChevronRight className="w-4 h-4 text-[hsl(var(--c-dim))] shrink-0" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 border-t border-[hsl(var(--c-border))]">
          {stack.length > 0 && (
            <button onClick={up} className="flex items-center gap-1.5 text-sm text-[hsl(var(--c-text-soft))] hover:text-[hsl(var(--c-text))] px-3 py-2 rounded-lg hover:bg-[hsl(var(--c-soft))]">
              <ArrowLeft className="w-4 h-4" /> Up
            </button>
          )}
          <button onClick={select} className="ml-auto flex items-center gap-1.5 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-lg px-4 py-2 text-sm font-medium">
            <Check className="w-4 h-4" /> Select this folder
          </button>
        </div>
      </div>
    </div>
  );
}