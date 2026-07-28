import { useEffect, useState } from 'react';
import { getHistory, subscribe } from '@/lib/operations';
import { getLibrary, saveToLibrary, downloadZip } from '@/lib/library';
import { History as HistoryIcon, Download, FolderDown, Loader2, Sparkles, Languages } from 'lucide-react';

const fmtDate = (ts) => new Date(ts).toLocaleString();

export default function HistoryList() {
  const [ops, setOps] = useState(getHistory());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  useEffect(() => subscribe(setOps), []);
  const entries = getLibrary();
  const find = (id) => entries.find((e) => e.id === id);
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(null), 2000); };

  const saveOne = async (e) => { setBusy(true); try { await saveToLibrary([e]); flash('Saved to device'); } catch (err) { flash(err.message || 'Failed'); } setBusy(false); };
  const zipOne = async (e) => { setBusy(true); try { await downloadZip([e]); flash('ZIP downloaded'); } catch (err) { flash(err.message || 'Failed'); } setBusy(false); };

  if (!ops.length) {
    return (
      <div className="rounded-xl border border-dashed border-[hsl(var(--c-border))] p-10 text-center text-[hsl(var(--c-dim))]">
        <HistoryIcon className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">No operations yet. Your batch runs will appear here for quick re-download.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[hsl(var(--c-dim))]">Every OCR and translation run is logged here. Re-download or re-save any output.</p>
      {msg && <p className="text-xs text-emerald-400">{msg}</p>}
      {busy && <p className="text-xs text-[hsl(var(--c-accent))] flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Working…</p>}
      {ops.map((o) => {
        const e = o.entryId && find(o.entryId);
        return (
          <div key={o.id} className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${o.type === 'translation' ? 'bg-[hsl(var(--c-accent))]/15' : 'bg-emerald-500/15'}`}>
              {o.type === 'translation' ? <Languages className="w-4 h-4 text-[hsl(var(--c-accent))]" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[hsl(var(--c-text))] truncate">{o.label}</p>
              <p className="text-xs text-[hsl(var(--c-dim))]">{fmtDate(o.startedAt)} · {o.status === 'done' ? 'Completed' : o.status === 'error' ? 'Failed' : 'Running'}</p>
            </div>
            {e ? (
              <div className="flex gap-2 shrink-0">
                <button onClick={() => saveOne(e)} disabled={busy} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-text-soft))] hover:text-[hsl(var(--c-text))] bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] rounded-lg px-2.5 py-1.5"><FolderDown className="w-3.5 h-3.5" />Save</button>
                <button onClick={() => zipOne(e)} disabled={busy} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-text-soft))] hover:text-[hsl(var(--c-text))] bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] rounded-lg px-2.5 py-1.5"><Download className="w-3.5 h-3.5" />ZIP</button>
              </div>
            ) : (
              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[hsl(var(--c-soft))] text-[hsl(var(--c-dim))] shrink-0">{o.type === 'translation' ? 'TL' : 'OCR'}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}