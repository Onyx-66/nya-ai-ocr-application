// OCR / translation engine — runs operations in parallel at module level so they
// keep running when the workspace unmounts (user navigates away). Per-page progress
// is tracked and persisted; results are saved to the library and the workspace store.
import { base44 } from '@/api/base44Client';
import { addEntry } from '@/lib/library';
import { addOp, updateOp, isStopRequested, clearStop, requestStopAll } from '@/lib/operations';
import { logUsage } from '@/lib/usage';
import { getMarkers } from '@/lib/markers';
import { formatPages } from '@/lib/formatOutput';
import * as store from '@/lib/workspaceStore';

const PAGE_CONCURRENCY = 3;
const CHAPTER_CONCURRENCY = 3;

export const stop = requestStopAll;

function chapterNumberOf(id) {
  const i = store.getState().chapters.findIndex((c) => c.id === id);
  return i >= 0 ? i + 1 : 0;
}
function serieOf(ch, ctx) {
  return (ctx.serieTitle || '').trim() || (ch.title || '').trim() || 'Untitled';
}

export async function runChapterOcr(chapter, ctx) {
  const id = chapter.id;
  const images = (chapter.images || []).slice();
  if (!images.length) return;
  if (!ctx.checkCredits()) {
    store.updateChapter(id, { ocrStatus: 'error', ocrError: 'Not enough credits — add credits in Settings' });
    return;
  }
  const perPage = images.map(() => ({ status: 'pending' }));
  store.updateChapter(id, { ocrStatus: 'running', ocrProgress: 0, perPage, ocrOutput: '', ocrError: '' });
  const opId = addOp({
    label: `OCR · ${(chapter.title || '').trim() || 'Chapter ' + chapterNumberOf(id)}`,
    type: 'ocr', progress: 0, total: images.length, completed: 0
  });

  const pageItems = new Array(images.length);
  let completed = 0, failed = false, i = 0;

  async function worker() {
    while (i < images.length) {
      if (isStopRequested()) return;
      const idx = i++;
      perPage[idx] = { status: 'running' };
      store.updateChapter(id, { perPage: [...perPage] });
      try {
        const img = images[idx];
        let ocrUrl = img.uploadedUrl || null;
        if (!ocrUrl && img.local && img.file instanceof File) {
          const up = await base44.integrations.Core.UploadFile({ file: img.file });
          ocrUrl = up.file_url;
          const ch = store.getState().chapters.find((c) => c.id === id);
          if (ch) store.updateChapter(id, { images: ch.images.map((im, j) => j === idx ? { ...im, uploadedUrl: ocrUrl } : im) });
        }
        if (!ocrUrl) ocrUrl = img.url;
        const res = await base44.functions.invoke('ocrImages', {
          image_urls: [ocrUrl], format: ctx.format, title: null,
          markers: ctx.markers, empty_line: ctx.emptyLine
        });
        pageItems[idx] = (res.data && res.data.pages && res.data.pages[0]) || { items: [] };
        perPage[idx] = { status: 'done' };
        completed++;
        const progress = Math.round((completed / images.length) * 100);
        store.updateChapter(id, { perPage: [...perPage], ocrProgress: progress });
        updateOp(opId, { completed, progress });
      } catch (e) {
        perPage[idx] = { status: 'error', error: e.message || 'OCR failed' };
        failed = true;
        store.updateChapter(id, { perPage: [...perPage] });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(PAGE_CONCURRENCY, images.length) }, worker));

  const fmt = ctx.format === 'md' ? 'md' : 'txt';
  const title = (chapter.title || '').trim() || (ctx.serieTitle || '').trim() || null;
  const pages = pageItems.filter(Boolean);
  const out = formatPages(pages, fmt, title, ctx.markers, ctx.emptyLine);

  if (isStopRequested() && completed < images.length) {
    store.updateChapter(id, { ocrStatus: 'idle', ocrProgress: Math.round((completed / images.length) * 100), perPage, ocrOutput: out });
    updateOp(opId, { status: 'done', progress: Math.round((completed / images.length) * 100), finishedAt: Date.now() });
    store.flush();
    return;
  }

  store.updateChapter(id, { ocrStatus: failed ? 'error' : 'done', ocrProgress: 100, ocrOutput: out, perPage: [...perPage] });
  const serie = serieOf(chapter, ctx);
  addEntry({ id: `${id}-ocr`, serie, chapter: chapterNumberOf(id), type: 'ocr', language: null, format: fmt, content: out, created: Date.now() });
  updateOp(opId, { status: 'done', progress: 100, finishedAt: Date.now(), entryId: `${id}-ocr` });
  logUsage({ type: 'ocr', series: serie });
  await ctx.spendCredit();
  store.flush();
}

