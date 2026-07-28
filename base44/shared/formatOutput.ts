/**
 * Shared output formatting for the MangaOCR Agent.
 * Rules:
 *  - One speech bubble = one line.
 *  - Narration / caption text OUTSIDE a bubble is prefixed with "## ".
 *  - Sound effects are prefixed with "SFX: ".
 *  - Multi-page jobs are separated by "--- Page N ---".
 */
export function formatPages(pages, format, title) {
  const fmt = format === "md" ? "md" : "txt";
  let out = "";
  if (title && title.trim()) {
    out += fmt === "md" ? `# ${title.trim()}\n\n` : `${title.trim()}\n\n`;
  }
  const multi = pages.length > 1;
  pages.forEach((page, i) => {
    if (multi) {
      out += `--- Page ${i + 1} ---\n`;
    }
    (page.items || []).forEach((item) => {
      const text = (item.text || "").trim();
      if (!text) return;
      let line = text;
      if (item.type === "narration") line = "## " + line;
      else if (item.type === "sfx") line = "SFX: " + line;
      out += line + "\n";
    });
    if (multi && i < pages.length - 1) out += "\n";
  });
  return out.trim();
}