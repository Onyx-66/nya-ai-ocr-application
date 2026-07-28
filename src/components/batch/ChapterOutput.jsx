import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import OutputPreview from '@/components/OutputPreview';
import { Download, CloudUpload, Loader2 } from 'lucide-react';

export default function ChapterOutput({
  chapter, format, translateEnabled, targetLanguage, uploadFolder,
  activeTab, setActiveTab
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const isTranslate = activeTab === 'translate';
  const content = isTranslate ? chapter.translateOutput : chapter.ocrOutput;
  const hasContent = !!content;

  const baseName = [chapter.serieTitle, chapter.title]
    .map((s) => s && s.trim()).filter(Boolean).join('_') || 'manga_ocr';
  const suffix = isTranslate ? '_' + targetLanguage.replace(/\s+/g, '_') : '';
  const filename = `${baseName}${suffix}.${format}`;

  const download = () => {
    if (!hasContent) return;
    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const upload = async () => {
    if (!hasContent) return;
    setUploading(true); setUploadResult(null); setUploadError(null);
    try {
      const res = await base44.functions.invoke('driveUploadFile', {
        filename, content,
        mimeType: format === 'md' ? 'text/markdown' : 'text/plain',
        folderId: uploadFolder || null
      });
      setUploadResult(res.data);
    } catch (e) {
      setUploadError(e.message || 'Drive upload failed — connect Google Drive in Settings');
    }
    setUploading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 bg-[hsl(var(--c-input))] rounded-lg border border-[hsl(var(--c-border))] w-fit">
        <button
          onClick={() => setActiveTab('ocr')}
          className={`px-3 py-1 rounded-md text-xs transition-colors ${activeTab === 'ocr' ? 'bg-[hsl(var(--c-accent))] text-white' : 'text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]'}`}
        >OCR</button>
        {translateEnabled && (
          <button
            onClick={() => setActiveTab('translate')}
            className={`px-3 py-1 rounded-md text-xs transition-colors ${activeTab === 'translate' ? 'bg-[hsl(var(--c-accent))] text-white' : 'text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]'}`}
          >Translation</button>
        )}
      </div>

      <OutputPreview output={content || ''} format={format} />

      {hasContent && (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={download}
            className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] text-[hsl(var(--c-text))] rounded-lg py-2 text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Download
          </button>
          <button
            onClick={upload}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Upload to Drive'}
          </button>
        </div>
      )}
      {uploadResult && uploadResult.webViewLink && (
        <a href={uploadResult.webViewLink} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:underline">
          ✓ Uploaded — open in Google Drive
        </a>
      )}
      {uploadError && <p className="text-xs text-rose-400">{uploadError}</p>}
    </div>
  );
}