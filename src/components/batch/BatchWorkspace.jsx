import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { getDefaults } from '@/lib/appDefaults';
import { getActiveTemplate, ensureDefaultTemplates } from '@/lib/exportTemplates';
import { getMarkers, saveMarkers } from '@/lib/markers';
import * as store from '@/lib/workspaceStore';
import * as engine from '@/lib/ocrEngine';
import { hasLocalServer } from '@/lib/localServer';
import { requestStopAll } from '@/lib/operations';
import GlobalOptions from '@/components/batch/GlobalOptions';
import ChapterCard from '@/components/batch/ChapterCard';
import StageBadges from '@/components/batch/StageBadges';
import ImageLightbox from '@/components/batch/ImageLightbox';
import ImportModal from '@/components/batch/ImportModal';
import { Trash2, Sparkles, Zap, Play, Square, ChevronsDown, ChevronsUp } from 'lucide-react';

const newChapter = (overrides = {}) => ({
  id: crypto.randomUUID(), title: '', images: [], expanded: true,
  ocrStatus: 'idle', ocrProgress: 0, perPage: [], ocrOutput: '', ocrError: '', ocrPages: [],
  translateStatus: 'idle', translateProgress: 0, translateOutput: '', translateError: '',
  cleanStatus: 'idle', cleanProgress: 0, cleanedImages: [], cleanError: '',
  typesetStatus: 'idle', typesetProgress: 0, typesetImages: [], typesetError: '',
  ...overrides
});

