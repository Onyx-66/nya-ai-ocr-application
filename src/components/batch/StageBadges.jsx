import { hasLocalServer } from '@/lib/localServer';

const STAGES = [
  { id: 'ocr', label: 'OCR' },
  { id: 'cleaning', label: 'Clean' },
  { id: 'translation', label: 'TL' },
  { id: 'typesetting', label: 'Typeset' },
];

export default function StageBadges() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {STAGES.map((s) => {
        const local = hasLocalServer(s.id);
        return (
          <span
            key={s.id}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${local ? 'bg-[hsl(var(--c-accent))]/15 text-[hsl(var(--c-accent))]' : 'bg-[hsl(var(--c-soft))] text-[hsl(var(--c-dim))]'}`}
          >
            {s.label} · {local ? 'Local' : 'Cloud'}
          </span>
        );
      })}
    </div>
  );
}