// OCR / translation / cleaning / typesetting engine — runs operations in parallel
// at module level so they keep running when the workspace unmounts. Per-page
// progress is tracked and persisted; results are saved to the library and the
// workspace store. Each stage can route to a self-hosted local server when
// configured in Settings; otherwise the Base44 cloud function is used.
import { base44 } from '@/api/base44Client';
import { addEntry } from '@/lib/library';
import { addOp, updateOp, isStopRequested, clearStop, requestStopAll } from '@/lib/operations';
import { logUsage } from '@/lib/usage';
import { getMarkers } from '@/lib/markers';
import { formatPages } from '@/lib/formatOutput';
import * as store from '@/lib/workspaceStore';
import { getLocalServerFor, hasLocalServer } from '@/lib/localServer';
import { toast } from '@/components/ui/use-toast';

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

// ── OCR ──────────────────────────────────────────────────────────────────

async function runOcrPage(img, ctx) {
  const localBase = getLocalServerFor('ocr');
  if (localBase) {
    const fd = new FormData();
    if (img.local && img.file instanceof File) {
      fd.append('image', img.file, img.file.name || 'page.png');
    } else {
      fd.append('image_url', img.uploadedUrl || img.url);
    }
    fd.append('format', ctx.format || 'txt');
    if (ctx.markers) fd.append('markers', JSON.stringify(ctx.markers));
    if (ctx.emptyLine != null) fd.append('empty_line', String(ctx.emptyLine));
    if (ctx.includeBoxes) fd.append('include_boxes', 'true');
    const r = await fetch(`${localBase.replace(/\/$/, '')}/ocr`, { method: 'POST', body: fd });
    if (!r.ok) throw new Error(`Local OCR server error: ${r.status}`);
    const data = await r.json();
    return { pages: (data.pages && data.pages.length) ? data.pages : [{ items: data.items || [] }] };
  }
  return base44.functions.invoke('ocrImages', {
    image_urls: [img.uploadedUrl || img.url], format: ctx.format, title: null,
    markers: ctx.markers, empty_line: ctx.emptyLine
  });
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
  store.updateChapter(id, { ocrStatus: 'running', ocrProgress: 0, perPage, ocrOutput: '', ocrError: '', ocrPages: [] });
  const opId = addOp({
    label: `OCR · ${(chapter.title || '').trim() || 'Chapter ' + chapterNumberOf(id)}`,
    type: 'ocr', progress: 0, total: images.length, completed: 0
  });

  const pageItems = new Array(images.length);
  let completed = 0, failed = false, i = 0;
  const useLocal = !!getLocalServerFor('ocr');

  async function worker() {
    while (i < images.length) {
      if (isStopRequested()) return;
      const idx = i++;
      perPage[idx] = { status: 'running' };
      store.updateChapter(id, { perPage: [...perPage] });
      try {
        const img = images[idx];
        let pageImg = img;
        if (!useLocal && !img.uploadedUrl && img.local && img.file instanceof File) {
          const up = await base44.integrations.Core.UploadFile({ file: img.file });
          pageImg = { ...img, uploadedUrl: up.file_url };
          const ch = store.getState().chapters.find((c) => c.id === id);
          if (ch) store.updateChapter(id, { images: ch.images.map((im, j) => j === idx ? { ...im, uploadedUrl: up.file_url } : im) });
        }
        const res = await runOcrPage(pageImg, ctx);
        const pagesArr = res.data ? res.data.pages : res.pages;
        pageItems[idx] = (pagesArr && pagesArr[0]) || { items: [] };
        perPage[idx] = { status: 'done' };
        completed++;
        const progress = Math.round((completed / images.length) * 100);
        store.updateChapter(id, { perPage: [...perPage], ocrProgress: progress });
        updateOp(opId, { completed, progress });
      } catch (e) {
        perPage[idx] = { status: 'error', error: e.message || 'OCR failed' };
        failed = true;
        store.updateChapter(id, { perPage: [...perPage] });
        if (useLocal) toast({ title: 'OCR failed', description: e.message || 'Local OCR server error', variant: 'destructive' });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(PAGE_CONCURRENCY, images.length) }, worker));

  const fmt = ctx.format === 'md' ? 'md' : 'txt';
  const title = (chapter.title || '').trim() || (ctx.serieTitle || '').trim() || null;
  const ocrPages = pageItems.map((p) => p || { items: [] });
  const out = formatPages(ocrPages, fmt, title, ctx.markers, ctx.emptyLine);

  if (isStopRequested() && completed < images.length) {
    store.updateChapter(id, { ocrStatus: 'idle', ocrProgress: Math.round((completed / images.length) * 100), perPage, ocrOutput: out, ocrPages });
    updateOp(opId, { status: 'done', progress: Math.round((completed / images.length) * 100), finishedAt: Date.now() });
    store.flush();
    return;
  }

  store.updateChapter(id, { ocrStatus: failed ? 'error' : 'done', ocrProgress: 100, ocrOutput: out, ocrPages, perPage: [...perPage] });
  const serie = serieOf(chapter, ctx);
  addEntry({ id: `${id}-ocr`, serie, chapter: chapterNumberOf(id), type: 'ocr', language: null, format: fmt, content: out, created: Date.now() });
  updateOp(opId, { status: 'done', progress: 100, finishedAt: Date.now(), entryId: `${id}-ocr` });
  logUsage({ type: 'ocr', series: serie });
  await ctx.spendCredit();
  store.flush();
}

