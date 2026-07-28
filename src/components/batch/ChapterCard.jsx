import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ChapterImages from '@/components/batch/ChapterImages';
import ChapterOutput from '@/components/batch/ChapterOutput';
import { ChevronDown, Sparkles, Languages, Plus, Trash2, Loader2, Images, Download } from 'lucide-react';
import { downloadTextFile } from '@/lib/fileDownload';

export default function ChapterCard({
  chapter, index, serieTitle, format, translateEnabled, targetLanguage, uploadFolder,
  canRun, onUpdate, onRemove, onRunOcr, onTranslate, onToggleExpand, onPreview
}) {
  const expanded = chapter.expanded !== false;
  const [showUploader, setShowUploader] = useState(chapter.images.length === 0);
  const [activeTab, setActiveTab] = useState('ocr');

  const set = (patch) => onUpdate(chapter.id, patch);
  const resetOcr = { ocrStatus: 'idle', ocrProgress: 0, perPage: null, ocrOutput: '', ocrError: '' };
  const quickDl = (kind) => {
    const content = kind === 'tl' ? chapter.translateOutput : chapter.ocrOutput;
    if (!content) return;
    const base = [serieTitle, chapter.title].map((s) => s && s.trim()).filter(Boolean).join('_') || 'nya_ocr';
    const suffix = kind === 'tl' ? '_' + (targetLanguage || '').replace(/\s+/g, '_') : '';
    downloadTextFile(`${base}${suffix}.${format}`, content, format);
  };

  const badge = (label, status, progress) => {
    if (status === 'running') return <span className="text-xs text-[hsl(var(--c-accent))] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> {label} {progress ?? 0}%</span>;
    if (status === 'done') return <span className="text-xs text-emerald-400 flex items-center gap-1">{label} ✓</span>;
    if (status === 'error') return <span className="text-xs text-rose-400">{label} ✗</span>;
    return null;
  };

  const ocrRunning = chapter.ocrStatus === 'running';
  const tlRunning = chapter.translateStatus === 'running';

  return (
    <div className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] overflow-hidden">
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <button onClick={() => onToggleExpand(chapter.id)} className="text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))] shrink-0 p-3 -m-3 rounded-lg">
          <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        </button>
        <input
          value={chapter.title}
          onChange={(e) => set({ title: e.target.value, ...resetOcr })}
          placeholder={`Chapter ${index + 1} title`}
          className="flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-[hsl(var(--c-border))] focus:border-[hsl(var(--c-accent))] focus:outline-none px-1 py-1 text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))]"
        />
        <span className="hidden sm:flex items-center gap-1 text-xs text-[hsl(var(--c-dim))] shrink-0">
          <Images className="w-3.5 h-3.5" /> {chapter.images.length}
        </span>
        {badge('OCR', chapter.ocrStatus, chapter.ocrProgress)}
        {translateEnabled && badge('TL', chapter.translateStatus, chapter.translateProgress)}
        <button onClick={() => onRemove(chapter.id)} className="text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))] shrink-0 p-3 -m-3 rounded-lg" title="Remove chapter">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {(ocrRunning || tlRunning) && (
        <div className="h-1 bg-[hsl(var(--c-soft))]">
          <div className="h-full bg-[hsl(var(--c-accent))] transition-all" style={{ width: `${ocrRunning ? (chapter.ocrProgress ?? 0) : (chapter.translateProgress ?? 0)}%` }} />
        </div>
      )}

      {expanded && (
        <div className="px-3 sm:px-4 pb-4 space-y-4 border-t border-[hsl(var(--c-border))] pt-4">
          <button
            onClick={() => setShowUploader((s) => !s)}
            className="flex items-center gap-2 text-xs text-[hsl(var(--c-accent))] hover:opacity-80"
          >
            <Plus className="w-3.5 h-3.5" /> {showUploader ? 'Hide add images' : 'Add images (files / ZIP / Drive)'}
          </button>
          {showUploader && (
            <ImageUploader onImages={(imgs) => { onUpdate(chapter.id, { images: [...chapter.images, ...imgs], ...resetOcr }); setShowUploader(false); }} />
          )}

          {chapter.images.length > 0 && (
            <ChapterImages
              images={chapter.images}
              perPage={chapter.perPage}
              onReorder={(next) => onUpdate(chapter.id, { images: next, ...resetOcr })}
              onRemove={(i) => onUpdate(chapter.id, { images: chapter.images.filter((_, idx) => idx !== i), ...resetOcr })}
              onPreview={(i) => onPreview(chapter.images, i)}
            />
          )}

          {chapter.ocrError && <p className="text-xs text-rose-400">{chapter.ocrError}</p>}
          {chapter.translateError && <p className="text-xs text-rose-400">{chapter.translateError}</p>}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onRunOcr(chapter.id)}
              disabled={chapter.ocrStatus === 'running' || !chapter.images.length || !canRun}
              className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-medium"
            >
              {chapter.ocrStatus === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Run OCR
            </button>
            {translateEnabled && (
              <button
                onClick={() => onTranslate(chapter.id)}
                disabled={chapter.translateStatus === 'running' || !chapter.ocrOutput || !canRun}
                className="flex-1 flex items-center justify-center gap-2 bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] disabled:opacity-40 disabled:cursor-not-allowed text-[hsl(var(--c-text))] rounded-lg py-2 text-sm font-medium"
              >
                {chapter.translateStatus === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                Translate
              </button>
            )}
          </div>

          {(chapter.ocrOutput || (translateEnabled && chapter.translateOutput)) && (
            <div className="flex flex-wrap gap-2">
              {chapter.ocrOutput && (
                <button onClick={() => quickDl('ocr')} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-text-soft))] hover:text-[hsl(var(--c-text))] bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] rounded-lg px-2.5 py-1.5">
                  <Download className="w-3.5 h-3.5" /> Download OCR
                </button>
              )}
              {translateEnabled && chapter.translateOutput && (
                <button onClick={() => quickDl('tl')} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-text-soft))] hover:text-[hsl(var(--c-text))] bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] rounded-lg px-2.5 py-1.5">
                  <Download className="w-3.5 h-3.5" /> Download TL
                </button>
              )}
            </div>
          )}

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