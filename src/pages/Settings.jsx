import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2, XCircle, Cloud, Folder } from 'lucide-react';
import DriveFolderPicker from '@/components/DriveFolderPicker';

export default function Settings() {
  const [status, setStatus] = useState('checking'); // checking | connected | disconnected
  const [email, setEmail] = useState(null);
  const [folderId, setFolderId] = useState(() => localStorage.getItem('driveFolder') || null);
  const [saved, setSaved] = useState(false);

  const check = async () => {
    setStatus('checking');
    try {
      const res = await base44.functions.invoke('driveListFolders', {});
      if (res.data && res.data.folders) {
        setStatus('connected');
        setEmail(res.data.email || null);
      } else {
        setStatus('disconnected');
      }
    } catch (e) {
      setStatus('disconnected');
    }
  };

  useEffect(() => { check(); }, []);

  const saveFolder = (id) => {
    setFolderId(id);
    if (id) localStorage.setItem('driveFolder', id);
    else localStorage.removeItem('driveFolder');
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-heading font-semibold mb-1">Settings</h1>
      <p className="text-slate-400 text-sm mb-8">Manage your Google Drive connection and default upload folder.</p>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <Cloud className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-medium">Google Drive</h2>
            <p className="text-xs text-slate-500">Used to read source folders and upload output files.</p>
          </div>
          <div className="ml-auto">
            {status === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-slate-500" />}
            {status === 'connected' && (
              <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="w-5 h-5" /> Connected
              </span>
            )}
            {status === 'disconnected' && (
              <span className="flex items-center gap-1.5 text-rose-400 text-sm font-medium">
                <XCircle className="w-5 h-5" /> Not connected
              </span>
            )}
          </div>
        </div>
        {status === 'connected' && email && (
          <p className="text-sm text-slate-400">Connected account: <span className="text-slate-200">{email}</span></p>
        )}
        {status === 'disconnected' && (
          <div className="text-sm text-slate-400 space-y-2">
            <p>Google Drive isn't connected yet. Connect your account to enable Drive features.</p>
            <button
              onClick={check}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
            >
              Recheck connection
            </button>
          </div>
        )}
      </section>

      {status === 'connected' && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
              <Folder className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-medium">Default upload folder</h2>
              <p className="text-xs text-slate-500">Output files are uploaded here by default from the workspace.</p>
            </div>
          </div>
          <DriveFolderPicker value={folderId} onChange={saveFolder} />
          {saved && <p className="text-xs text-emerald-400 mt-2">Saved as default.</p>}
        </section>
      )}
    </div>
  );
}