export async function runChapterTranslate(chapter, ctx) {
  const id = chapter.id;
  const text = chapter.ocrOutput;
  if (!text) return;
  if (!ctx.checkCredits()) {
    store.updateChapter(id, { translateStatus: 'error', translateError: 'Not enough credits — add credits in Settings' });
    return;
  }
  store.updateChapter(id, { translateStatus: 'running', translateProgress: 0, translateOutput: '', translateError: '' });
  const opId = addOp({
    label: `Translate · ${(chapter.title || '').trim() || 'Chapter ' + chapterNumberOf(id)} · ${ctx.targetLanguage}`,
    type: 'translation', progress: 0
  });
  try {
    updateOp(opId, { progress: 40 });
    const res = await base44.functions.invoke('translateChapter', { text, target_language: ctx.targetLanguage });
    const out = (res.data && res.data.translated) || '';
    store.updateChapter(id, { translateStatus: 'done', translateProgress: 100, translateOutput: out });
    const serie = serieOf(chapter, ctx);
    addEntry({ id: `${id}-tl`, serie, chapter: chapterNumberOf(id), type: 'translation', language: ctx.targetLanguage, format: chapter.format || ctx.format, content: out, created: Date.now() });
    updateOp(opId, { status: 'done', progress: 100, finishedAt: Date.now(), entryId: `${id}-tl` });
    logUsage({ type: 'translation', series: serie });
    await ctx.spendCredit();
    store.flush();
  } catch (e) {
    store.updateChapter(id, { translateStatus: 'error', translateError: e.message || 'Translation failed' });
    updateOp(opId, { status: 'error', error: e.message, finishedAt: Date.now() });
    store.flush();
  }
}

export async function startBatch({ translate, checkCredits, spendCredit }) {
  clearStop();
  const s = store.getState();
  const ctx = {
    serieTitle: s.serieTitle, format: s.format, markers: getMarkers(),
    emptyLine: s.emptyLine, targetLanguage: s.targetLanguage, checkCredits, spendCredit
  };
  const targets = s.chapters.filter((c) => (c.images || []).length && c.ocrStatus !== 'done' && c.ocrStatus !== 'running');
  if (!targets.length) return;

  const aggId = addOp({
    label: `Operation · ${targets.length} chapter${targets.length > 1 ? 's' : ''}`,
    type: 'ocr', progress: 0, total: targets.length, completed: 0
  });
  let done = 0, qi = 0;
  async function chapterWorker() {
    while (qi < targets.length) {
      if (isStopRequested()) return;
      if (!checkCredits()) return;
      const i = qi++;
      const ch = store.getState().chapters.find((c) => c.id === targets[i].id) || targets[i];
      await runChapterOcr(ch, ctx);
      done++;
      updateOp(aggId, { completed: done, progress: Math.round((done / targets.length) * 100) });
    }
  }
  await Promise.all(Array.from({ length: Math.min(CHAPTER_CONCURRENCY, targets.length) }, chapterWorker));
  updateOp(aggId, { status: 'done', progress: 100, finishedAt: Date.now() });

  if (translate && !isStopRequested() && checkCredits()) {
    const tlTargets = store.getState().chapters.filter((c) => c.ocrOutput && c.translateStatus !== 'done' && c.translateStatus !== 'running');
    if (tlTargets.length) {
      const tlId = addOp({
        label: `Translate · ${tlTargets.length} chapter${tlTargets.length > 1 ? 's' : ''} · ${ctx.targetLanguage}`,
        type: 'translation', progress: 0, total: tlTargets.length, completed: 0
      });
      let td = 0, ti = 0;
      async function tlWorker() {
        while (ti < tlTargets.length) {
          if (isStopRequested()) return;
          if (!checkCredits()) return;
          const i = ti++;
          const ch = store.getState().chapters.find((c) => c.id === tlTargets[i].id) || tlTargets[i];
          await runChapterTranslate(ch, ctx);
          td++;
          updateOp(tlId, { completed: td, progress: Math.round((td / tlTargets.length) * 100) });
        }
      }
      await Promise.all(Array.from({ length: Math.min(CHAPTER_CONCURRENCY, tlTargets.length) }, tlWorker));
      updateOp(tlId, { status: 'done', progress: 100, finishedAt: Date.now() });
    }
  }
}