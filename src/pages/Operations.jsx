import { useEffect, useState } from 'react';
import { subscribe, clearFinished, removeOp, requestStopAll, isStopRequested } from '@/lib/operations';
import { Activity, Loader2, CheckCircle2, XCircle, Trash2, Sparkles, Languages, Square, Clock, ListChecks } from 'lucide-react';

const elapsed = (s, e) => {
  const ms = (e || Date.now()) - s;
  if (ms < 1000) return 'just now';
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  return `${m}m ${sec % 60}s`;
};

const FIN_FILTERS = [{ id: 'all', label: 'All' }, { id: 'ocr', label: 'OCR' }, { id: 'translation', label: 'Translation' }];

export default function Operations() {
  const [ops, setOps] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [finFilter, setFinFilter] = useState('all');
  useEffect(() => subscribe(setOps), []);
  useEffect(() => { if (ops.some((o) => o.status === 'running')) { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); } }, [ops]);

  const active = ops.filter((o) => o.status === 'running');
  const finished = ops.filter((o) => o.status !== 'running');
  const finishedView = finFilter === 'all' ? finished : finished.filter((o) => o.type === finFilter);
  const avgSec = finished.length ? Math.round(finished.reduce((a, o) => a + ((o.finishedAt || now) - o.startedAt), 0) / finished.length / 1000) : 0;

  const stopRequestedNow = isStopRequested();

  const stats = [
    { icon: ListChecks, label: 'Total', value: ops.length, color: 'text-[hsl(var(--c-text))]', spin: false },
    { icon: Loader2, label: 'Running', value: active.length, color: 'text-[hsl(var(--c-accent))]', spin: true },
    { icon: Clock, label: 'Avg / job', value: `${avgSec}s`, color: 'text-[hsl(var(--c-text))]', spin: false }
  ];

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl font-heading font-semibold text-[hsl(var(--c-text))]">Operations</h1>
        {ops.length > 0 && (
          <button onClick={clearFinished} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]">
            <Trash2 className="w-3.5 h-3.5" />Clear finished
          </button>
        )}
      </div>
      <p className="text-[hsl(var(--c-dim))] text-sm mb-6">Active and recent OCR / translation jobs across all chapters.</p>

      {/* Summary — single organized card */}
      <div className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4 mb-5">
        <div className="grid grid-cols-3 divide-x divide-[hsl(var(--c-border))]">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="px-2 sm:px-4 flex flex-col items-center sm:items-start gap-1.5">
                <div className="flex items-center gap-2 text-[hsl(var(--c-dim))]">
                  <Icon className={`w-4 h-4 ${s.spin ? 'animate-spin' : ''}`} />
                  <span className="text-[11px] uppercase tracking-wide">{s.label}</span>
                </div>
                <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {active.length > 0 && (
        <button onClick={requestStopAll} disabled={stopRequestedNow} className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold mb-5 text-white ${stopRequestedNow ? 'bg-[hsl(var(--c-soft-2))] opacity-60 cursor-not-allowed' : 'bg-rose-500 hover:bg-rose-600'}`}>
          <Square className="w-4 h-4" /> {stopRequestedNow ? 'Stopping…' : 'Stop all operations'}
        </button>
      )}

      {ops.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[hsl(var(--c-border))] p-10 text-center text-[hsl(var(--c-dim))]">
          <Activity className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No operations yet. Run OCR or translation to see live progress here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-wide text-[hsl(var(--c-dim))] mb-2">Active · {active.length}</h2>
              <div className="space-y-3">
                {active.map((o) => (
                  <div key={o.id} className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[hsl(var(--c-accent))]/15 flex items-center justify-center shrink-0">
                        {o.type === 'translation' ? <Languages className="w-4 h-4 text-[hsl(var(--c-accent))]" /> : <Sparkles className="w-4 h-4 text-[hsl(var(--c-accent))]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[hsl(var(--c-text))] truncate">{o.label}</p>
                        <p className="text-xs text-[hsl(var(--c-dim))]">Running · {elapsed(o.startedAt, now)}</p>
                      </div>
                      <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--c-accent))] shrink-0" />
                    </div>
                    <div className="mt-3">
                      {o.progress == null ? (
                        <div className="h-1.5 rounded-full bg-[hsl(var(--c-soft))] overflow-hidden">
                          <div className="h-full w-1/3 bg-[hsl(var(--c-accent))] animate-pulse" />
                        </div>
                      ) : (
                        <>
                          <div className="h-1.5 rounded-full bg-[hsl(var(--c-soft))] overflow-hidden">
                            <div className="h-full bg-[hsl(var(--c-accent))] transition-all" style={{ width: `${o.progress}%` }} />
                          </div>
                          <p className="text-xs text-[hsl(var(--c-dim))] mt-1 text-right">{o.progress}%{o.total ? ` · ${o.completed}/${o.total}` : ''}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {finished.length > 0 && (
            <section>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="text-xs uppercase tracking-wide text-[hsl(var(--c-dim))]">Finished · {finished.length}</h2>
                <div className="flex gap-1 p-1 bg-[hsl(var(--c-input))] rounded-lg border border-[hsl(var(--c-border))] w-fit">
                  {FIN_FILTERS.map((f) => (
                    <button key={f.id} onClick={() => setFinFilter(f.id)} className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${finFilter === f.id ? 'bg-[hsl(var(--c-accent))] text-white' : 'text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]'}`}>{f.label}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {finishedView.length === 0 ? (
                  <p className="text-xs text-[hsl(var(--c-dim))] py-4 text-center">No {finFilter} operations.</p>
                ) : finishedView.map((o) => (
                  <div key={o.id} className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${o.status === 'done' ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                      {o.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[hsl(var(--c-text))] truncate">{o.label}</p>
                      <p className="text-xs text-[hsl(var(--c-dim))] truncate">{o.status === 'done' ? 'Completed' : 'Failed'} · {elapsed(o.startedAt, o.finishedAt)}{o.error ? ` · ${o.error}` : ''}</p>
                    </div>
                    <button onClick={() => removeOp(o.id)} className="text-[hsl(var(--c-dim))] hover:text-rose-400 shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}