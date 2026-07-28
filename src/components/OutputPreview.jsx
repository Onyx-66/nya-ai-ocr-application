export default function OutputPreview({ output, format }) {
  const lines = output ? output.split('\n') : [];
  return (
    <div className="rounded-lg border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--c-border))] text-xs text-[hsl(var(--c-dim))]">
        <span>Preview</span>
        <span className="uppercase tracking-wide">{format} · {lines.length} lines</span>
      </div>
      <div className="flex max-h-[420px] overflow-auto">
        <div className="py-3 px-3 text-right text-[hsl(var(--c-dim))] select-none border-r border-[hsl(var(--c-border))] font-mono text-xs leading-5 shrink-0">
          {lines.map((_, i) => (<div key={i}>{i + 1}</div>))}
        </div>
        <pre className="flex-1 py-3 px-4 font-mono text-xs leading-5 text-[hsl(var(--c-text))] whitespace-pre-wrap break-words">
          {output || <span className="text-[hsl(var(--c-dim))]">Generated text will appear here after you click Run OCR…</span>}
        </pre>
      </div>
    </div>
  );
}