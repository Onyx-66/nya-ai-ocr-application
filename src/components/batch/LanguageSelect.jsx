import { useState, useRef, useEffect } from 'react';

export const LANGUAGES = [
  { name: 'English', flag: '🇬🇧' },
  { name: 'Arabic', flag: '🇸🇦' },
  { name: 'Spanish', flag: '🇪🇸' },
  { name: 'French', flag: '🇫🇷' },
  { name: 'German', flag: '🇩🇪' },
  { name: 'Italian', flag: '🇮🇹' },
  { name: 'Portuguese', flag: '🇵🇹' },
  { name: 'Russian', flag: '🇷🇺' },
  { name: 'Japanese', flag: '🇯🇵' },
  { name: 'Korean', flag: '🇰🇷' },
  { name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { name: 'Chinese (Traditional)', flag: '🇹🇼' },
  { name: 'Turkish', flag: '🇹🇷' },
  { name: 'Indonesian', flag: '🇮🇩' },
  { name: 'Vietnamese', flag: '🇻🇳' },
  { name: 'Thai', flag: '🇹🇭' },
  { name: 'Hindi', flag: '🇮🇳' },
  { name: 'Dutch', flag: '🇳🇱' },
  { name: 'Polish', flag: '🇵🇱' },
  { name: 'Persian', flag: '🇮🇷' },
  { name: 'Hebrew', flag: '🇮🇱' },
  { name: 'Filipino', flag: '🇵🇭' },
  { name: 'Malay', flag: '🇲🇾' }
];

function flagFor(name) {
  const f = LANGUAGES.find((l) => l.name.toLowerCase() === (name || '').toLowerCase());
  return f ? f.flag : '🌐';
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

  const filtered = LANGUAGES.filter((l) => l.name.toLowerCase().includes((text || '').toLowerCase()));

  const commit = (v) => {
    setText(v);
    onChange(v);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-2 bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg px-3 py-2 focus-within:border-[hsl(var(--c-accent))]">
        <span className="text-base leading-none">{flagFor(text)}</span>
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); onChange(e.target.value); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setOpen(false); commit(text.trim()); } }}
          placeholder="Type or choose a language"
          className="flex-1 bg-transparent text-sm text-[hsl(var(--c-text))] placeholder:text-[hsl(var(--c-dim))] focus:outline-none"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] shadow-xl">
          {filtered.map((l) => (
            <button
              key={l.name}
              onClick={() => { commit(l.name); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[hsl(var(--c-text))] hover:bg-[hsl(var(--c-soft))] text-left"
            >
              <span className="text-base leading-none">{l.flag}</span>
              {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}