import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import GlobalOptions from '@/components/batch/GlobalOptions';
import ChapterCard from '@/components/batch/ChapterCard';
import ImageLightbox from '@/components/batch/ImageLightbox';
import { Plus, Sparkles, Languages, Loader2, ScanText } from 'lucide-react';

export default function BatchWorkspace() {
  const [chapters, setChapters] = useState([]);
  const [serieTitle, setSerieTitle] = useState('');
  const [format, setFormat] = useState('md');
  const [translateEnabled, setTranslateEnabled] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [uploadFolder, setUploadFolder] = useState(() => localStorage.getItem('driveFolder') || null);
  const [lightbox, setLightbox] = useState({ images: [], index: null });
  const [runAllBusy, setRunAllBusy] = useState(false);
  const [transAllBusy, setTransAllBusy] = useState(false);

  const onField = (k, v) => {
    if (k === 'serieTitle') setSerieTitle(v);
    else if (k === 'format') setFormat(v);
    else if (k === 'translateEnabled') setTranslateEnabled(v);
    else if (k === 'targetLanguage') setTargetLanguage(v);
    else if (k === 'uploadFolder') { setUploadFolder(v); localStorage.setItem('driveFolder', v || ''); }
  };

  const update = (id, patch) => setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addChapter = () => setChapters((prev) => [...prev, {
    id: crypto.randomUUID(), title: '', images: [],
    ocrStatus: 'idle', ocrOutput: '', ocrError: '',
    translateStatus: 'idle', translateOutput: '', translateError: ''
  }]);
  const removeChapter = (id) => setChapters((prev) => prev.filter((c) => c.id !== id));

  const runOcr = async (id) => {
    const ch = chapters.find((c) => c.id === id);
    if (!ch || !ch.images.length) return;
    update(id, { ocrStatus: 'running', ocrError: '', ocrOutput: '' });
    try {
      const res = await base44.functions.invoke('ocrImages', {
        image_urls: ch.images.map((i) => i.url),
        format,
        title: ch.title.trim() || serieTitle.trim() || null
      });
      update(id, { ocrStatus: 'done', ocrOutput: (res.data && res.data.fullOutput) || '' });
    } catch (e) {
      update(id, { ocrStatus: 'error', ocrError: e.message || 'OCR failed' });
    }
  };

  const translate = async (id) => {
    const ch = chapters.find((c) => c.id === id);
    if (!ch || !ch.ocrOutput) return;
    update(id, { translateStatus: 'running', translateError: '', translateOutput: '' });
    try {
      const res = await base44.functions.invoke('translateChapter', {
        text: ch.ocrOutput, target_language: targetLanguage
      });
      update(id, { translateStatus: 'done', translateOutput: (res.data && res.data.translated) || '' });
    } catch (e) {
      update(id, { translateStatus: 'error', translateError: e.message || 'Translation failed' });
    }
  };

  const runAllOcr = async () => {
    setRunAllBusy(true);
    for (const c of chapters) { if (c.images.length) await runOcr(c.id); }
    setRunAllBusy(false);
  };
  const translateAll = async () => {
    setTransAllBusy(true);
    for (const c of chapters) { if (c.ocrOutput) await translate(c.id); }
    setTransAllBusy(false);
  };

  const hasImages = chapters.some((c) => c.images.length > 0);
  const hasOcr = chapters.some((c) => c.ocrOutput);

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-heading font-semibold mb-1">Batch OCR Workspace</h1>
        <p className="text-slate-400 text-sm mb-6">
          Add multiple chapters, queue images for each, run OCR per chapter or all at once, and optionally translate.
        </p>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="space-y-4 order-2 lg:order-1 min-w-0">
            {/* Action bar */}
            <div className="flex flex-wrap gap-2">
              <button onClick={addChapter} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-medium">
                <Plus className="w-4 h-4" /> Add chapter
              </button>
              <button
                onClick={runAllOcr}
                disabled={runAllBusy || !hasImages}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 text-sm font-medium"
              >
                {runAllBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Run all OCR
              </button>
              {translateEnabled && (
                <button
                  onClick={translateAll}
                  disabled={transAllBusy || !hasOcr}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-100 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  {transAllBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                  Translate all
                </button>
              )}
            </div>

            {chapters.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center text-slate-600">
                <ScanText className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Add your first chapter to begin.</p>
              </div>
            )}

            {chapters.map((c, i) => (
              <ChapterCard
                key={c.id}
                chapter={c}
                index={i}
                serieTitle={serieTitle}
                format={format}
                translateEnabled={translateEnabled}
                targetLanguage={targetLanguage}
                uploadFolder={uploadFolder}
                onUpdate={update}
                onRemove={removeChapter}
                onRunOcr={runOcr}
                onTranslate={translate}
                onPreview={(images, idx) => setLightbox({ images, index: idx })}
              />
            ))}
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-6">
            <GlobalOptions
              serieTitle={serieTitle}
              format={format}
              translateEnabled={translateEnabled}
              targetLanguage={targetLanguage}
              uploadFolder={uploadFolder}
              onField={onField}
            />
          </div>
        </div>
      </div>

      <ImageLightbox
        images={lightbox.images}
        index={lightbox.index}
        onClose={() => setLightbox({ images: [], index: null })}
        onNavigate={(i) => setLightbox((s) => ({ ...s, index: i }))}
      />
    </div>
  );
}