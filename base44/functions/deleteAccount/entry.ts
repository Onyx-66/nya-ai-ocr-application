import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Require an explicit confirmation flag so this endpoint can never delete
    // an account from an accidental / empty invocation.
    let body = {};
    try { body = await req.json(); } catch {}
    if (!body || body.confirm !== true) {
      return Response.json({ error: 'Confirmation required' }, { status: 400 });
    }

    // Delete the caller's own account record via the service role (bypasses
    // the built-in user RLS so a non-admin can delete their own account).
    await base44.asServiceRole.entities.User.delete(user.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
}