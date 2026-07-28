import { useEffect, useState } from 'react';
import { subscribe, clearFinished, removeOp, requestStopAll, isStopRequested, getHistory } from '@/lib/operations';
import { Activity, Loader2, CheckCircle2, XCircle, Trash2, Sparkles, Languages, Square, Clock, ListChecks } from 'lucide-react';
import PullToRefresh from '@/components/PullToRefresh';

const elapsed = (s, e) => {
  const ms = (e || Date.now()) - s;
  if (ms < 1000) return 'just now';
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  return `${m}m ${sec % 60}s`;
};

export default function Operations() {
  const [ops, setOps] = useState([]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => subscribe(setOps), []);
  useEffect(() => { if (ops.some((o) => o.status === 'running')) { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); } }, [ops]);

  const active = ops.filter((o) => o.status === 'running');
  const finished = ops.filter((o) => o.status !== 'running');
  const doneCount = ops.filter((o) => o.status === 'done').length;
  const avgSec = finished.length ? Math.round(finished.reduce((a, o) => a + ((o.finishedAt || now) - o.startedAt), 0) / finished.length / 1000) : 0;

  const stopRequestedNow = isStopRequested();
  const refresh = async () => { setOps(getHistory()); };

  return (
    <PullToRefresh onRefresh={refresh} className="max-w-3xl mx-auto">
    <div className="p-4 sm:p-6 md:p-10">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl font-heading font-semibold text-[hsl(var(--c-text))]">Operations</h1>
        {ops.length > 0 && (
          <button onClick={clearFinished} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))]">
            <Trash2 className="w-3.5 h-3.5" />Clear finished
          </button>
        )}
      </div>
      <p className="text-[hsl(var(--c-dim))] text-sm mb-6">Active and recent OCR / translation jobs across all chapters.</p>

      {/* Summary */}
      <div className="space-y-2.5 mb-6">
        <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] px-4 h-14">
          <div className="flex items-center gap-2.5 text-[hsl(var(--c-dim))]"><ListChecks className="w-4 h-4" /><span className="text-xs uppercase tracking-wide font-medium">Total</span></div>
          <p className="text-xl font-semibold text-[hsl(var(--c-text))] tabular-nums">{ops.length}</p>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] px-4 h-14">
          <div className="flex items-center gap-2.5 text-[hsl(var(--c-dim))]"><Loader2 className="w-4 h-4" /><span className="text-xs uppercase tracking-wide font-medium">Running</span></div>
          <p className="text-xl font-semibold text-[hsl(var(--c-accent))] tabular-nums">{active.length}</p>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] px-4 h-14">
          <div className="flex items-center gap-2.5 text-[hsl(var(--c-dim))]"><Clock className="w-4 h-4" /><span className="text-xs uppercase tracking-wide font-medium">Avg / job</span></div>
          <p className="text-xl font-semibold text-[hsl(var(--c-text))] tabular-nums">{avgSec}s</p>
        </div>
      </div>

      {active.length > 0 && (
        <button onClick={requestStopAll} disabled={stopRequestedNow} className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold mb-5 text-white ${stopRequestedNow ? 'bg-[hsl(var(--c-soft-2))] opacity-60 cursor-not-allowed' : 'bg-[hsl(var(--c-danger-strong))] hover:opacity-90'}`}>
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
              <h2 className="text-xs uppercase tracking-wide text-[hsl(var(--c-dim))] mb-2">Finished · {finished.length}</h2>
              <div className="space-y-3">
                {finished.map((o) => (
                  <div key={o.id} className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${o.status === 'done' ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                      {o.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[hsl(var(--c-text))] truncate">{o.label}</p>
                      <p className="text-xs text-[hsl(var(--c-dim))] truncate">{o.status === 'done' ? 'Completed' : 'Failed'} · {elapsed(o.startedAt, o.finishedAt)}{o.error ? ` · ${o.error}` : ''}</p>
                    </div>
                    <button onClick={() => removeOp(o.id)} className="text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))] shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}