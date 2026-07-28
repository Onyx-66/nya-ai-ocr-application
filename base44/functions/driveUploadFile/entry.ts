import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { filename, content, mimeType, folderId } = body || {};
    if (!filename || content == null) {
      return Response.json({ error: 'filename and content are required' }, { status: 400 });
    }
    const mime = mimeType || 'text/plain';

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const boundary = 'b44boundary' + Math.random().toString(36).slice(2);
    const metadata = { name: filename };
    if (folderId) metadata.parents = [folderId];

    const bodyStr =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${mime}\r\n\r\n` +
      `${content}\r\n` +
      `--${boundary}--`;

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: bodyStr
      }
    );
    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.error?.message || 'Upload failed' }, { status: 502 });
    return Response.json({ fileId: data.id, webViewLink: data.webViewLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}