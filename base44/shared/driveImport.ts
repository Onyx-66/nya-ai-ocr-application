import JSZip from 'npm:jszip@3.10.1';

export const IMAGE_RE = /\.(png|jpe?g|webp|gif|bmp)$/i;
export const ZIP_MIMES = ['application/zip', 'application/x-zip-compressed', 'application/x-zip'];

export async function uploadImage(base44, blob, name) {
  const fileObj = new File([await blob.arrayBuffer()], name, { type: blob.type || 'image/jpeg' });
  const up = await base44.asServiceRole.integrations.Core.UploadFile({ file: fileObj });
  return up && up.file_url ? { url: up.file_url, name } : null;
}

export async function listFolderImages(base44, auth, folderId) {
  const q = `'${folderId}' in parents and trashed=false and (mimeType='image/png' or mimeType='image/jpeg' or mimeType='image/jpg' or mimeType='image/webp' or mimeType='image/gif' or mimeType='image/bmp')`;
  const r = await fetch(
    'https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(q) +
      '&fields=files(id,name,mimeType)&orderBy=name&pageSize=100',
    { headers: auth }
  );
  const d = await r.json();
  if (!r.ok) throw new Error((d.error && d.error.message) || 'Drive list error');
  const out = [];
  for (const f of d.files || []) {
    try {
      const fr = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, { headers: auth });
      if (!fr.ok) continue;
      const img = await uploadImage(base44, await fr.blob(), f.name);
      if (img) out.push(img);
    } catch (_) { /* skip */ }
  }
  return out;
}

export async function extractZipImages(base44, zipBuffer) {
  const zip = await JSZip.loadAsync(zipBuffer);
  const entries = Object.values(zip.files)
    .filter((e) => !e.dir && IMAGE_RE.test(e.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const out = [];
  for (const e of entries) {
    try {
      const img = await uploadImage(base44, await e.async('blob'), e.name.split('/').pop());
      if (img) out.push(img);
    } catch (_) { /* skip */ }
  }
  return out;
}