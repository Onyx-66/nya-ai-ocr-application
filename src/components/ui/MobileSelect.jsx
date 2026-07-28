import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronDown, Check } from 'lucide-react';

// A mobile-friendly select: a bottom sheet drawer on phones, a styled
// dropdown on larger screens. Every option row is a comfortable ≥44px tall.
export default function MobileSelect({ value, onChange, options, placeholder = 'Select', className = '', disabled = false }) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [popOpen, setPopOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!popOpen) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setPopOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [popOpen]);

  const pick = (v) => { onChange(v); setSheetOpen(false); setPopOpen(false); };

  const trigger = (
    <button
      type="button"
      disabled={disabled}
      onClick={() => (isMobile ? setSheetOpen(true) : setPopOpen((o) => !o))}
      className={`flex items-center justify-between gap-2 w-full text-left ${className}`}
    >
      <span className="truncate">{current ? current.label : placeholder}</span>
      <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />
    </button>
  );

  const list = options.map((o) => (
    <button
      key={String(o.value)}
      onClick={() => pick(o.value)}
      className={`flex items-center justify-between w-full min-h-[44px] px-3 py-2.5 rounded-lg text-sm text-left ${o.value === value ? 'bg-[hsl(var(--c-accent))]/15 text-[hsl(var(--c-accent))]' : 'text-[hsl(var(--c-text))] hover:bg-[hsl(var(--c-soft))]'}`}
    >
      <span className="truncate">{o.label}</span>
      {o.value === value && <Check className="w-4 h-4 shrink-0" />}
    </button>
  ));

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl bg-[hsl(var(--c-card))] text-[hsl(var(--c-text))] border-[hsl(var(--c-border))]">
            <SheetHeader className="text-left">
              <SheetTitle className="text-[hsl(var(--c-text))]">{placeholder}</SheetTitle>
            </SheetHeader>
            <div className="max-h-[60vh] overflow-auto pb-4 -mx-1">{list}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <div className="relative" ref={ref}>
      {trigger}
      {popOpen && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] shadow-xl p-1 max-h-64 overflow-auto">
          {list}
        </div>
      )}
    </div>
  );
}