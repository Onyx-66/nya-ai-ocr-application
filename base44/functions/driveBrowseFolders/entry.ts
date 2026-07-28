import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_CONNECTOR_ID } from '../../shared/driveConnector.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { parentId } = body || {};
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(DRIVE_CONNECTOR_ID);
    const auth = { Authorization: `Bearer ${accessToken}` };

    const parentQ = parentId ? `'${parentId}' in parents` : `'root' in parents`;
    const q = `mimeType='application/vnd.google-apps.folder' and trashed=false and ${parentQ}`;
    const url = 'https://www.googleapis.com/drive/v3/files?q=' + encodeURIComponent(q) +
      '&fields=files(id,name)&pageSize=200&orderBy=name';
    const r = await fetch(url, { headers: auth });
    const d = await r.json();
    if (!r.ok) return Response.json({ error: d.error?.message || 'Drive API error' }, { status: 502 });

    return Response.json({ folders: d.files || [], parentId: parentId || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}