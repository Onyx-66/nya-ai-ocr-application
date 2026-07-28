import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import JSZip from 'jszip';
import { Loader2, UploadCloud, FolderOpen, FileArchive, Link2, X, ChevronDown, Check } from 'lucide-react';

const IMAGE_RE = /\.(png|jpe?g|webp|gif|bmp)$/i;
const sortByName = (a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true });

function extractId(link) {
  if (!link) return '';
  const mFolder = link.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (mFolder) return mFolder[1];
  const mId = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (mId) return mId[1];
  return /^[a-zA-Z0-9_-]{10,}$/.test(link.trim()) ? link.trim() : '';
}

export default function ImportModal({ open, onClose, onChapters }) {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [drag, setDrag] = useState(false);
  const zipRef = useRef(null);
  const folderRef = useRef(null);
  const browseRef = useRef(null);

  const uploadBlob = async (blob, name) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file: new File([blob], name, { type: blob.type || 'image/jpeg' }) });
    return { url: file_url, name };
  };

  const importZip = async (file) => {
    setLoading(true); setError(null);
    try {
      const zip = await JSZip.loadAsync(file);
      const allFiles = Object.values(zip.files).filter((e) => !e.dir);
      const byTop = {};
      const topZips = [];
      allFiles.forEach((e) => {
        if (e.name.includes('/')) {
          const seg = e.name.split('/')[0];
          (byTop[seg] ||= []).push(e);
        } else if (/\.zip$/i.test(e.name)) {
          topZips.push(e);
        } else if (IMAGE_RE.test(e.name)) {
          (byTop['__root__'] ||= []).push(e);
        }
      });
      const chapters = [];
      for (const [dir, entries] of Object.entries(byTop)) {
        const sorted = entries.filter((e) => IMAGE_RE.test(e.name)).sort(sortByName);
        const imgs = [];
        for (const e of sorted) { try { imgs.push(await uploadBlob(await e.async('blob'), e.name.split('/').pop())); } catch {} }
        if (imgs.length) chapters.push({ title: dir === '__root__' ? file.name.replace(/\.zip$/i, '') : dir, images: imgs });
      }
      for (const z of topZips) {
        try {
          const inner = await JSZip.loadAsync(await z.async('blob'));
          const inImgs = Object.values(inner.files).filter((e) => !e.dir && IMAGE_RE.test(e.name)).sort(sortByName);
          const imgs = [];
          for (const e of inImgs) { try { imgs.push(await uploadBlob(await e.async('blob'), e.name.split('/').pop())); } catch {} }
          if (imgs.length) chapters.push({ title: z.name.replace(/\.zip$/i, ''), images: imgs });
        } catch {}
      }
      if (chapters.length) { onChapters(chapters); finish(); }
      else setError('No images found inside the ZIP');
    } catch (e) { setError(e.message || 'ZIP extraction failed'); }
    setLoading(false);
  };

  const importFolder = async (files) => {
    setLoading(true); setError(null);
    try {
      const groups = {};
      const rootName = (files[0]?.webkitRelativePath || 'Folder').split('/')[0];
      for (const f of files) {
        if (!IMAGE_RE.test(f.name)) continue;
        const parts = (f.webkitRelativePath || f.name).split('/');
        const key = parts.length <= 2 ? '__root__' : parts[1];
        (groups[key] ||= { name: key === '__root__' ? rootName : key, files: [] }).files.push(f);
      }
      const chapters = [];
      for (const key of Object.keys(groups)) {
        const g = groups[key];
        const sorted = [...g.files].sort(sortByName);
        const imgs = [];
        for (const f of sorted) { try { imgs.push(await uploadBlob(f, f.name)); } catch {} }
        if (imgs.length) chapters.push({ title: g.name, images: imgs });
      }
      if (chapters.length) { onChapters(chapters); finish(); }
      else setError('No images found in the selected folder');
    } catch (e) { setError(e.message || 'Folder import failed'); }
    setLoading(false);
  };

  const importDrive = async () => {
    const id = extractId(link);
    if (!id) { setError('Paste a valid Google Drive folder link'); return; }
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke('driveBatchImport', { folderId: id });
      const chs = (res.data && res.data.chapters) || [];
      if (chs.length) { onChapters(chs); finish(); }
      else setError('No chapters found — each subfolder, ZIP, or image inside becomes a chapter');
    } catch (e) { setError(e.message || 'Import failed (connect Google Drive in Settings)'); }
    setLoading(false);
  };

  const finish = () => { setLink(''); setError(null); onClose(); };

  const onDrop = async (e) => {
    e.preventDefault(); setDrag(false);
    const files = [...(e.dataTransfer?.files || [])];
    if (!files.length) return;
    const zips = files.filter((f) => /\.zip$/i.test(f.name));
    const imgs = files.filter((f) => IMAGE_RE.test(f.name));
    if (zips.length) { for (const z of zips) await importZip(z); }
    else if (imgs.length) {
      setLoading(true);
      const out = [];
      for (const f of imgs.sort(sortByName)) { try { out.push(await uploadBlob(f, f.name)); } catch {} }
      if (out.length) { onChapters([{ title: 'Dropped images', images: out }]); finish(); }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="w-full max-w-lg flex flex-col rounded-xl bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--c-border))]">
          <p className="text-sm font-medium text-[hsl(var(--c-text))] flex items-center gap-2"><UploadCloud className="w-4 h-4 text-[hsl(var(--c-accent))]" /> Import chapters</p>
          <button onClick={onClose} className="text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Browse button (combined) */}
          <div>
            <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">From your device</label>
            <div className="relative" ref={browseRef}>
              <button
                onClick={() => setBrowseOpen((o) => !o)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] disabled:opacity-50 text-white rounded-lg px-4 py-3 text-sm font-medium"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />} Browse files or folders
                <ChevronDown className={`w-4 h-4 transition-transform ${browseOpen ? '' : '-rotate-90'}`} />
              </button>
              {browseOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] shadow-xl overflow-hidden">
                  <button onClick={() => { setBrowseOpen(false); zipRef.current?.click(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[hsl(var(--c-text))] hover:bg-[hsl(var(--c-soft))] text-left">
                    <FileArchive className="w-4 h-4 text-[hsl(var(--c-accent))]" /> ZIP / image files
                  </button>
                  <button onClick={() => { setBrowseOpen(false); folderRef.current?.click(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[hsl(var(--c-text))] hover:bg-[hsl(var(--c-soft))] text-left border-t border-[hsl(var(--c-border))]">
                    <FolderOpen className="w-4 h-4 text-[hsl(var(--c-accent))]" /> Device folder (subfolders → chapters)
                  </button>
                </div>
              )}
              <input ref={zipRef} type="file" accept=".zip,image/*" multiple className="hidden" onChange={(e) => { const fs = e.target.files; if (fs?.length) { const zips = [...fs].filter((f) => /\.zip$/i.test(f.name)); const imgs = [...fs].filter((f) => IMAGE_RE.test(f.name)); if (zips.length) zips.forEach(importZip); else if (imgs.length) onDrop({ dataTransfer: { files: imgs }, preventDefault: () => {} }); } }} />
              <input ref={folderRef} type="file" webkitdirectory="" directory="" multiple className="hidden" onChange={(e) => e.target.files?.length && importFolder([...e.target.files])} />
            </div>
            {/* dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={`mt-2 rounded-lg border-2 border-dashed text-center py-4 text-xs transition-colors ${drag ? 'border-[hsl(var(--c-accent))] bg-[hsl(var(--c-accent))]/5 text-[hsl(var(--c-text))]' : 'border-[hsl(var(--c-border))] text-[hsl(var(--c-dim))]'}`}
            >
              …or drag &amp; drop ZIP files / images here
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[hsl(var(--c-dim))]">
            <span className="flex-1 border-t border-[hsl(var(--c-border))]" /> or from Google Drive <span className="flex-1 border-t border-[hsl(var(--c-border))]" />
          </div>

          <div>
            <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Paste a Google Drive folder link</label>
            <div className="flex gap-2">
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/…"
                className="flex-1 bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none focus:border-[hsl(var(--c-accent))]"
              />
              <button onClick={importDrive} disabled={loading} className="flex items-center gap-2 bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] disabled:opacity-50 text-[hsl(var(--c-text))] rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Import
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}