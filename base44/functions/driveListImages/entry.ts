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
    if (!folderId) return Response.json({ error: 'A Google Drive folder or file ID is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(DRIVE_CONNECTOR_ID);
    const auth = { Authorization: `Bearer ${accessToken}` };

    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`, { headers: auth });
    const meta = await metaRes.json();
    if (!metaRes.ok) return Response.json({ error: (meta.error && meta.error.message) || 'Drive item not found / not shared with the connected account' }, { status: 502 });

    const mime = meta.mimeType || '';
    const isFolder = mime === 'application/vnd.google-apps.folder';
    const isZip = ZIP_MIMES.includes(mime) || /\.zip$/i.test(meta.name || '');
    const isImage = mime.startsWith('image/');

    if (isFolder) {
      const images = await listFolderImages(base44, auth, folderId);
      return Response.json({ images, count: images.length, source: 'folder' });
    }

    if (isZip) {
      const dlRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?alt=media`, { headers: auth });
      if (!dlRes.ok) return Response.json({ error: 'Could not download the ZIP file' }, { status: 502 });
      const images = await extractZipImages(base44, await dlRes.arrayBuffer());
      return Response.json({ images, count: images.length, source: 'zip' });
    }

    if (isImage) {
      const dlRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?alt=media`, { headers: auth });
      if (!dlRes.ok) return Response.json({ error: 'Could not download the image' }, { status: 502 });
      const img = await uploadImage(base44, await dlRes.blob(), meta.name || 'image');
      return Response.json({ images: img ? [img] : [], count: img ? 1 : 0, source: 'image' });
    }

    return Response.json({ error: `Unsupported item type: ${mime}` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}