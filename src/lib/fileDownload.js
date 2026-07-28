import { docxBlobFromText } from '@/lib/docx';

// Download text content as a local file. .docx produces a real Word document;
// .txt / .md produce plain text with the right mime.
export async function downloadTextFile(filename, content, format) {
  let blob;
  let name = filename;
  if (format === 'docx') {
    blob = await docxBlobFromText(content);
    if (!name.endsWith('.docx')) name = name.replace(/\.(txt|md)$/, '') + '.docx';
  } else {
    blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function extFor(format) {
  return format === 'md' ? 'md' : format === 'docx' ? 'docx' : 'txt';
}

export function mimeFor(format) {
  return format === 'md' ? 'text/markdown' : format === 'docx'
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'text/plain';
}