// ── Cleaning ────────────────────────────────────────────────────────────

export async function runChapterClean(chapter, ctx) {
  const id = chapter.id;
  const localBase = getLocalServerFor('cleaning');
  if (!localBase) return;
  const images = (chapter.images || []).slice();
  if (!images.length) return;

  const perPage = images.map(() => ({ status: 'pending' }));
  store.updateChapter(id, { cleanStatus: 'running', cleanProgress: 0, perPageClean: perPage, cleanError: '', cleanedImages: [] });
  const opId = addOp({
    label: `Clean · ${(chapter.title || '').trim() || 'Chapter ' + chapterNumberOf(id)}`,
    type: 'clean', progress: 0, total: images.length, completed: 0
  });

  const cleaned = new Array(images.length);
  let completed = 0, i = 0;

  async function worker() {
    while (i < images.length) {
      if (isStopRequested()) return;
      const idx = i++;
      perPage[idx] = { status: 'running' };
      store.updateChapter(id, { perPageClean: [...perPage] });
      try {
        const img = images[idx];
        const fd = new FormData();
        if (img.local && img.file instanceof File) {
          fd.append('image', img.file, img.file.name || 'page.png');
        } else {
          fd.append('image_url', img.uploadedUrl || img.url);
        }
        const r = await fetch(`${localBase.replace(/\/$/, '')}/clean`, { method: 'POST', body: fd });
        if (!r.ok) throw new Error(`Local Cleaning server error: ${r.status}`);
        const data = await r.json();
        cleaned[idx] = data.cleaned_image_url || data.cleaned_image || null;
        perPage[idx] = { status: 'done' };
        completed++;
        const progress = Math.round((completed / images.length) * 100);
        store.updateChapter(id, { perPageClean: [...perPage], cleanProgress: progress, cleanedImages: cleaned.filter(Boolean) });
        updateOp(opId, { completed, progress });
      } catch (e) {
        perPage[idx] = { status: 'error', error: e.message || 'Cleaning failed' };
        store.updateChapter(id, { perPageClean: [...perPage] });
        toast({ title: 'Cleaning failed', description: e.message || 'Local cleaning server error', variant: 'destructive' });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(PAGE_CONCURRENCY, images.length) }, worker));

  store.updateChapter(id, { cleanStatus: 'done', cleanProgress: 100, cleanedImages: cleaned.filter(Boolean), perPageClean: [...perPage] });
  updateOp(opId, { status: 'done', progress: 100, finishedAt: Date.now() });
  store.flush();
}

// ── Translation ─────────────────────────────────────────────────────────

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
  const useLocal = !!getLocalServerFor('translation');
  try {
    updateOp(opId, { progress: 40 });
    let out;
    if (useLocal) {
      const r = await fetch(`${getLocalServerFor('translation').replace(/\/$/, '')}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_language: ctx.targetLanguage })
      });
      if (!r.ok) throw new Error(`Local Translation server error: ${r.status}`);
      const data = await r.json();
      out = data.translated || '';
    } else {
      const res = await base44.functions.invoke('translateChapter', { text, target_language: ctx.targetLanguage });
      out = (res.data && res.data.translated) || '';
    }
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
    if (useLocal) toast({ title: 'Translation failed', description: e.message || 'Local translation server error', variant: 'destructive' });
    store.flush();
  }
}

// ── Typesetting ─────────────────────────────────────────────────────────

function buildTypesetItems(ocrPages, translatedText) {
  if (!translatedText || !translatedText.trim()) {
    return ocrPages.map((page) => ({
      items: (page.items || [])
        .filter((it) => (it.text || '').trim())
        .map((it) => ({ text: it.text, type: it.type, box: it.box || null }))
    }));
  }
  const lines = translatedText.split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !/^--- Page \d+ ---$/.test(l) && !/^#+\s/.test(l));
  const result = [];
  let lineIdx = 0;
  for (const page of ocrPages) {
    const pageItems = [];
    for (const it of (page.items || [])) {
      if (!(it.text || '').trim()) continue;
      const text = lineIdx < lines.length ? lines[lineIdx] : it.text;
      pageItems.push({ text, type: it.type, box: it.box || null });
      lineIdx++;
    }
    result.push({ items: pageItems });
  }
  return result;
}

export async function runChapterTypeset(chapter, ctx) {
  const id = chapter.id;
  const localBase = getLocalServerFor('typesetting');
  if (!localBase) return;
  const ocrPages = chapter.ocrPages || [];
  const images = (chapter.images || []).slice();
  if (!images.length || !ocrPages.length) {
    store.updateChapter(id, { typesetError: 'Typesetting requires OCR data with bubble geometry. Run OCR on the local OCR server first.' });
    toast({ title: 'Typesetting skipped', description: 'Run OCR first (local server) to get bubble geometry.', variant: 'destructive' });
    return;
  }

  store.updateChapter(id, { typesetStatus: 'running', typesetProgress: 0, typesetError: '', typesetImages: [] });
  const opId = addOp({
    label: `Typeset · ${(chapter.title || '').trim() || 'Chapter ' + chapterNumberOf(id)}`,
    type: 'typeset', progress: 0, total: images.length, completed: 0
  });

  const typesetItems = buildTypesetItems(ocrPages, chapter.translateOutput);
  const cleanedImages = chapter.cleanedImages || [];
  const output = new Array(images.length);
  let completed = 0, i = 0;

  async function worker() {
    while (i < images.length) {
      if (isStopRequested()) return;
      const idx = i++;
      try {
        const page = typesetItems[idx] || { items: [] };
        const cleanedUrl = cleanedImages[idx] || (images[idx].uploadedUrl || images[idx].url);
        const r = await fetch(`${localBase.replace(/\/$/, '')}/typeset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cleaned_image_url: cleanedUrl, items: page.items })
        });
        if (!r.ok) throw new Error(`Local Typesetting server error: ${r.status}`);
        const data = await r.json();
        output[idx] = data.output_image_url || null;
        completed++;
        const progress = Math.round((completed / images.length) * 100);
        store.updateChapter(id, { typesetProgress: progress, typesetImages: output.filter(Boolean) });
        updateOp(opId, { completed, progress });
      } catch (e) {
        toast({ title: 'Typesetting failed', description: e.message || 'Local typesetting server error', variant: 'destructive' });
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(PAGE_CONCURRENCY, images.length) }, worker));

  store.updateChapter(id, { typesetStatus: 'done', typesetProgress: 100, typesetImages: output.filter(Boolean) });
  updateOp(opId, { status: 'done', progress: 100, finishedAt: Date.now() });
  store.flush();
}

