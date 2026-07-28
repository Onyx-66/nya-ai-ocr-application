import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ChapterImages from '@/components/batch/ChapterImages';
import ChapterOutput from '@/components/batch/ChapterOutput';
import { ChevronDown, Sparkles, Languages, Plus, Trash2, Loader2, Images } from 'lucide-react';

export default function ChapterCard({
  chapter, index, serieTitle, format, translateEnabled, targetLanguage, uploadFolder,
  onUpdate, onRemove, onRunOcr, onTranslate, onPreview
}) {
  const [expanded, setExpanded] = useState(true);
  const [showUploader, setShowUploader] = useState(chapter.images.length === 0);
  const [activeTab, setActiveTab] = useState('ocr');

  const set = (patch) => onUpdate(chapter.id, patch);
  const statusBadge = () => {
    const s = chapter.ocrStatus;
    if (s === 'running') return <span className="text-xs text-indigo-300 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> OCR</span>;
    if (s === 'done') return <span className="text-xs text-emerald-400">OCR ✓</span>;
    if (s === 'error') return <span className="text-xs text-rose-400">OCR ✗</span>;
    return null;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-slate-400 hover:text-slate-200 shrink-0"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        </button>
        <input
          value={chapter.title}
          onChange={(e) => set({ title: e.target.value, ocrStatus: 'idle', ocrOutput: '' })}
          placeholder={`Chapter ${index + 1} title`}
          className="flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-1 text-sm text-slate-100 placeholder:text-slate-600"
        />
        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 shrink-0">
          <Images className="w-3.5 h-3.5" /> {chapter.images.length}
        </span>
        {statusBadge()}
        <button
          onClick={() => onRemove(chapter.id)}
          className="text-slate-500 hover:text-rose-400 shrink-0"
          title="Remove chapter"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-3 sm:px-4 pb-4 space-y-4 border-t border-slate-800 pt-4">
          <button
            onClick={() => setShowUploader((s) => !s)}
            className="flex items-center gap-2 text-xs text-indigo-300 hover:text-indigo-200"
          >
            <Plus className="w-3.5 h-3.5" /> {showUploader ? 'Hide add images' : 'Add images (files / ZIP / Drive)'}
          </button>
          {showUploader && (
            <ImageUploader onImages={(imgs) => { onUpdate(chapter.id, { images: [...chapter.images, ...imgs], ocrStatus: 'idle', ocrOutput: '' }); setShowUploader(false); }} />
          )}

          {chapter.images.length > 0 && (
            <ChapterImages
              images={chapter.images}
              onReorder={(next) => onUpdate(chapter.id, { images: next, ocrStatus: 'idle', ocrOutput: '' })}
              onRemove={(i) => onUpdate(chapter.id, { images: chapter.images.filter((_, idx) => idx !== i), ocrStatus: 'idle', ocrOutput: '' })}
              onPreview={(i) => onPreview(chapter.images, i)}
            />
          )}

          {chapter.ocrError && <p className="text-xs text-rose-400">{chapter.ocrError}</p>}
          {chapter.translateError && <p className="text-xs text-rose-400">{chapter.translateError}</p>}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onRunOcr(chapter.id)}
              disabled={chapter.ocrStatus === 'running' || !chapter.images.length}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-medium"
            >
              {chapter.ocrStatus === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Run OCR
            </button>
            {translateEnabled && (
              <button
                onClick={() => onTranslate(chapter.id)}
                disabled={chapter.translateStatus === 'running' || !chapter.ocrOutput}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 rounded-lg py-2 text-sm font-medium"
              >
                {chapter.translateStatus === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                Translate
              </button>
            )}
          </div>

          {(chapter.ocrOutput || chapter.translateOutput) && (
            <ChapterOutput
              chapter={{ ...chapter, serieTitle }}
              format={format}
              translateEnabled={translateEnabled}
              targetLanguage={targetLanguage}
              uploadFolder={uploadFolder}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </div>
      )}
    </div>
  );
}