import { useI18n, LANGUAGES } from '@/lib/I18nContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex items-center gap-2 bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2">
      <Globe className="w-4 h-4 text-[hsl(var(--c-dim))] shrink-0" />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="flex-1 min-w-0 bg-transparent text-sm text-[hsl(var(--c-text))] focus:outline-none appearance-none"
        aria-label="App language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.id} value={l.id} className="bg-[hsl(var(--c-card))] text-[hsl(var(--c-text))]">
            {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}