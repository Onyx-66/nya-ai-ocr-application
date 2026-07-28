import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, ShieldCheck } from 'lucide-react';
import MobileSelect from '@/components/ui/MobileSelect';

const ROLES = [
  { id: 'admin', label: 'Administrator' },
  { id: 'premium', label: 'Premium user' },
  { id: 'user', label: 'User' }
];

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [amounts, setAmounts] = useState({});

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const list = await base44.entities.User.list();
      setUsers(list);
    } catch (e) {
      setErr(e.message || 'Cannot load users (admin only)');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setRole = async (id, role) => {
    try { await base44.entities.User.update(id, { role }); load(); } catch (e) { setErr(e.message); }
  };

  const addCredits = async (id) => {
    const amt = Number(amounts[id] || 0);
    if (!amt || Number.isNaN(amt)) return;
    const u = users.find((x) => x.id === id);
    const cur = u?.credits ?? 0;
    try {
      await base44.entities.User.update(id, { credits: Math.max(0, cur + amt) });
      setAmounts((a) => ({ ...a, [id]: '' }));
      load();
    } catch (e) { setErr(e.message); }
  };

  return (
    <section className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--c-soft))] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-[hsl(var(--c-accent))]" />
        </div>
        <div>
          <h2 className="font-medium text-[hsl(var(--c-text))]">User management</h2>
          <p className="text-xs text-[hsl(var(--c-dim))]">Set roles and grant credits (admin only).</p>
        </div>
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-[hsl(var(--c-dim))]"><Loader2 className="w-4 h-4 animate-spin" /> Loading users…</div>}
      {err && <p className="text-xs text-rose-400">{err}</p>}

      {!loading && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-[hsl(var(--c-border))] bg-[hsl(var(--c-input))] p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[hsl(var(--c-text))] truncate">{u.email}</p>
                <p className="text-xs text-[hsl(var(--c-dim))]">Credits: <span className="text-[hsl(var(--c-text-soft))]">{u.credits ?? 0}</span></p>
              </div>
              <MobileSelect
                value={u.role || 'user'}
                onChange={(v) => setRole(u.id, v)}
                options={ROLES.map((r) => ({ value: r.id, label: r.label }))}
                placeholder="Role"
                className="bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] rounded-md px-2 py-1.5 text-xs text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))]"
              />
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amounts[u.id] || ''}
                  onChange={(e) => setAmounts((a) => ({ ...a, [u.id]: e.target.value }))}
                  placeholder="+/- credits"
                  className="w-24 bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] rounded-md px-2 py-1.5 text-xs text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))]"
                />
                <button onClick={() => addCredits(u.id)} className="flex items-center gap-1 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-md px-2 py-1.5 text-xs font-medium">
                  <Plus className="w-3.5 h-3.5" /> Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}