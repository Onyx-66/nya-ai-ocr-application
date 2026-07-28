import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, CheckCircle2, XCircle, Cloud, Folder, Palette, Type, ListChecks, UserCircle, Sliders, Plus } from 'lucide-react';
import DriveFolderPicker from '@/components/DriveFolderPicker';
import { useTheme, THEMES, FONTS } from '@/lib/ThemeContext';
import MarkerSettings from '@/components/batch/MarkerSettings';
import DefaultSettings from '@/components/batch/DefaultSettings';
import AdminPanel from '@/components/batch/AdminPanel';

const ROLE_LABEL = { admin: 'Administrator', premium: 'Premium user', user: 'User' };

export default function Settings() {
  const { user, checkUserAuth } = useAuth();
  const [status, setStatus] = useState('checking');
  const [email, setEmail] = useState(null);
  const [folderId, setFolderId] = useState(() => localStorage.getItem('driveFolder') || null);
  const [saved, setSaved] = useState(false);
  const [topUp, setTopUp] = useState('');
  const [topUpMsg, setTopUpMsg] = useState(null);

  const { theme, setTheme, fontFamily, setFontFamily, fontScale, setFontScale } = useTheme();

  const addCredits = async () => {
    const amt = Number(topUp) || 0;
    if (!amt) return;
    try {
      await base44.auth.updateMe({ credits: (user?.credits ?? 0) + amt });
      setTopUp('');
      setTopUpMsg(`Added ${amt} credits`);
      setTimeout(() => setTopUpMsg(null), 1800);
      await checkUserAuth();
    } catch (e) { setTopUpMsg(e.message || 'Could not add credits'); }
  };

  const check = async () => {
    setStatus('checking');
    try {
      const res = await base44.functions.invoke('driveListFolders', {});
      if (res.data && res.data.folders) { setStatus('connected'); setEmail(res.data.email || null); }
      else setStatus('disconnected');
    } catch (e) { setStatus('disconnected'); }
  };

  useEffect(() => { check(); }, []);

  const saveFolder = (id) => {
    setFolderId(id);
    if (id) localStorage.setItem('driveFolder', id); else localStorage.removeItem('driveFolder');
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold mb-1 text-[hsl(var(--c-text))]">Settings</h1>
      <p className="text-[hsl(var(--c-dim))] text-sm mb-8">Appearance, OCR signs, account, defaults, Google Drive.</p>

      {/* Account */}
      <section className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--c-soft))] flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-[hsl(var(--c-accent))]" />
          </div>
          <div>
            <h2 className="font-medium text-[hsl(var(--c-text))]">Account</h2>
            <p className="text-xs text-[hsl(var(--c-dim))]">Your role and remaining credits.</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-[hsl(var(--c-text))]">{user?.email || '—'}</p>
            <p className="text-xs text-[hsl(var(--c-dim))]">{ROLE_LABEL[user?.role] || user?.role || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--c-border))] bg-[hsl(var(--c-input))] px-4 py-3 mb-3">
          <span className="text-2xl">⚡</span>
          <span className="text-2xl font-semibold text-[hsl(var(--c-text))]">{user?.credits ?? '…'}</span>
          <span className="text-sm text-[hsl(var(--c-dim))]">credits · 1 per OCR, 1 per translation · +4 daily login gift</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number" value={topUp} onChange={(e) => setTopUp(e.target.value)} placeholder="Top up credits"
            className="w-40 bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))]"
          />
          <button onClick={addCredits} className="flex items-center gap-1.5 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-lg px-3 py-2 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add credits
          </button>
          {topUpMsg && <span className="text-xs text-emerald-400">{topUpMsg}</span>}
        </div>
      </section>

      {/* Appearance */}
      <section className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--c-soft))] flex items-center justify-center">
            <Palette className="w-5 h-5 text-[hsl(var(--c-accent))]" />
          </div>
          <div>
            <h2 className="font-medium text-[hsl(var(--c-text))]">Appearance</h2>
            <p className="text-xs text-[hsl(var(--c-dim))]">Theme, fonts, and text size.</p>
          </div>
        </div>
        <label className="block text-xs text-[hsl(var(--c-dim))] mb-2">Theme</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors ${theme === t.id ? 'border-[hsl(var(--c-accent))] bg-[hsl(var(--c-soft))]' : 'border-[hsl(var(--c-border))] hover:bg-[hsl(var(--c-soft))]'}`}
            >
              <span className="w-6 h-6 rounded-full" style={{ background: t.swatch }} />
              <span className="text-[11px] text-[hsl(var(--c-text-soft))]">{t.name}</span>
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-dim))] mb-1.5"><Type className="w-3.5 h-3.5" /> Font family</label>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))]">
              {FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[hsl(var(--c-dim))] mb-1.5 block">Font size · {Math.round(fontScale * 100)}%</label>
            <input type="range" min={0.85} max={1.3} step={0.05} value={fontScale} onChange={(e) => setFontScale(Number(e.target.value))} className="w-full accent-[hsl(var(--c-accent))]" />
          </div>
        </div>
      </section>

      {/* Workspace defaults */}
      <section className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--c-soft))] flex items-center justify-center">
            <Sliders className="w-5 h-5 text-[hsl(var(--c-accent))]" />
          </div>
          <div>
            <h2 className="font-medium text-[hsl(var(--c-text))]">Workspace defaults</h2>
            <p className="text-xs text-[hsl(var(--c-dim))]">Default settings applied to new sessions.</p>
          </div>
        </div>
        <DefaultSettings />
      </section>

      {/* OCR Markers */}
      <section className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--c-soft))] flex items-center justify-center">
            <ListChecks className="w-5 h-5 text-[hsl(var(--c-accent))]" />
          </div>
          <div>
            <h2 className="font-medium text-[hsl(var(--c-text))]">OCR signs</h2>
            <p className="text-xs text-[hsl(var(--c-dim))]">Customize the markers applied to each text type.</p>
          </div>
        </div>
        <MarkerSettings />
      </section>

      {/* Google Drive */}
      <section className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[hsl(var(--c-soft))] flex items-center justify-center">
            <Cloud className="w-5 h-5 text-[hsl(var(--c-accent))]" />
          </div>
          <div>
            <h2 className="font-medium text-[hsl(var(--c-text))]">Google Drive</h2>
            <p className="text-xs text-[hsl(var(--c-dim))]">Used to read source folders and upload output files.</p>
          </div>
          <div className="ml-auto">
            {status === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--c-dim))]" />}
            {status === 'connected' && <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium"><CheckCircle2 className="w-5 h-5" /> Connected</span>}
            {status === 'disconnected' && <span className="flex items-center gap-1.5 text-rose-400 text-sm font-medium"><XCircle className="w-5 h-5" /> Not connected</span>}
          </div>
        </div>
        {status === 'connected' && email && <p className="text-sm text-[hsl(var(--c-dim))] mb-3">Connected account: <span className="text-[hsl(var(--c-text))]">{email}</span></p>}
        {status === 'disconnected' && (
          <div className="text-sm text-[hsl(var(--c-dim))] space-y-2">
            <p>Google Drive isn't connected yet. Connect your account to enable Drive features.</p>
            <button onClick={check} className="px-4 py-2 rounded-lg bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white text-sm font-medium">Recheck connection</button>
          </div>
        )}
      </section>

      {status === 'connected' && (
        <section className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--c-soft))] flex items-center justify-center">
              <Folder className="w-5 h-5 text-[hsl(var(--c-accent))]" />
            </div>
            <div>
              <h2 className="font-medium text-[hsl(var(--c-text))]">Default upload folder</h2>
              <p className="text-xs text-[hsl(var(--c-dim))]">Output files are uploaded here by default. Paste a link or browse.</p>
            </div>
          </div>
          <DriveFolderPicker value={folderId} onChange={saveFolder} />
          {saved && <p className="text-xs text-emerald-400 mt-2">Saved as default.</p>}
        </section>
      )}

      {user?.role === 'admin' && <AdminPanel />}
    </div>
  );
}