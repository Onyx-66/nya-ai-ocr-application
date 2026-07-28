import { useState, useRef, useEffect } from 'react';

// Language → ISO 3166 country code (flagcdn). Mangadex-style flag images.
export const LANGUAGES = [
  { name: 'English', code: 'gb' },
  { name: 'Arabic', code: 'sa' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'German', code: 'de' },
  { name: 'Italian', code: 'it' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Brazilian Portuguese', code: 'br' },
  { name: 'Russian', code: 'ru' },
  { name: 'Japanese', code: 'jp' },
  { name: 'Korean', code: 'kr' },
  { name: 'Chinese (Simplified)', code: 'cn' },
  { name: 'Chinese (Traditional)', code: 'tw' },
  { name: 'Turkish', code: 'tr' },
  { name: 'Indonesian', code: 'id' },
  { name: 'Vietnamese', code: 'vn' },
  { name: 'Thai', code: 'th' },
  { name: 'Hindi', code: 'in' },
  { name: 'Dutch', code: 'nl' },
  { name: 'Polish', code: 'pl' },
  { name: 'Persian', code: 'ir' },
  { name: 'Hebrew', code: 'il' },
  { name: 'Filipino', code: 'ph' },
  { name: 'Malay', code: 'my' },
  { name: 'Ukrainian', code: 'ua' },
  { name: 'Czech', code: 'cz' },
  { name: 'Swedish', code: 'se' },
  { name: 'Norwegian', code: 'no' },
  { name: 'Finnish', code: 'fi' },
  { name: 'Danish', code: 'dk' },
  { name: 'Greek', code: 'gr' },
  { name: 'Romanian', code: 'ro' },
  { name: 'Hungarian', code: 'hu' },
  { name: 'Bulgarian', code: 'bg' },
  { name: 'Serbian', code: 'rs' },
  { name: 'Croatian', code: 'hr' },
  { name: 'Slovak', code: 'sk' },
  { name: 'Lithuanian', code: 'lt' },
  { name: 'Latvian', code: 'lv' },
  { name: 'Estonian', code: 'ee' },
  { name: 'Slovenian', code: 'si' },
  { name: 'Bengali', code: 'bd' },
  { name: 'Urdu', code: 'pk' },
  { name: 'Swahili', code: 'ke' },
  { name: 'Mongolian', code: 'mn' },
  { name: 'Burmese', code: 'mm' }
];

function flagImg(code, name) {
  if (!code) return <span className="text-base leading-none">🌐</span>;
  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt={name || ''}
      className="w-4 h-3 rounded-[2px] object-cover border border-black/20 shrink-0"
      onError={(e) => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

export default function LanguageSelect({ value, onChange }) {
  const [text, setText] = useState(value || 'English');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => { setText(value || ''); }, [value]);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const q = (text || '').toLowerCase();
  const filtered = q ? LANGUAGES.filter((l) => l.name.toLowerCase().includes(q)) : LANGUAGES;
  const current = LANGUAGES.find((l) => l.name.toLowerCase() === q);

  const commit = (v) => { setText(v); onChange(v); };

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 focus-within:border-[hsl(var(--c-accent))]">
        {flagImg(current?.code, text)}
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); onChange(e.target.value); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setOpen(false); commit(text.trim()); } }}
          placeholder="Type or choose a language"
          className="flex-1 min-w-0 bg-transparent text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] shadow-xl">
          {filtered.slice(0, 30).map((l) => (
            <button
              key={l.name}
              onClick={() => { commit(l.name); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[hsl(var(--c-text))] hover:bg-[hsl(var(--c-soft))] text-left"
            >
              {flagImg(l.code, l.name)}
              <span className="truncate">{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}