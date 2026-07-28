import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import JSZip from 'jszip';
import { Loader2, FolderInput, FileArchive, Plus } from 'lucide-react';

const IMAGE_RE = /\.(png|jpe?g|webp|gif|bmp)$/i;

function extractId(link) {
  if (!link) return '';
  const mFolder = link.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (mFolder) return mFolder[1];
  const mId = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (mId) return mId[1];
  return link.trim();
}

export default function BatchImport({ onChapters }) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const importDrive = async () => {
    const id = extractId(link);
    if (!id) { setError('Paste a valid Google Drive folder link'); return; }
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke('driveBatchImport', { folderId: id });
      const chs = (res.data && res.data.chapters) || [];
      if (chs.length) { onChapters(chs); setOpen(false); setLink(''); }
      else setError('No chapters found — each subfolder, ZIP, or image inside becomes a chapter');
    } catch (e) {
      setError(e.message || 'Import failed (connect Google Drive in Settings)');
    }
    setLoading(false);
  };

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
        const imgs = [];
        const sorted = entries.filter((e) => IMAGE_RE.test(e.name)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        for (const e of sorted) {
          try { imgs.push(await uploadBlob(await e.async('blob'), e.name.split('/').pop())); } catch (_) {}
        }
        if (imgs.length) chapters.push({ title: dir === '__root__' ? file.name.replace(/\.zip$/i, '') : dir, images: imgs });
      }
      for (const z of topZips) {
        try {
          const inner = await JSZip.loadAsync(await z.async('blob'));
          const inImgs = Object.values(inner.files).filter((e) => !e.dir && IMAGE_RE.test(e.name)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
          const imgs = [];
          for (const e of inImgs) { try { imgs.push(await uploadBlob(await e.async('blob'), e.name.split('/').pop())); } catch (_) {} }
          if (imgs.length) chapters.push({ title: z.name.replace(/\.zip$/i, ''), images: imgs });
        } catch (_) {}
      }
      if (chapters.length) { onChapters(chapters); setOpen(false); }
      else setError('No images found inside the ZIP');
    } catch (e) {
      setError(e.message || 'ZIP extraction failed');
    }
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] text-[hsl(var(--c-text))] rounded-lg px-3 py-2 text-sm font-medium"
      >
        <Plus className="w-4 h-4" /> Import chapters
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4 space-y-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-dim))] mb-1.5">
              <FolderInput className="w-3.5 h-3.5" /> From a Google Drive folder link
            </label>
            <div className="flex gap-2">
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/…"
                className="flex-1 bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none focus:border-[hsl(var(--c-accent))]"
              />
              <button
                onClick={importDrive}
                disabled={loading}
                className="flex items-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] disabled:opacity-50 text-white rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderInput className="w-4 h-4" />} Import
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--c-dim))]">
            <span className="flex-1 border-t border-[hsl(var(--c-border))]" /> or <span className="flex-1 border-t border-[hsl(var(--c-border))]" />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-dim))] mb-1.5">
              <FileArchive className="w-3.5 h-3.5" /> From a ZIP with multiple chapters
            </label>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-[hsl(var(--c-border))] hover:border-[hsl(var(--c-accent))] bg-[hsl(var(--c-input))] py-3 text-sm text-[hsl(var(--c-text-soft))]"
            >
              Select a .zip — subfolders / nested ZIPs become separate chapters
            </button>
            <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={(e) => e.target.files[0] && importZip(e.target.files[0])} />
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
      )}
    </div>
  );
}