// ── Batch ───────────────────────────────────────────────────────────────

export async function startBatch({ translate, checkCredits, spendCredit }) {
  clearStop();
  const s = store.getState();
  const ctx = {
    serieTitle: s.serieTitle, format: s.format, markers: getMarkers(),
    emptyLine: s.emptyLine, targetLanguage: s.targetLanguage, checkCredits, spendCredit,
    includeBoxes: hasLocalServer('typesetting')
  };
  const targets = s.chapters.filter((c) => (c.images || []).length && c.ocrStatus !== 'done' && c.ocrStatus !== 'running');
  if (!targets.length) return;

  // ── OCR stage ──
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

  // ── Cleaning stage (only if local cleaning server is set) ──
  if (hasLocalServer('cleaning') && !isStopRequested()) {
    const cleanTargets = store.getState().chapters.filter((c) => (c.images || []).length && c.cleanStatus !== 'done' && c.cleanStatus !== 'running');
    if (cleanTargets.length) {
      const cleanId = addOp({
        label: `Clean · ${cleanTargets.length} chapter${cleanTargets.length > 1 ? 's' : ''}`,
        type: 'clean', progress: 0, total: cleanTargets.length, completed: 0
      });
      let cd = 0, ci = 0;
      async function cleanWorker() {
        while (ci < cleanTargets.length) {
          if (isStopRequested()) return;
          const i = ci++;
          const ch = store.getState().chapters.find((c) => c.id === cleanTargets[i].id) || cleanTargets[i];
          await runChapterClean(ch, ctx);
          cd++;
          updateOp(cleanId, { completed: cd, progress: Math.round((cd / cleanTargets.length) * 100) });
        }
      }
      await Promise.all(Array.from({ length: Math.min(CHAPTER_CONCURRENCY, cleanTargets.length) }, cleanWorker));
      updateOp(cleanId, { status: 'done', progress: 100, finishedAt: Date.now() });
    }
  }

  // ── Translation stage (if enabled) ──
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

  // ── Typesetting stage (only if local typesetting server is set) ──
  if (hasLocalServer('typesetting') && !isStopRequested()) {
    const tsTargets = store.getState().chapters.filter((c) => (c.ocrPages || []).length && c.typesetStatus !== 'done' && c.typesetStatus !== 'running');
    if (tsTargets.length) {
      const tsId = addOp({
        label: `Typeset · ${tsTargets.length} chapter${tsTargets.length > 1 ? 's' : ''}`,
        type: 'typeset', progress: 0, total: tsTargets.length, completed: 0
      });
      let tsd = 0, tsi = 0;
      async function tsWorker() {
        while (tsi < tsTargets.length) {
          if (isStopRequested()) return;
          const i = tsi++;
          const ch = store.getState().chapters.find((c) => c.id === tsTargets[i].id) || tsTargets[i];
          await runChapterTypeset(ch, ctx);
          tsd++;
          updateOp(tsId, { completed: tsd, progress: Math.round((tsd / tsTargets.length) * 100) });
        }
      }
      await Promise.all(Array.from({ length: Math.min(CHAPTER_CONCURRENCY, tsTargets.length) }, tsWorker));
      updateOp(tsId, { status: 'done', progress: 100, finishedAt: Date.now() });
    }
  }
}