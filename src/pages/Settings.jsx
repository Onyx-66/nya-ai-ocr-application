import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Loader2, CheckCircle2, XCircle, Cloud, Palette, Type, ListChecks, UserCircle, Sliders, Layers, RefreshCw } from 'lucide-react';
import { useTheme, THEMES, FONTS } from '@/lib/ThemeContext';
import SettingsSection from '@/components/SettingsSection';
import MarkerSettings from '@/components/batch/MarkerSettings';
import DefaultSettings from '@/components/batch/DefaultSettings';
import DriveFolderButton from '@/components/batch/DriveFolderButton';
import ExportTemplateManager from '@/components/batch/ExportTemplateManager';
import AccountSection from '@/components/batch/AccountSection';
import AdminPanel from '@/components/batch/AdminPanel';

export default function Settings() {
  const { user } = useAuth();
  const [status, setStatus] = useState('checking');
  const [email, setEmail] = useState(null);
  const [folderId, setFolderId] = useState(() => localStorage.getItem('driveFolder') || null);
  const { theme, setTheme, fontFamily, setFontFamily, fontScale, setFontScale } = useTheme();

  const check = async () => {
    setStatus('checking');
    try {
      const res = await base44.functions.invoke('driveListFolders', {});
      if (res.data && res.data.folders) { setStatus('connected'); setEmail(res.data.email || null); }
      else setStatus('disconnected');
    } catch { setStatus('disconnected'); }
  };
  useEffect(() => { check(); }, []);

  const saveFolder = (id) => {
    setFolderId(id);
    if (id) localStorage.setItem('driveFolder', id); else localStorage.removeItem('driveFolder');
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold mb-1 text-[hsl(var(--c-text))]">Settings</h1>
      <p className="text-[hsl(var(--c-dim))] text-sm mb-6">Tap any section to expand or collapse it.</p>

      <div className="space-y-4">
        <SettingsSection icon={UserCircle} title="Account" subtitle="Profile, credits and top-up" defaultOpen>
          <AccountSection />
        </SettingsSection>

        <SettingsSection icon={Palette} title="Appearance" subtitle="Theme, fonts and text size">
          <label className="block text-xs text-[hsl(var(--c-dim))] mb-2">Theme</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
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
        </SettingsSection>

        <SettingsSection icon={Layers} title="Export templates" subtitle="One-click format & styling layouts">
          <ExportTemplateManager />
        </SettingsSection>

        <SettingsSection icon={Sliders} title="Workspace defaults" subtitle="Applied to new sessions">
          <DefaultSettings />
        </SettingsSection>

        <SettingsSection icon={ListChecks} title="OCR signs" subtitle="Markers for each text type">
          <MarkerSettings />
        </SettingsSection>

        <SettingsSection icon={Cloud} title="Google Drive" subtitle="Connection and upload folder">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--c-soft))] flex items-center justify-center shrink-0">
              {status === 'checking' ? <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--c-dim))]" />
                : status === 'connected' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                : <XCircle className="w-5 h-5 text-rose-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[hsl(var(--c-text))]">{status === 'connected' ? 'Connected' : status === 'checking' ? 'Checking…' : 'Not connected'}</p>
              <p className="text-xs text-[hsl(var(--c-dim))] truncate">{status === 'connected' && email ? email : 'Used to read source folders and upload output files.'}</p>
            </div>
            <button onClick={check} title="Re-check connection" className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-text-soft))] hover:text-[hsl(var(--c-text))] bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] rounded-lg px-3 py-1.5 shrink-0">
              <RefreshCw className="w-3.5 h-3.5" /> Recheck
            </button>
          </div>
          {status === 'connected' && (
            <div className="border-t border-[hsl(var(--c-border))] pt-4">
              <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Default upload folder</label>
              <DriveFolderButton value={folderId} onChange={saveFolder} />
            </div>
          )}
          <p className="text-[11px] text-[hsl(var(--c-dim))] mt-3">To link a different Google account, ask in the builder chat — “reconnect Google Drive” — and approve the prompt (one click).</p>
        </SettingsSection>

        {user?.role === 'admin' && (
          <SettingsSection icon={ListChecks} title="Admin" subtitle="Manage users and credits" defaultOpen>
            <AdminPanel />
          </SettingsSection>
        )}
      </div>
    </div>
  );
}