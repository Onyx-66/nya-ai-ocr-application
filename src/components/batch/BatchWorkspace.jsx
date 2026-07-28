import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { getMarkers, saveMarkers } from '@/lib/markers';
import { getDefaults } from '@/lib/appDefaults';
import { getActiveTemplate, ensureDefaultTemplates } from '@/lib/exportTemplates';
import { addEntry } from '@/lib/library';
import { addOp, updateOp, isStopRequested, clearStop, requestStopAll } from '@/lib/operations';
import GlobalOptions from '@/components/batch/GlobalOptions';
import ChapterCard from '@/components/batch/ChapterCard';
import ImageLightbox from '@/components/batch/ImageLightbox';
import ImportModal from '@/components/batch/ImportModal';
import { loadWorkspace, saveWorkspace } from '@/lib/workspaceState';
import { logUsage } from '@/lib/usage';
import { Trash2, Sparkles, Zap, Play, Square, ChevronsDown, ChevronsUp } from 'lucide-react';

const newChapter = (overrides = {}) => ({
  id: crypto.randomUUID(), title: '', images: [], expanded: true,
  ocrStatus: 'idle', ocrOutput: '', ocrError: '',
  translateStatus: 'idle', translateOutput: '', translateError: '',
  ...overrides
});

export default function BatchWorkspace() {
  const { user, checkUserAuth } = useAuth();
  const d = getDefaults();
  ensureDefaultTemplates();
  const [chapters, setChapters] = useState([]);
  const [serieTitle, setSerieTitle] = useState(d.serie);
  const [format, setFormat] = useState(d.format);
  const [translateEnabled, setTranslateEnabled] = useState(d.translate);
  const [targetLanguage, setTargetLanguage] = useState(d.language);
  const [emptyLine, setEmptyLine] = useState(d.emptyLine);
  const [uploadFolder, setUploadFolder] = useState(() => localStorage.getItem('driveFolder') || null);
  const [lightbox, setLightbox] = useState({ images: [], index: null });
  const [importOpen, setImportOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [credits, setCredits] = useState(null);

  useEffect(() => { setCredits(user?.credits ?? null); }, [user]);
  const hasCredits = (credits ?? 0) >= 1;

  // Restore persisted workspace (chapters survive navigation away) or apply defaults.
  useEffect(() => {
    const saved = loadWorkspace();
    if (saved && saved.chapters && saved.chapters.length) {
      setChapters(saved.chapters.map((c) => ({ ...c, expanded: c.expanded !== false })));
      if (saved.serieTitle != null) setSerieTitle(saved.serieTitle);
      if (saved.format) setFormat(saved.format);
      if (saved.translateEnabled != null) setTranslateEnabled(saved.translateEnabled);
      if (saved.targetLanguage) setTargetLanguage(saved.targetLanguage);
      if (saved.emptyLine != null) setEmptyLine(saved.emptyLine);
      if (saved.uploadFolder) setUploadFolder(saved.uploadFolder);
    } else {
      const dd = getDefaults();
      setSerieTitle(dd.serie); setFormat(dd.format); setTranslateEnabled(dd.translate);
      setTargetLanguage(dd.language); setEmptyLine(dd.emptyLine);
      const t = getActiveTemplate();
      if (t) applyTemplate(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist workspace state so imported chapters survive navigation.
  useEffect(() => {
    saveWorkspace({ chapters, serieTitle, format, translateEnabled, targetLanguage, emptyLine, uploadFolder });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters, serieTitle, format, translateEnabled, targetLanguage, emptyLine, uploadFolder]);

  const allExpanded = chapters.length > 0 && chapters.every((c) => c.expanded !== false);
  const toggleAllExpanded = () => setChapters((prev) => prev.map((c) => ({ ...c, expanded: !allExpanded })));

  const applyTemplate = (t) => {
    if (!t) return;
    setFormat(t.format); setEmptyLine(t.emptyLine); saveMarkers(t.markers);
  };

  const onField = (k, v) => {
    if (k === 'serieTitle') setSerieTitle(v);
    else if (k === 'format') setFormat(v);
    else if (k === 'translateEnabled') setTranslateEnabled(v);
    else if (k === 'targetLanguage') setTargetLanguage(v);
    else if (k === 'emptyLine') setEmptyLine(v);
    else if (k === 'template') applyTemplate(v);
    else if (k === 'uploadFolder') { setUploadFolder(v); localStorage.setItem('driveFolder', v || ''); }
  };

  const update = (id, patch) => setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addChapter = () => setChapters((prev) => [...prev, newChapter()]);
  const addChapters = (list) => setChapters((prev) => [...prev, ...list.map((c) => newChapter({ title: c.title || '', images: c.images || [] }))]);
  const removeChapter = (id) => setChapters((prev) => prev.filter((c) => c.id !== id));

  const spend = async () => {
    const next = (credits ?? 0) - 1;
    setCredits(next);
    try { await base44.auth.updateMe({ credits: next }); await checkUserAuth(); } catch (_) {}
  };

  const runOcr = async (id) => {
    const idx = chapters.findIndex((c) => c.id === id);
    const ch = chapters[idx];
    if (!ch || !ch.images.length) return;
    if ((credits ?? 0) < 1) { update(id, { ocrError: 'Not enough credits — add credits in Settings' }); return; }
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
      updateOp(opId, { status: 'done', progress: 100, finishedAt: Date.now(), entryId: `${id}-ocr` });
      logUsage({ type: 'ocr', series: serieTitle.trim() || ch.title.trim() || 'Untitled' });
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
    if ((credits ?? 0) < 1) { update(id, { translateError: 'Not enough credits — add credits in Settings' }); return; }
    update(id, { translateStatus: 'running', translateError: '', translateOutput: '' });
    const opId = addOp({ label: `Translate · ${ch.title.trim() || 'Chapter ' + (idx + 1)} · ${targetLanguage}`, type: 'translation' });
    try {
      const res = await base44.functions.invoke('translateChapter', { text: ch.ocrOutput, target_language: targetLanguage });
      const out = (res.data && res.data.translated) || '';
      update(id, { translateStatus: 'done', translateOutput: out });
      addEntry({ id: `${id}-tl`, serie: serieTitle.trim() || ch.title.trim() || 'Untitled', chapter: idx + 1, type: 'translation', language: targetLanguage, format, content: out, created: Date.now() });
      updateOp(opId, { status: 'done', progress: 100, finishedAt: Date.now(), entryId: `${id}-tl` });
      logUsage({ type: 'translation', series: serieTitle.trim() || ch.title.trim() || 'Untitled' });
      await spend();
    } catch (e) {
      update(id, { translateStatus: 'error', translateError: e.message || 'Translation failed' });
      updateOp(opId, { status: 'error', error: e.message, finishedAt: Date.now() });
    }
  };

  const startOperation = async () => {
    if ((credits ?? 0) < 1) return;
    const ocrTargets = chapters.filter((c) => c.images.length);
    if (!ocrTargets.length) return;
    setRunning(true); clearStop();
    const aggId = addOp({ label: `Operation · ${ocrTargets.length} chapter${ocrTargets.length > 1 ? 's' : ''}`, type: 'ocr', progress: 0, total: ocrTargets.length, completed: 0 });
    let completed = 0, remaining = credits ?? 0;
    for (const c of ocrTargets) {
      if (isStopRequested()) break;
      if (remaining < 1) break;
      await runOcr(c.id); remaining--; completed++;
      updateOp(aggId, { completed, progress: Math.round((completed / ocrTargets.length) * 100) });
    }
    // Translate pass if enabled and not stopped and credits remain
    if (translateEnabled && !isStopRequested() && remaining >= 1) {
      const tlTargets = chapters.filter((c) => c.ocrOutput && c.translateStatus !== 'done');
      if (tlTargets.length) {
        const tlId = addOp({ label: `Translate · ${tlTargets.length} chapter${tlTargets.length > 1 ? 's' : ''} · ${targetLanguage}`, type: 'translation', progress: 0, total: tlTargets.length, completed: 0 });
        let tdone = 0;
        for (const c of tlTargets) {
          if (isStopRequested()) break;
          if (remaining < 1) break;
          await translate(c.id); remaining--; tdone++;
          updateOp(tlId, { completed: tdone, progress: Math.round((tdone / tlTargets.length) * 100) });
        }
        updateOp(tlId, { status: 'done', progress: 100, finishedAt: Date.now() });
      }
    }
    updateOp(aggId, { status: isStopRequested() ? 'done' : 'done', progress: 100, finishedAt: Date.now() });
    clearStop(); setRunning(false);
  };

  const requestStop = () => { requestStopAll(); setRunning(false); };

  const hasImages = chapters.some((c) => c.images.length > 0);

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="text-2xl font-heading font-semibold text-[hsl(var(--c-text))]">Batch OCR Workspace</h1>
          <span className="flex items-center gap-1.5 text-sm text-[hsl(var(--c-dim))] shrink-0">
            <Zap className="w-4 h-4 text-[hsl(var(--c-accent))]" />
            <span className="font-semibold text-[hsl(var(--c-text))]">{credits ?? '…'}</span> credits
          </span>
        </div>
        <p className="text-[hsl(var(--c-dim))] text-sm mb-6">Set your options, import chapters, then start the operation.</p>

        <div className="space-y-4">
          {/* Options — first */}
          <GlobalOptions
            serieTitle={serieTitle} format={format}
            translateEnabled={translateEnabled} targetLanguage={targetLanguage}
            emptyLine={emptyLine} uploadFolder={uploadFolder}
            onField={onField}
          />

          {/* Action buttons — under options */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setImportOpen(true)} className="flex items-center justify-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-lg px-3 py-2.5 text-sm font-medium">
              <Sparkles className="w-4 h-4" /> Import
            </button>
            <button onClick={addChapter} className="flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg px-3 py-2.5 text-sm font-medium">
              <Trash2 className="w-4 h-4" /> Empty chapter
            </button>
          </div>
          <button
            onClick={running ? requestStop : startOperation}
            disabled={!running && (!hasImages || !hasCredits)}
            className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed text-white ${running ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))]'}`}
          >
            {running ? <><Square className="w-4 h-4" /> Stop operation</> : <><Play className="w-4 h-4" /> Start operation</>}
          </button>

          {chapters.length > 0 && (
            <button onClick={toggleAllExpanded} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-accent))] hover:opacity-80">
              {allExpanded ? <><ChevronsUp className="w-3.5 h-3.5" /> Hide all chapters</> : <><ChevronsDown className="w-3.5 h-3.5" /> Expand all chapters</>}
            </button>
          )}

          {/* Chapters */}
          {chapters.length === 0 && (
            <div className="rounded-xl border border-dashed border-[hsl(var(--c-border))] p-10 text-center text-[hsl(var(--c-dim))]">
              <Sparkles className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No chapters yet — click <span className="text-[hsl(var(--c-text))] font-medium">Import</span> to add images, or add an empty chapter.</p>
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
              onToggleExpand={(cid) => setChapters((prev) => prev.map((ch) => (ch.id === cid ? { ...ch, expanded: !(ch.expanded !== false) } : ch)))}
              onPreview={(images, idx) => setLightbox({ images, index: idx })}
            />
          ))}
        </div>
      </div>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onChapters={addChapters} />
      <ImageLightbox images={lightbox.images} index={lightbox.index} onClose={() => setLightbox({ images: [], index: null })} onNavigate={(i) => setLightbox((s) => ({ ...s, index: i }))} />
    </div>
  );
}