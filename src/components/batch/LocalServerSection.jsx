import { useState } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { getLocalServer, setLocalServer } from '@/lib/localServer';
import { Server, Check, Loader2, Wifi, XCircle } from 'lucide-react';

export default function LocalServerSection() {
  const { t } = useI18n();
  const [url, setUrl] = useState(getLocalServer());
  const [savedAt, setSavedAt] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // 'ok' | 'fail' | null

  const onSave = () => {
    const v = url.trim();
    setLocalServer(v);
    setUrl(v);
    setSavedAt(Date.now());
    setTestResult(null);
    setTimeout(() => setSavedAt(null), 1400);
  };

  const onTest = async () => {
    const base = (url || '').trim().replace(/\/$/, '');
    if (!base) { setTestResult('fail'); return; }
    setTesting(true); setTestResult(null);
    try {
      const r = await fetch(`${base}/health`, { method: 'GET' });
      setTestResult(r.ok ? 'ok' : 'fail');
    } catch {
      setTestResult('fail');
    }
    setTesting(false);
  };

  const inputCls = 'w-full bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none focus:border-[hsl(var(--c-accent))]';

  return (
    <div className="space-y-3">
      <p className="text-xs text-[hsl(var(--c-dim))]">{t('settings.localServerSubtitle')}</p>
      <div className="flex items-center gap-2">
        <Server className="w-4 h-4 text-[hsl(var(--c-dim))] shrink-0" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('settings.localServerPlaceholder')}
          className={inputCls}
          dir="ltr"
        />
      </div>
      <p className="text-[11px] text-[hsl(var(--c-dim))]">{t('settings.localServerHint')}</p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onSave}
          className="flex items-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-lg px-3 py-2 text-sm font-medium"
        >
          <Check className="w-4 h-4" /> {t('common.save')}
        </button>
        <button
          onClick={onTest}
          disabled={testing || !url.trim()}
          className="flex items-center gap-2 bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] text-[hsl(var(--c-text))] rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-40"
        >
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
          {testing ? t('settings.connecting') : t('settings.testConnection')}
        </button>
      </div>

      {savedAt && <p className="text-xs text-emerald-400">{t('common.saved')} ✓</p>}
      {testResult === 'ok' && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-400"><Check className="w-3.5 h-3.5" />{t('settings.connectionOk')}</p>
      )}
      {testResult === 'fail' && (
        <p className="flex items-center gap-1.5 text-xs text-rose-400"><XCircle className="w-3.5 h-3.5" />{t('settings.connectionFail')}</p>
      )}
    </div>
  );
}