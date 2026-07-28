import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function SettingsSection({ icon: Icon, title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 p-4 sm:p-5 text-left">
        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--c-soft))] flex items-center justify-center shrink-0">
          {Icon && <Icon className="w-5 h-5 text-[hsl(var(--c-accent))]" />}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-[hsl(var(--c-text))] leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-[hsl(var(--c-dim))] mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown className={`w-5 h-5 text-[hsl(var(--c-dim))] transition-transform shrink-0 ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="px-4 sm:px-5 pb-5 pt-4 border-t border-[hsl(var(--c-border))]">{children}</div>}
    </section>
  );
}