/**
 * Shared output formatting for the MangaOCR Agent.
 * Each text item is classified by `type` and wrapped/prefixed with a marker.
 * Markers are user-customizable; defaults are provided below.
 */
export const DEFAULT_MARKERS = {
  speech: { prefix: '"', suffix: '"' },
  continue: { prefix: '//', suffix: '' },
  box: { prefix: '[', suffix: ']' },
  thought: { prefix: '(', suffix: ')' },
  screen: { prefix: '**', suffix: '**' },
  sfx: { prefix: 'SFX: ', suffix: '' },
  shout: { prefix: '::', suffix: '' },
  system: { prefix: '<>', suffix: '' },
  smalltext: { prefix: 'ST: ', suffix: '' },
  outertext: { prefix: 'OT: ', suffix: '' },
  tlnote: { prefix: 'TL/N: ', suffix: '' }
};

export function formatPages(pages, format, title, markers, emptyLine) {
  const m = markers && typeof markers === 'object' && Object.keys(markers).length ? markers : DEFAULT_MARKERS;
  const fmt = format === 'md' ? 'md' : 'txt';
  let out = '';
  if (title && title.trim()) {
    out += fmt === 'md' ? `# ${title.trim()}\n\n` : `${title.trim()}\n\n`;
  }
  const multi = pages.length > 1;
  pages.forEach((page, i) => {
    if (multi) out += `--- Page ${i + 1} ---\n`;
    (page.items || []).forEach((item) => {
      const text = (item.text || '').trim();
      if (!text) return;
      const mk = m[item.type] || { prefix: '', suffix: '' };
      out += `${mk.prefix || ''}${text}${mk.suffix || ''}\n`;
      if (emptyLine) out += '\n';
    });
    if (multi && i < pages.length - 1) out += '\n';
  });
  return out.trim();
}