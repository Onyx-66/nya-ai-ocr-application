import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import JSZip from 'jszip';
import { Upload, FileArchive, FolderOpen, Loader2, Link2 } from 'lucide-react';

const IMAGE_RE = /\.(png|jpe?g|webp|gif|bmp)$/i;

function extractDriveId(link) {
  if (!link) return '';
  const mFolder = link.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (mFolder) return mFolder[1];
  const mFile = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (mFile) return mFile[1];
  const mId = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (mId) return mId[1];
  return link.trim();
}

const TABS = [
  { id: 'files', label: 'Images', icon: Upload },
  { id: 'zip', label: 'ZIP', icon: FileArchive },
  { id: 'drive', label: 'Google Drive', icon: FolderOpen }
];

export default function ImageUploader({ onImages }) {
  const [tab, setTab] = useState('files');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [driveLink, setDriveLink] = useState('');
  const fileRef = useRef(null);
  const zipRef = useRef(null);

  const uploadFiles = async (fileList) => {
    setLoading(true); setError(null);
    try {
      const files = Array.from(fileList).filter((f) => IMAGE_RE.test(f.name)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      if (!files.length) { setError('No image files selected'); setLoading(false); return; }
      const imgs = [];
      for (const f of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
        imgs.push({ url: file_url, name: f.name });
      }
      onImages(imgs);
    } catch (e) { setError(e.message || 'Upload failed'); }
    setLoading(false);
  };

  const handleZip = async (file) => {
    setLoading(true); setError(null);
    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((e) => !e.dir && IMAGE_RE.test(e.name)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      if (!entries.length) { setError('No images found in the ZIP'); setLoading(false); return; }
      const imgs = [];
      for (const entry of entries) {
        const blob = await entry.async('blob');
        const f = new File([blob], entry.name.split('/').pop(), { type: blob.type || 'image/png' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
        imgs.push({ url: file_url, name: entry.name.split('/').pop() });
      }
      onImages(imgs);
    } catch (e) { setError(e.message || 'ZIP extraction failed'); }
    setLoading(false);
  };

  const handleDrive = async () => {
    const id = extractDriveId(driveLink);
    if (!id) { setError('Enter a valid Google Drive folder/file link or ID'); return; }
    setLoading(true); setError(null);
    try {
      const res = await base44.functions.invoke('driveListImages', { folderId: id });
      const imgs = (res.data && res.data.images) || [];
      if (imgs.length) onImages(imgs);
      else setError('No images found (folders, ZIP archives, and single images are supported)');
    } catch (e) { setError(e.message || 'Could not load from Drive (is Google Drive connected in Settings?)'); }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 bg-[hsl(var(--c-input))] rounded-lg border border-[hsl(var(--c-border))] w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setError(null); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
              tab === id ? 'bg-[hsl(var(--c-accent))] text-white' : 'text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'files' && (
        <div
          onClick={() => !loading && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver ? 'border-[hsl(var(--c-accent))] ring-2 ring-[hsl(var(--c-accent))]' : 'border-[hsl(var(--c-border))] hover:border-[hsl(var(--c-accent))] bg-[hsl(var(--c-input))]'
          }`}
        >
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadFiles(e.target.files)} />
          <Upload className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--c-dim))]" />
          <p className="text-sm text-[hsl(var(--c-text-soft))]">Drag & drop images or click to browse</p>
          <p className="text-xs text-[hsl(var(--c-dim))] mt-1">PNG, JPG, WEBP, GIF — sorted by filename</p>
        </div>
      )}

      {tab === 'zip' && (
        <div
          onClick={() => !loading && zipRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-[hsl(var(--c-border))] hover:border-[hsl(var(--c-accent))] bg-[hsl(var(--c-input))] p-8 text-center"
        >
          <input ref={zipRef} type="file" accept=".zip" className="hidden" onChange={(e) => e.target.files[0] && handleZip(e.target.files[0])} />
          <FileArchive className="w-8 h-8 mx-auto mb-2 text-[hsl(var(--c-dim))]" />
          <p className="text-sm text-[hsl(var(--c-text-soft))]">Click to select a .zip archive</p>
          <p className="text-xs text-[hsl(var(--c-dim))] mt-1">All images inside are extracted & sorted</p>
        </div>
      )}

      {tab === 'drive' && (
        <div className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-input))] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[hsl(var(--c-dim))]" />
            <input
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="Paste a Google Drive folder, file, or ZIP link"
              className="flex-1 bg-transparent border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none focus:border-[hsl(var(--c-accent))]"
            />
          </div>
          <button
            onClick={handleDrive}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium"
          >
            <FolderOpen className="w-4 h-4" /> Load images from Drive
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--c-dim))]">
          <Loader2 className="w-4 h-4 animate-spin" /> Uploading & preparing images…
        </div>
      )}
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}