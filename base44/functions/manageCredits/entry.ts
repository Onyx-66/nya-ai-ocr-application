import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Authoritative, server-side credit management. The client must NEVER write
// the `credits` (or `last_daily_gift`) field directly via updateMe — all
// mutations go through this function, which uses the service role and
// validates the caller's identity / role on the server.
const todayStr = () => new Date().toLocaleDateString('en-CA');

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    try { body = await req.json(); } catch {}
    const action = body && body.action;

    if (action === 'spend') {
      // Deduct one credit, atomically, only if the caller has at least one.
      // $inc guards against races; the {credits: {$gte: 1}} filter prevents
      // going negative. The client cannot set an arbitrary value here.
      await base44.asServiceRole.entities.User.updateMany(
        { id: user.id, credits: { $gte: 1 } },
        { $inc: { credits: -1 } }
      );
      const refreshed = await base44.asServiceRole.entities.User.get(user.id);
      return Response.json({ credits: Number(refreshed.credits) || 0 });
    }

    if (action === 'daily_gift') {
      const today = todayStr();
      // First-ever sign-in: grant the welcome bonus (15) + the daily gift (4).
      if (user.credits == null) {
        const next = 19;
        await base44.asServiceRole.entities.User.update(user.id, { credits: next, last_daily_gift: today });
        return Response.json({ credits: next, granted: true });
      }
      if (user.last_daily_gift === today) {
        return Response.json({ credits: Number(user.credits) || 0, granted: false });
      }
      // Conditional update guards against concurrent duplicate gifts on the
      // same day; $ne ensures it only applies once.
      await base44.asServiceRole.entities.User.updateMany(
        { id: user.id, last_daily_gift: { $ne: today } },
        { $inc: { credits: 4 }, $set: { last_daily_gift: today } }
      );
      const refreshed = await base44.asServiceRole.entities.User.get(user.id);
      return Response.json({ credits: Number(refreshed.credits) || 0, granted: refreshed.last_daily_gift === today });
    }

    if (action === 'adjust') {
      // Admin-only: adjust any user's credits by a signed amount.
      if (user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount === 0) return Response.json({ error: 'Invalid amount' }, { status: 400 });
      const targetId = body.userId || user.id;
      const target = await base44.asServiceRole.entities.User.get(targetId);
      const next = Math.max(0, (Number(target.credits) || 0) + amount);
      await base44.asServiceRole.entities.User.update(targetId, { credits: next });
      return Response.json({ credits: next });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Failed' }, { status: 500 });
  }
}