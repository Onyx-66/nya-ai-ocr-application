import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { getMarkers } from '@/lib/markers';
import { getDefaults } from '@/lib/appDefaults';
import { addEntry } from '@/lib/library';
import { addOp, updateOp } from '@/lib/operations';
import GlobalOptions from '@/components/batch/GlobalOptions';
import ChapterCard from '@/components/batch/ChapterCard';
import ImageLightbox from '@/components/batch/ImageLightbox';
import BatchImport from '@/components/batch/BatchImport';
import { Plus, Sparkles, Languages, Loader2, ScanText, Zap } from 'lucide-react';

const newChapter = (overrides = {}) => ({
  id: crypto.randomUUID(), title: '', images: [],
  ocrStatus: 'idle', ocrOutput: '', ocrError: '',
  translateStatus: 'idle', translateOutput: '', translateError: '',
  ...overrides
});

export default function BatchWorkspace() {
  const { user, checkUserAuth } = useAuth();
  const d = getDefaults();
  const [chapters, setChapters] = useState([]);
  const [serieTitle, setSerieTitle] = useState(d.serie);
  const [format, setFormat] = useState(d.format);
  const [translateEnabled, setTranslateEnabled] = useState(d.translate);
  const [targetLanguage, setTargetLanguage] = useState(d.language);
  const [emptyLine, setEmptyLine] = useState(d.emptyLine);
  const [uploadFolder, setUploadFolder] = useState(() => localStorage.getItem('driveFolder') || null);
  const [lightbox, setLightbox] = useState({ images: [], index: null });
  const [runAllBusy, setRunAllBusy] = useState(false);
  const [transAllBusy, setTransAllBusy] = useState(false);
  const [credits, setCredits] = useState(null);

  useEffect(() => { setCredits(user?.credits ?? null); }, [user]);

  const hasCredits = (credits ?? 0) >= 1;

  const onField = (k, v) => {
    if (k === 'serieTitle') setSerieTitle(v);
    else if (k === 'format') setFormat(v);
    else if (k === 'translateEnabled') setTranslateEnabled(v);
    else if (k === 'targetLanguage') setTargetLanguage(v);
    else if (k === 'uploadFolder') { setUploadFolder(v); localStorage.setItem('driveFolder', v || ''); }
  };

  const update = (id, patch) => setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addChapter = () => setChapters((prev) => [...prev, newChapter()]);
  const addChapters = (list) => setChapters((prev) => [...prev, ...list.map((c) => newChapter({ title: c.title || '', images: c.images || [] }))]);
  const removeChapter = (id) => setChapters((prev) => prev.filter((c) => c.id !== id));

  const spend = async () => {
    const next = (credits ?? 0) - 1;
    setCredits(next);
    try { await base44.auth.updateMe({ credits: next }); await checkUserAuth(); } catch (_) { /* ignore */ }
  };

  const runOcr = async (id) => {
    const idx = chapters.findIndex((c) => c.id === id);
    const ch = chapters[idx];
    if (!ch || !ch.images.length) return;
    if (!hasCredits) { update(id, { ocrError: 'Not enough credits — add credits in Settings' }); return; }
    update(id, { ocrStatus: 'running', ocrError: '', ocrOutput: '' });
    const opId = addOp({ label: `OCR · ${ch.title.trim() || 'Chapter ' + (idx + 1)}`, type: 'ocr' });
    try {
      const res = await base44.functions.invoke('ocrImages', {
        image_urls: ch.images.map((i) => i.url),
        format, title: ch.title.trim() || serieTitle.trim() || null,
        markers: getMarkers(), empty_line: emptyLine
      });
      const out = (res.data && res.data.fullOutput) || '';
      update(id, { ocrStatus: 'done', ocrOutput: out });
      addEntry({ id: `${id}-ocr`, serie: serieTitle.trim() || ch.title.trim() || 'Untitled', chapter: idx + 1, type: 'ocr', language: null, format, content: out, created: Date.now() });
      updateOp(opId, { status: 'done', progress: 100, finishedAt: Date.now() });
      await spend();
    } catch (e) {
      update(id, { ocrStatus: 'error', ocrError: e.message || 'OCR failed' });
      updateOp(opId, { status: 'error', error: e.message, finishedAt: Date.now() });
    }
  };

  const translate = async (id) => {
    const idx = chapters.findIndex((c) => c.id === id);
    const ch = chapters[idx];
    if (!ch || !ch.ocrOutput) return;
    if (!hasCredits) { update(id, { translateError: 'Not enough credits — add credits in Settings' }); return; }
    update(id, { translateStatus: 'running', translateError: '', translateOutput: '' });
    const opId = addOp({ label: `Translate · ${ch.title.trim() || 'Chapter ' + (idx + 1)} · ${targetLanguage}`, type: 'translation' });
    try {
      const res = await base44.functions.invoke('translateChapter', { text: ch.ocrOutput, target_language: targetLanguage });
      const out = (res.data && res.data.translated) || '';
      update(id, { translateStatus: 'done', translateOutput: out });
      addEntry({ id: `${id}-tl`, serie: serieTitle.trim() || ch.title.trim() || 'Untitled', chapter: idx + 1, type: 'translation', language: targetLanguage, format, content: out, created: Date.now() });
      updateOp(opId, { status: 'done', progress: 100, finishedAt: Date.now() });
      await spend();
    } catch (e) {
      update(id, { translateStatus: 'error', translateError: e.message || 'Translation failed' });
      updateOp(opId, { status: 'error', error: e.message, finishedAt: Date.now() });
    }
  };

  const runAllOcr = async () => {
    if (!hasCredits) return;
    const targets = chapters.filter((c) => c.images.length);
    if (!targets.length) return;
    setRunAllBusy(true);
    const aggId = addOp({ label: `OCR · ${targets.length} chapter${targets.length > 1 ? 's' : ''}`, type: 'ocr', progress: 0, total: targets.length, completed: 0 });
    let completed = 0, remaining = credits ?? 0;
    for (const c of targets) {
      if (remaining < 1) break;
      await runOcr(c.id);
      remaining--; completed++;
      updateOp(aggId, { completed, progress: Math.round((completed / targets.length) * 100) });
    }
    updateOp(aggId, { status: 'done', progress: 100, finishedAt: Date.now() });
    setRunAllBusy(false);
  };
  const translateAll = async () => {
    if (!hasCredits) return;
    const targets = chapters.filter((c) => c.ocrOutput);
    if (!targets.length) return;
    setTransAllBusy(true);
    const aggId = addOp({ label: `Translate · ${targets.length} chapter${targets.length > 1 ? 's' : ''} · ${targetLanguage}`, type: 'translation', progress: 0, total: targets.length, completed: 0 });
    let completed = 0, remaining = credits ?? 0;
    for (const c of targets) {
      if (remaining < 1) break;
      await translate(c.id);
      remaining--; completed++;
      updateOp(aggId, { completed, progress: Math.round((completed / targets.length) * 100) });
    }
    updateOp(aggId, { status: 'done', progress: 100, finishedAt: Date.now() });
    setTransAllBusy(false);
  };

  const hasImages = chapters.some((c) => c.images.length > 0);
  const hasOcr = chapters.some((c) => c.ocrOutput);

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="text-2xl font-heading font-semibold text-[hsl(var(--c-text))]">Batch OCR Workspace</h1>
          <span className="flex items-center gap-1.5 text-sm text-[hsl(var(--c-dim))] shrink-0">
            <Zap className="w-4 h-4 text-[hsl(var(--c-accent))]" />
            <span className="font-semibold text-[hsl(var(--c-text))]">{credits ?? '…'}</span> credits
          </span>
        </div>
        <p className="text-[hsl(var(--c-dim))] text-sm mb-6">
          Add multiple chapters, queue images for each, run OCR per chapter or all at once, and optionally translate.
        </p>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="space-y-4 order-2 lg:order-1 min-w-0">
            <div className="flex flex-wrap gap-2 items-start">
              <BatchImport onChapters={addChapters} />
              <button onClick={addChapter} className="flex items-center gap-2 bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] text-[hsl(var(--c-text))] rounded-lg px-3 py-2 text-sm font-medium">
                <Plus className="w-4 h-4" /> Empty chapter
              </button>
              <button
                onClick={runAllOcr}
                disabled={runAllBusy || !hasImages || !hasCredits}
                className="flex items-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 text-sm font-medium"
              >
                {runAllBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Run all OCR
              </button>
              {translateEnabled && (
                <button
                  onClick={translateAll}
                  disabled={transAllBusy || !hasOcr || !hasCredits}
                  className="flex items-center gap-2 bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] disabled:opacity-40 disabled:cursor-not-allowed text-[hsl(var(--c-text))] rounded-lg px-3 py-2 text-sm font-medium"
                >
                  {transAllBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                  Translate all
                </button>
              )}
            </div>

            {chapters.length === 0 && (
              <div className="rounded-xl border border-dashed border-[hsl(var(--c-border))] p-10 text-center text-[hsl(var(--c-dim))]">
                <ScanText className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Import a Drive folder with chapters, or add an empty chapter to begin.</p>
              </div>
            )}

            {chapters.map((c, i) => (
              <ChapterCard
                key={c.id} chapter={c} index={i}
                serieTitle={serieTitle} format={format}
                translateEnabled={translateEnabled} targetLanguage={targetLanguage}
                uploadFolder={uploadFolder} canRun={hasCredits}
                onUpdate={update} onRemove={removeChapter}
                onRunOcr={runOcr} onTranslate={translate}
                onPreview={(images, idx) => setLightbox({ images, index: idx })}
              />
            ))}
          </div>

          <div className="order-1 lg:order-2 lg:sticky lg:top-6">
            <GlobalOptions
              serieTitle={serieTitle} format={format}
              translateEnabled={translateEnabled} targetLanguage={targetLanguage}
              uploadFolder={uploadFolder} onField={onField}
            />
          </div>
        </div>
      </div>

      <ImageLightbox
        images={lightbox.images} index={lightbox.index}
        onClose={() => setLightbox({ images: [], index: null })}
        onNavigate={(i) => setLightbox((s) => ({ ...s, index: i }))}
      />
    </div>
  );
}