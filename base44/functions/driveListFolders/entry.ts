import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { DRIVE_CONNECTOR_ID } from '../../shared/driveConnector.ts';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(DRIVE_CONNECTOR_ID);
    const auth = { Authorization: `Bearer ${accessToken}` };

    // Folders
    const listRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=" +
        encodeURIComponent("mimeType='application/vnd.google-apps.folder' and trashed=false") +
        "&fields=files(id,name)&pageSize=200&orderBy=name",
      { headers: auth }
    );
    const listData = await listRes.json();
    if (!listRes.ok) return Response.json({ error: listData.error?.message || 'Drive API error' }, { status: 502 });

    // Connected account email
    let email = null;
    try {
      const aboutRes = await fetch("https://www.googleapis.com/drive/v3/about?fields=user(emailAddress,displayName)", { headers: auth });
      if (aboutRes.ok) {
        const about = await aboutRes.json();
        email = about.user?.emailAddress || null;
      }
    } catch (_) { /* non-critical */ }

    return Response.json({ folders: listData.files || [], email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}