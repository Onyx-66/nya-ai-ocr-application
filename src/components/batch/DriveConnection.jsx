import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, XCircle, Link2, Unlink } from 'lucide-react';
import DriveFolderButton from '@/components/batch/DriveFolderButton';
import { DRIVE_CONNECTOR_ID } from '@/lib/driveConnector';

export default function DriveConnection() {
  const [status, setStatus] = useState('checking'); // checking | connected | disconnected
  const [email, setEmail] = useState(null);
  const [folderId, setFolderId] = useState(() => localStorage.getItem('driveFolder') || null);
  const [busy, setBusy] = useState(false);

  const check = async () => {
    setStatus('checking');
    try {
      const res = await base44.functions.invoke('driveListFolders', {});
      if (res.data && res.data.folders) { setStatus('connected'); setEmail(res.data.email || null); }
      else setStatus('disconnected');
    } catch { setStatus('disconnected'); }
  };
  useEffect(() => { check(); }, []);

  const connect = async () => {
    setBusy(true);
    try {
      const url = await base44.connectors.connectAppUser(DRIVE_CONNECTOR_ID);
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) { clearInterval(timer); check(); setBusy(false); }
      }, 500);
    } catch { setBusy(false); }
  };
  const disconnect = async () => {
    setBusy(true);
    try { await base44.connectors.disconnectAppUser(DRIVE_CONNECTOR_ID); } catch {}
    setStatus('disconnected'); setEmail(null); setBusy(false);
  };

  const saveFolder = (id) => {
    setFolderId(id);
    if (id) localStorage.setItem('driveFolder', id); else localStorage.removeItem('driveFolder');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--c-soft))] flex items-center justify-center shrink-0">
          {status === 'checking' ? <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--c-dim))]" />
            : status === 'connected' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            : <XCircle className="w-5 h-5 text-rose-400" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[hsl(var(--c-text))]">{status === 'connected' ? 'Connected' : status === 'checking' ? 'Checking…' : 'Not connected'}</p>
          <p className="text-xs text-[hsl(var(--c-dim))] truncate">{status === 'connected' && email ? email : 'Connect your own Google Drive to import chapters and save outputs.'}</p>
        </div>
        {status === 'connected' ? (
          <button onClick={disconnect} disabled={busy} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-text-soft))] hover:text-[hsl(var(--c-text))] bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] rounded-lg px-3 py-1.5 shrink-0 disabled:opacity-50">
            <Unlink className="w-3.5 h-3.5" /> Disconnect
          </button>
        ) : status !== 'checking' ? (
          <button onClick={connect} disabled={busy} className="flex items-center gap-1.5 text-xs text-white bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] rounded-lg px-3 py-1.5 shrink-0 disabled:opacity-50">
            <Link2 className="w-3.5 h-3.5" /> Connect
          </button>
        ) : null}
      </div>
      {status === 'connected' && (
        <div className="border-t border-[hsl(var(--c-border))] pt-4">
          <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Default upload folder</label>
          <DriveFolderButton value={folderId} onChange={saveFolder} />
        </div>
      )}
      {status === 'disconnected' && (
        <p className="text-[11px] text-[hsl(var(--c-dim))]">Each user connects their own Google Drive — your chapters and outputs stay in your account, not a shared one.</p>
      )}
    </div>
  );
}