import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Sparkles, Download, CloudUpload, Trash2, Image as ImageIcon } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import OutputPreview from '@/components/OutputPreview';
import DriveFolderPicker from '@/components/DriveFolderPicker';

const FORMATS = [
  { id: 'txt', label: '.txt' },
  { id: 'md', label: '.md' }
];

export default function Home() {
  const [images, setImages] = useState([]);
  const [format, setFormat] = useState('md');
  const [title, setTitle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [uploadFolder, setUploadFolder] = useState(() => localStorage.getItem('driveFolder') || null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const addImages = (imgs) => {
    setImages((prev) => [...prev, ...imgs]);
    setOutput('');
    setUploadResult(null);
  };

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx));
  const clearAll = () => { setImages([]); setOutput(''); setUploadResult(null); setError(null); };

  const runOcr = async () => {
    if (!images.length) { setError('Add some images first'); return; }
    setProcessing(true); setError(null); setOutput(''); setUploadResult(null);
    try {
      const res = await base44.functions.invoke('ocrImages', {
        image_urls: images.map((i) => i.url),
        format,
        title: title.trim() || null
      });
      setOutput((res.data && res.data.fullOutput) || '');
    } catch (e) {
      setError(e.message || 'OCR failed');
    }
    setProcessing(false);
  };

  const download = () => {
    const blob = new Blob([output], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (title.trim() || 'manga_ocr') + '.' + format;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uploadToDrive = async () => {
    if (!output) return;
    setUploading(true); setUploadResult(null); setError(null);
    try {
      const res = await base44.functions.invoke('driveUploadFile', {
        filename: (title.trim() || 'manga_ocr') + '.' + format,
        content: output,
        mimeType: format === 'md' ? 'text/markdown' : 'text/plain',
        folderId: uploadFolder || null
      });
      setUploadResult(res.data);
    } catch (e) {
      setError(e.message || 'Drive upload failed — connect Google Drive in Settings');
    }
    setUploading(false);
  };

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-heading font-semibold mb-1">Manga OCR Workspace</h1>
        <p className="text-slate-400 text-sm mb-8">
          Upload manga/webtoon images, run AI OCR, and export structured text — one bubble per line, <code className="text-slate-300">##</code> for narration, <code className="text-slate-300">SFX:</code> for sound effects.
        </p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT: input */}
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
              <h2 className="text-sm font-medium mb-3 text-slate-200">1. Add source images</h2>
              <ImageUploader onImages={addImages} />
            </div>

            {images.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-slate-200">Queue · {images.length} image{images.length > 1 ? 's' : ''}</h2>
                  <button onClick={clearAll} className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-800 aspect-square">
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-950/80 text-slate-300 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[10px] text-slate-300 px-1 py-0.5 truncate">
                        {i + 1}. {img.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
              <h2 className="text-sm font-medium text-slate-200">2. Options</h2>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Title / chapter name (optional)</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 12"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Output format</label>
                <div className="flex gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 w-fit">
                  {FORMATS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`px-4 py-1.5 rounded-md text-sm font-mono transition-colors ${
                        format === f.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={runOcr}
                disabled={processing || !images.length}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-medium"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {processing ? 'Running OCR…' : 'Run OCR'}
              </button>
              {error && <p className="text-sm text-rose-400">{error}</p>}
            </div>
          </div>

          {/* RIGHT: output */}
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
              <h2 className="text-sm font-medium mb-3 text-slate-200">3. Output</h2>
              <OutputPreview output={output} format={format} />
            </div>

            {output && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={download}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg py-2 text-sm font-medium"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
                <div className="border-t border-slate-800 pt-4">
                  <label className="block text-xs text-slate-500 mb-1.5">Upload to Google Drive folder</label>
                  <DriveFolderPicker value={uploadFolder} onChange={setUploadFolder} />
                  <button
                    onClick={uploadToDrive}
                    disabled={uploading}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                    {uploading ? 'Uploading…' : 'Upload to Drive'}
                  </button>
                  {uploadResult && uploadResult.webViewLink && (
                    <a
                      href={uploadResult.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="block mt-2 text-xs text-emerald-400 hover:underline"
                    >
                      ✓ Uploaded — open in Google Drive
                    </a>
                  )}
                </div>
              </div>
            )}

            {!output && !processing && (
              <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center text-slate-600">
                <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Add images and run OCR to see the structured output here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}