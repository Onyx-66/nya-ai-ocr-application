import { useState } from 'react';
import { useI18n } from '@/lib/I18nContext';
import { getLocalServer, setLocalServer } from '@/lib/localServer';
import { Server, Check } from 'lucide-react';

export default function LocalServerSection() {
  const { t } = useI18n();
  const [url, setUrl] = useState(getLocalServer());
  const [savedAt, setSavedAt] = useState(null);

  const onSave = () => {
    setLocalServer(url.trim());
    setUrl(url.trim());
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 1400);
  };

  const inputCls = 'w-full bg-[hsl(var(--c-card))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none focus:border-[hsl(var(--c-accent))]';

  return (
    <div className="space-y-3">
      <p className="text-xs text-[hsl(var(--c-dim))]">
        {t('settings.localServerSubtitle')}
      </p>
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
      <button
        onClick={onSave}
        className="flex items-center gap-2 bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))] text-white rounded-lg px-3 py-2 text-sm font-medium"
      >
        <Check className="w-4 h-4" /> {t('common.save')}
      </button>
      {savedAt && <p className="text-xs text-emerald-400">{t('common.saved')} ✓</p>}
    </div>
  );
}