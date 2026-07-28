import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { folderId } = body || {};
    if (!folderId) return Response.json({ error: 'folderId is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const auth = { Authorization: `Bearer ${accessToken}` };

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
        const fileBlob = new Blob([await blob.arrayBuffer()], { type: f.mimeType || 'image/png' });
        const up = await base44.asServiceRole.integrations.Core.UploadFile({ file: fileBlob });
        if (up && up.file_url) images.push({ url: up.file_url, name: f.name });
      } catch (_) { /* skip unreadable file */ }
    }
    return Response.json({ images, count: images.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}