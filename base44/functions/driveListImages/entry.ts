import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import JSZip from 'npm:jszip@3.10.1';

const IMAGE_RE = /\.(png|jpe?g|webp|gif|bmp)$/i;
const ZIP_MIMES = ['application/zip', 'application/x-zip-compressed', 'application/x-zip'];

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { folderId } = body || {};
    if (!folderId) return Response.json({ error: 'A Google Drive folder or file ID is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const auth = { Authorization: `Bearer ${accessToken}` };

    // Resolve what the ID refers to (folder, zip, or image).
    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`, { headers: auth });
    const meta = await metaRes.json();
    if (!metaRes.ok) return Response.json({ error: meta.error?.message || 'Drive item not found / not shared with the connected account' }, { status: 502 });

    const mime = meta.mimeType || '';
    const isFolder = mime === 'application/vnd.google-apps.folder';
    const isZip = ZIP_MIMES.includes(mime) || /\.zip$/i.test(meta.name || '');
    const isImage = mime.startsWith('image/');

    const uploadBlob = async (blob, name) => {
      const fileObj = new File([await blob.arrayBuffer()], name, { type: blob.type || 'image/jpeg' });
      const up = await base44.asServiceRole.integrations.Core.UploadFile({ file: fileObj });
      return up && up.file_url ? { url: up.file_url, name } : null;
    };

    // Case 1: folder -> list images inside
    if (isFolder) {
      const q = `'${folderId}' in parents and trashed=false and (mimeType='image/png' or mimeType='image/jpeg' or mimeType='image/jpg' or mimeType='image/webp' or mimeType='image/gif' or mimeType='image/bmp')`;
      const listRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=" + encodeURIComponent(q) +
          "&fields=files(id,name,mimeType)&orderBy=name&pageSize=100",
        { headers: auth }
      );
      const listData = await listRes.json();
      if (!listRes.ok) return Response.json({ error: listData.error?.message || 'Drive list error' }, { status: 502 });
      const files = listData.files || [];
      const images = [];
      for (const f of files) {
        try {
          const imgRes = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, { headers: auth });
          if (!imgRes.ok) continue;
          const blob = await imgRes.blob();
          const img = await uploadBlob(blob, f.name);
          if (img) images.push(img);
        } catch (_) { /* skip */ }
      }
      return Response.json({ images, count: images.length, source: 'folder' });
    }

    // Case 2: zip archive -> download + extract images
    if (isZip) {
      const dlRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?alt=media`, { headers: auth });
      if (!dlRes.ok) return Response.json({ error: 'Could not download the ZIP file' }, { status: 502 });
      const zipBuf = await dlRes.arrayBuffer();
      const zip = await JSZip.loadAsync(zipBuf);
      const entries = Object.values(zip.files)
        .filter((e) => !e.dir && IMAGE_RE.test(e.name))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      const images = [];
      for (const entry of entries) {
        try {
          const blob = await entry.async('blob');
          const img = await uploadBlob(blob, entry.name.split('/').pop());
          if (img) images.push(img);
        } catch (_) { /* skip */ }
      }
      return Response.json({ images, count: images.length, source: 'zip' });
    }

    // Case 3: single image -> download + return
    if (isImage) {
      const dlRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?alt=media`, { headers: auth });
      if (!dlRes.ok) return Response.json({ error: 'Could not download the image' }, { status: 502 });
      const blob = await dlRes.blob();
      const img = await uploadBlob(blob, meta.name || 'image');
      return Response.json({ images: img ? [img] : [], count: img ? 1 : 0, source: 'image' });
    }

    return Response.json({ error: `Unsupported item type: ${mime}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}