export default function BatchWorkspace() {
  const { user, checkUserAuth } = useAuth();
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const { chapters, serieTitle, format, translateEnabled, targetLanguage, emptyLine, uploadFolder } = state;

  const [lightbox, setLightbox] = useState({ images: [], index: null });
  const [importOpen, setImportOpen] = useState(false);
  const [credits, setCredits] = useState(user?.credits ?? 0);
  const creditsRef = useRef(user?.credits ?? 0);
  useEffect(() => { creditsRef.current = user?.credits ?? 0; setCredits(user?.credits ?? 0); }, [user]);

  useEffect(() => {
    ensureDefaultTemplates();
    const s = store.getState();
    if (!s.chapters.length && !s.serieTitle) {
      const dd = getDefaults();
      store.setState({ serieTitle: dd.serie, format: dd.format, translateEnabled: dd.translate, targetLanguage: dd.language, emptyLine: dd.emptyLine });
      const t = getActiveTemplate();
      if (t) { store.setState({ format: t.format, emptyLine: t.emptyLine }); saveMarkers(t.markers); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasCredits = credits >= 1;
  const running = chapters.some((c) => c.ocrStatus === 'running' || c.translateStatus === 'running' || c.cleanStatus === 'running' || c.typesetStatus === 'running');

  const checkCredits = () => creditsRef.current >= 1;
  const spendCredit = async () => {
    try {
      const res = await base44.functions.invoke('manageCredits', { action: 'spend' });
      if (res.data && typeof res.data.credits === 'number') {
        creditsRef.current = res.data.credits;
        setCredits(res.data.credits);
      }
      await checkUserAuth();
    } catch {}
  };
  const makeCtx = () => ({
    serieTitle: store.getState().serieTitle, format: store.getState().format,
    markers: getMarkers(), emptyLine: store.getState().emptyLine,
    targetLanguage: store.getState().targetLanguage, checkCredits, spendCredit,
    includeBoxes: hasLocalServer('typesetting')
  });

  const onField = (k, v) => {
    if (k === 'serieTitle') store.setState({ serieTitle: v });
    else if (k === 'format') store.setState({ format: v });
    else if (k === 'translateEnabled') store.setState({ translateEnabled: v });
    else if (k === 'targetLanguage') store.setState({ targetLanguage: v });
    else if (k === 'emptyLine') store.setState({ emptyLine: v });
    else if (k === 'template') { if (v) { store.setState({ format: v.format, emptyLine: v.emptyLine }); saveMarkers(v.markers); } }
    else if (k === 'uploadFolder') { store.setState({ uploadFolder: v }); localStorage.setItem('driveFolder', v || ''); }
  };

  const update = (id, patch) => store.updateChapter(id, patch);
  const addChapter = () => store.addChapters([newChapter()]);
  const addChapters = (list) => store.addChapters(list.map((c) => newChapter({ title: c.title || '', images: c.images || [] })));
  const removeChapter = (id) => store.removeChapter(id);

  const onRunOcr = (id) => { const ch = store.getState().chapters.find((c) => c.id === id); if (ch) engine.runChapterOcr(ch, makeCtx()); };
  const onTranslate = (id) => { const ch = store.getState().chapters.find((c) => c.id === id); if (ch) engine.runChapterTranslate(ch, makeCtx()); };
  const onClean = (id) => { const ch = store.getState().chapters.find((c) => c.id === id); if (ch) engine.runChapterClean(ch, makeCtx()); };
  const onTypeset = (id) => { const ch = store.getState().chapters.find((c) => c.id === id); if (ch) engine.runChapterTypeset(ch, makeCtx()); };

  const startOperation = () => engine.startBatch({ translate: store.getState().translateEnabled, checkCredits, spendCredit });
  const stopOperation = () => requestStopAll();

  const allExpanded = chapters.length > 0 && chapters.every((c) => c.expanded !== false);
  const toggleAllExpanded = () => store.setChapters(chapters.map((c) => ({ ...c, expanded: !allExpanded })));

  const hasImages = chapters.some((c) => c.images.length > 0);

  return (
    <div className="p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="text-2xl font-heading font-semibold text-[hsl(var(--c-text))]">Batch OCR Workspace</h1>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="flex items-center gap-1.5 text-sm text-[hsl(var(--c-dim))]">
              <Zap className="w-4 h-4 text-[hsl(var(--c-accent))]" />
              <span className="font-semibold text-[hsl(var(--c-text))]">{credits}</span> credits
            </span>
          </div>
        </div>
        <div className="mb-4"><StageBadges /></div>
        <p className="text-[hsl(var(--c-dim))] text-sm mb-6">Set your options, import chapters, then start the operation. Running jobs keep going if you switch pages.</p>

        <div className="space-y-4">
          <GlobalOptions
            serieTitle={serieTitle} format={format}
            translateEnabled={translateEnabled} targetLanguage={targetLanguage}
            emptyLine={emptyLine} uploadFolder={uploadFolder}
            onField={onField}
          />

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setImportOpen(true)} className="flex items-center justify-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-lg px-3 py-2.5 text-sm font-medium">
              <Sparkles className="w-4 h-4" /> Import
            </button>
            <button onClick={addChapter} className="flex items-center justify-center gap-2 bg-[hsl(var(--c-danger))] hover:opacity-90 text-[hsl(var(--c-danger-fg))] rounded-lg px-3 py-2.5 text-sm font-medium">
              <Trash2 className="w-4 h-4" /> Empty chapter
            </button>
          </div>
          <button
            onClick={running ? stopOperation : startOperation}
            disabled={!running && (!hasImages || !hasCredits)}
            className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed text-white ${running ? 'bg-[hsl(var(--c-danger-strong))] hover:opacity-90' : 'bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))]'}`}
          >
            {running ? <><Square className="w-4 h-4" /> Stop operation</> : <><Play className="w-4 h-4" /> Start operation</>}
          </button>

          {chapters.length > 0 && (
            <button onClick={toggleAllExpanded} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-accent))] hover:opacity-80">
              {allExpanded ? <><ChevronsUp className="w-3.5 h-3.5" /> Hide all chapters</> : <><ChevronsDown className="w-3.5 h-3.5" /> Expand all chapters</>}
            </button>
          )}

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
              onRunOcr={onRunOcr} onTranslate={onTranslate}
              onClean={onClean} onTypeset={onTypeset}
              onToggleExpand={(cid) => store.updateChapter(cid, { expanded: !(store.getState().chapters.find((c) => c.id === cid)?.expanded !== false) })}
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