import { useState } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { getLocalServerFor, setLocalServerFor } from '@/lib/localServer';
import { Server, Check, Loader2, Wifi, XCircle, Eraser, Languages, Type } from 'lucide-react';

const STAGES = [
  { id: 'ocr', labelKey: 'settings.stageOcr', icon: Server, hintKey: 'settings.localServerHintOcr' },
  { id: 'cleaning', labelKey: 'settings.stageCleaning', icon: Eraser, hintKey: 'settings.localServerHintCleaning' },
  { id: 'translation', labelKey: 'settings.stageTranslation', icon: Languages, hintKey: 'settings.localServerHintTranslation' },
  { id: 'typesetting', labelKey: 'settings.stageTypesetting', icon: Type, hintKey: 'settings.localServerHintTypesetting' },
];

function ServerField({ stage, t }) {
  const [url, setUrl] = useState(getLocalServerFor(stage.id));
  const [savedAt, setSavedAt] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const onSave = () => {
    const v = url.trim();
    setLocalServerFor(stage.id, v);
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

  const Icon = stage.icon;
  const isLocal = !!url.trim();
  const inputCls = 'w-full bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none focus:border-[hsl(var(--c-accent))]';

  return (
    <div className="space-y-2 py-3 border-b border-[hsl(var(--c-border))] last:border-0 last:pb-0">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[hsl(var(--c-accent))] shrink-0" />
        <span className="text-sm font-medium text-[hsl(var(--c-text))]">{t(stage.labelKey)}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ml-auto ${isLocal ? 'bg-[hsl(var(--c-accent))]/15 text-[hsl(var(--c-accent))]' : 'bg-[hsl(var(--c-soft))] text-[hsl(var(--c-dim))]'}`}>
          {isLocal ? 'Local' : 'Cloud'}
        </span>
      </div>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('settings.localServerPlaceholder')} className={inputCls} dir="ltr" />
      <p className="text-[11px] text-[hsl(var(--c-dim))]">{t(stage.hintKey)}</p>
      <div className="flex gap-2">
        <button onClick={onSave} className="flex items-center gap-1.5 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-lg px-3 py-1.5 text-xs font-medium">
          <Check className="w-3.5 h-3.5" /> {t('common.save')}
        </button>
        <button onClick={onTest} disabled={testing || !url.trim()} className="flex items-center gap-1.5 bg-[hsl(var(--c-soft))] hover:bg-[hsl(var(--c-soft-2))] text-[hsl(var(--c-text))] rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-40">
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
          {testing ? t('settings.connecting') : t('settings.testConnection')}
        </button>
      </div>
      {savedAt && <p className="text-xs text-emerald-400">{t('common.saved')} ✓</p>}
      {testResult === 'ok' && <p className="flex items-center gap-1.5 text-xs text-emerald-400"><Check className="w-3.5 h-3.5" />{t('settings.connectionOk')}</p>}
      {testResult === 'fail' && <p className="flex items-center gap-1.5 text-xs text-rose-400"><XCircle className="w-3.5 h-3.5" />{t('settings.connectionFail')}</p>}
    </div>
  );
}

export default function LocalServerSection() {
  const { t } = useI18n();
  return (
    <div className="space-y-0">
      {STAGES.map((s) => <ServerField key={s.id} stage={s} t={t} />)}
    </div>
  );
}