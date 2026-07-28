import { useEffect, useMemo, useState } from 'react';
import {
  getLibrary, removeEntry, clearLibrary, saveToLibrary, downloadZip,
  pickRoot, getRootHandle, clearRootHandle, fsSupported
} from '@/lib/library';
import {
  Library as LibIcon, FolderDown, Download, Trash2, Eye, Copy,
  FileText, Languages, HardDrive, Unplug, Loader2, X, Search, CheckSquare, Square, CloudOff, Cloud
} from 'lucide-react';
import OutputPreview from '@/components/OutputPreview';

async function hasPerm(h) { try { return (await h.queryPermission({ mode: 'readwrite' })) === 'granted'; } catch { return false; } }

const TABS = [{ id: 'all', label: 'All' }, { id: 'ocr', label: 'OCR' }, { id: 'translation', label: 'Translation' }];

export default function Library() {
  const [entries, setEntries] = useState([]);
  const [tab, setTab] = useState('all');
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [preview, setPreview] = useState(null);
  const [query, setQuery] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    (async () => { const h = await getRootHandle(); setConnected(!!h && await hasPerm(h)); })();
    setEntries(getLibrary());
  }, []);

  const filtered = useMemo(() => {
    let list = tab === 'all' ? entries : entries.filter((e) => e.type === tab);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((e) => (e.serie || '').toLowerCase().includes(q) || (e.language || '').toLowerCase().includes(q));
    }
    return list;
  }, [entries, tab, query]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(null), 2200); };

  const connect = async () => { try { await pickRoot(); setConnected(true); flash('Device folder connected'); } catch (e) { flash(e.message || 'Failed'); } };
  const disconnect = async () => { await clearRootHandle(); setConnected(false); flash('Folder disconnected'); };

  const doSave = async (list) => { if (!list.length) return flash('Nothing to save'); setBusy(true); try { const r = await saveToLibrary(list); flash(`Saved ${r.saved} file(s) → nya ai ocr/library`); setEntries(getLibrary()); } catch (e) { flash(e.message || 'Failed'); } setBusy(false); };
  const doZip = async (list) => { if (!list.length) return flash('Nothing to download'); setBusy(true); try { await downloadZip(list); flash('ZIP downloaded'); } catch (e) { flash(e.message || 'Failed'); } setBusy(false); };
  const doDelete = (list) => { list.forEach((e) => removeEntry(e.id)); setEntries(getLibrary()); setSelected(new Set()); flash(`Deleted ${list.length} item(s)`); };

  const saveAll = () => doSave(filtered);
  const dlZip = () => doZip(filtered);
  const copy = async (e) => { try { await navigator.clipboard.writeText(e.content); flash('Copied'); } catch { flash('Copy failed'); } };

  const toggleSel = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selItems = filtered.filter((e) => selected.has(e.id));
  const allSel = filtered.length > 0 && filtered.every((e) => selected.has(e.id));
  const toggleAll = () => setSelected(allSel ? new Set() : new Set(filtered.map((e) => e.id)));

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl font-heading font-semibold text-[hsl(var(--c-text))]">Library</h1>
        <span className="text-sm text-[hsl(var(--c-dim))]">{entries.length} saved</span>
      </div>
      <p className="text-[hsl(var(--c-dim))] text-sm mb-6">
        Outputs are saved to <code className="font-mono text-[hsl(var(--c-text-soft))]">nya ai ocr/library/[Serie]/...</code> on your device.
      </p>

      {/* Connection */}
      <section className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4 sm:p-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--c-soft))] flex items-center justify-center shrink-0">
            {connected ? <HardDrive className="w-5 h-5 text-emerald-400" /> : <FolderDown className="w-5 h-5 text-[hsl(var(--c-accent))]" />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-[hsl(var(--c-text))]">{connected ? 'Device folder connected' : 'Connect a device folder'}</h2>
            <p className="text-xs text-[hsl(var(--c-dim))]">{connected ? 'Saves write into "nya ai ocr/library".' : fsSupported ? 'Pick a folder once to save the structured library.' : "Your browser can't pick folders — use Download ZIP."}</p>
          </div>
          {connected ? (
            <button onClick={disconnect} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-dim))] hover:text-rose-400 shrink-0"><Unplug className="w-4 h-4" /><span className="hidden sm:inline">Disconnect</span></button>
          ) : (
            <button onClick={connect} disabled={!fsSupported} className="flex items-center gap-1.5 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] disabled:opacity-40 text-white rounded-lg px-3 py-1.5 text-xs font-medium shrink-0"><FolderDown className="w-4 h-4" />Connect</button>
          )}
        </div>
      </section>

      {/* Search + select */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <div className="flex items-center gap-2 bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-[hsl(var(--c-dim))]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by series or language…" className="flex-1 min-w-0 bg-transparent text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none" />
        </div>
        <button onClick={() => { setSelectMode((s) => !s); setSelected(new Set()); }} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium shrink-0 ${selectMode ? 'bg-[hsl(var(--c-accent))] text-white' : 'bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] text-[hsl(var(--c-text))]'}`}>
          {selectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />} Select
        </button>
      </div>

      {/* Bulk actions / global actions */}
      {selectMode ? (
        <div className="space-y-2 mb-4">
          {filtered.length > 0 && (
            <button onClick={toggleAll} className="text-xs text-[hsl(var(--c-accent))] hover:underline mb-1">{allSel ? 'Deselect all' : 'Select all visible'}</button>
          )}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => doSave(selItems)} disabled={busy || !selItems.length} className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] disabled:opacity-40 text-white rounded-lg px-3 py-2 text-sm font-medium">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderDown className="w-4 h-4" />} Save {selItems.length || ''}
            </button>
            <button onClick={() => doZip(selItems)} disabled={busy || !selItems.length} className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] disabled:opacity-40 text-[hsl(var(--c-text))] rounded-lg px-3 py-2 text-sm font-medium">
              <Download className="w-4 h-4" /> ZIP {selItems.length || ''}
            </button>
            <button onClick={() => doDelete(selItems)} disabled={!selItems.length} className="flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 disabled:opacity-40 rounded-lg px-3 py-2 text-sm font-medium">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          <div className="flex gap-2">
            <button onClick={saveAll} disabled={busy || !filtered.length} className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] disabled:opacity-40 text-white rounded-lg px-3 py-2 text-sm font-medium">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderDown className="w-4 h-4" />}Save all to device
            </button>
            <button onClick={dlZip} disabled={busy || !filtered.length} className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] disabled:opacity-40 text-[hsl(var(--c-text))] rounded-lg px-3 py-2 text-sm font-medium">
              <Download className="w-4 h-4" />Download ZIP
            </button>
          </div>
          <button onClick={() => { clearLibrary(); setEntries([]); flash('Library cleared'); }} disabled={!entries.length} className="ml-auto flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 disabled:opacity-40 rounded-lg px-3 py-2 text-sm font-medium">
            <Trash2 className="w-4 h-4" />Clear
          </button>
        </div>
      )}
      {msg && <p className="text-xs text-emerald-400 mb-3">{msg}</p>}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[hsl(var(--c-input))] rounded-lg border border-[hsl(var(--c-border))] w-fit mb-4">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-1.5 rounded-md text-sm transition-colors ${tab === t.id ? 'bg-[hsl(var(--c-accent))] text-white' : 'text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]'}`}>{t.label}</button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[hsl(var(--c-border))] p-10 text-center text-[hsl(var(--c-dim))]">
          <LibIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{entries.length ? 'No entries match your search.' : 'No outputs yet — run OCR or translation in the workspace.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => (
            <div key={e.id} className={`rounded-xl border bg-[hsl(var(--c-card))] p-4 ${selectMode && selected.has(e.id) ? 'border-[hsl(var(--c-accent))]' : 'border-[hsl(var(--c-border))]'}`}>
              <div className="flex items-start gap-3">
                {selectMode && (
                  <button onClick={() => toggleSel(e.id)} className="mt-0.5 shrink-0 text-[hsl(var(--c-accent))]" >
                    {selected.has(e.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-[hsl(var(--c-dim))]" />}
                  </button>
                )}
                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--c-soft))] flex items-center justify-center shrink-0">
                  {e.type === 'translation' ? <Languages className="w-4 h-4 text-[hsl(var(--c-accent))]" /> : <FileText className="w-4 h-4 text-[hsl(var(--c-accent))]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[hsl(var(--c-text))] truncate">{e.serie} · Chapter {e.chapter}</p>
                  <p className="text-xs text-[hsl(var(--c-dim))] mt-0.5">{e.type === 'translation' ? `Translation → ${e.language}` : 'OCR'} · {(e.format || 'txt').toUpperCase()} · {new Date(e.created).toLocaleString()}</p>
                </div>
                <span className={`shrink-0 flex items-center gap-1 text-[10px] ${e.saved ? 'text-emerald-400' : 'text-[hsl(var(--c-dim))]'}`} title={e.saved ? 'Saved to device' : 'Not saved to device yet'}>
                  {e.saved ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
                </span>
                <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${e.type === 'translation' ? 'bg-[hsl(var(--c-accent))]/15 text-[hsl(var(--c-accent))]' : 'bg-emerald-500/15 text-emerald-400'}`}>{e.type === 'translation' ? 'TL' : 'OCR'}</span>
              </div>
              {!selectMode && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={() => setPreview(e)} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-text-soft))] hover:text-[hsl(var(--c-text))] bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] rounded-lg px-2.5 py-1.5"><Eye className="w-3.5 h-3.5" />View</button>
                  <button onClick={() => copy(e)} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-text-soft))] hover:text-[hsl(var(--c-text))] bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] rounded-lg px-2.5 py-1.5"><Copy className="w-3.5 h-3.5" />Copy</button>
                  <button onClick={() => doSave([e])} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-text-soft))] hover:text-[hsl(var(--c-text))] bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] rounded-lg px-2.5 py-1.5"><FolderDown className="w-3.5 h-3.5" />Save</button>
                  <button onClick={() => doDelete([e])} className="flex items-center gap-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg px-2.5 py-1.5 ml-auto"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-3" onClick={() => setPreview(null)}>
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] overflow-hidden" onClick={(ev) => ev.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--c-border))]">
              <p className="text-sm font-medium text-[hsl(var(--c-text))] truncate">{preview.serie} · Chapter {preview.chapter}</p>
              <button onClick={() => setPreview(null)} className="text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-auto p-3"><OutputPreview output={preview.content} format={preview.format} /></div>
          </div>
        </div>
      )}
    </div>
  );
}