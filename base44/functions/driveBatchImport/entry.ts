import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { ZIP_MIMES, uploadImage, listFolderImages, extractZipImages } from '../../shared/driveImport.ts';
import { DRIVE_CONNECTOR_ID } from '../../shared/driveConnector.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { folderId } = body || {};
    if (!folderId) return Response.json({ error: 'A Google Drive folder ID is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(DRIVE_CONNECTOR_ID);
    const auth = { Authorization: `Bearer ${accessToken}` };

    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`, { headers: auth });
    const meta = await metaRes.json();
    if (!metaRes.ok) return Response.json({ error: (meta.error && meta.error.message) || 'Drive folder not found' }, { status: 502 });

    const q = `'${folderId}' in parents and trashed=false`;
    const listRes = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(q) +
        '&fields=files(id,name,mimeType)&orderBy=name&pageSize=200',
      { headers: auth }
    );
    const listData = await listRes.json();
    if (!listRes.ok) return Response.json({ error: (listData.error && listData.error.message) || 'Drive list error' }, { status: 502 });

    const children = listData.files || [];
    const chapters = [];
    const looseImages = []; // images sitting directly in this folder → ONE chapter
    for (const child of children) {
      const cm = child.mimeType || '';
      try {
        if (cm === 'application/vnd.google-apps.folder') {
          const images = await listFolderImages(base44, auth, child.id);
          if (images.length) chapters.push({ title: child.name, images });
        } else if (ZIP_MIMES.includes(cm) || /\.zip$/i.test(child.name || '')) {
          const dl = await fetch(`https://www.googleapis.com/drive/v3/files/${child.id}?alt=media`, { headers: auth });
          if (!dl.ok) continue;
          const images = await extractZipImages(base44, await dl.arrayBuffer());
          if (images.length) chapters.push({ title: (child.name || 'chapter').replace(/\.zip$/i, ''), images });
        } else if (cm.startsWith('image/')) {
          const dl = await fetch(`https://www.googleapis.com/drive/v3/files/${child.id}?alt=media`, { headers: auth });
          if (!dl.ok) continue;
          const img = await uploadImage(base44, await dl.blob(), child.name);
          if (img) looseImages.push(img);
        }
      } catch (_) { /* skip child */ }
    }

    // A Drive folder that only contains loose images is a SINGLE chapter
    // (all images = pages of that chapter), not one chapter per image.
    if (looseImages.length) {
      looseImages.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }));
      chapters.push({ title: meta.name || 'Chapter', images: looseImages });
    }

    return Response.json({ chapters, count: chapters.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}