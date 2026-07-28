// Operations store with pub/sub + localStorage persistence (survives reloads/navigation).
const KEY = 'ocr_ops_history';
let ops = [];
const subs = new Set();
function emit() { subs.forEach((cb) => cb(ops)); }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(ops.slice(0, 200))); } catch {} }
try { ops = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch { ops = []; }

export function subscribe(cb) { subs.add(cb); cb(ops); return () => subs.delete(cb); }
export function addOp(partial) {
  const op = { id: crypto.randomUUID(), status: 'running', progress: null, startedAt: Date.now(), ...partial };
  ops = [op, ...ops].slice(0, 200);
  persist(); emit();
  return op.id;
}
export function updateOp(id, patch) {
  ops = ops.map((o) => (o.id === id ? { ...o, ...patch } : o));
  persist(); emit();
}
export function removeOp(id) { ops = ops.filter((o) => o.id !== id); persist(); emit(); }
export function clearFinished() { ops = ops.filter((o) => o.status === 'running'); persist(); emit(); }
export function getHistory() { return ops; }

// Stop-all signal: the workspace polls isStopRequested() inside its run loop.
let stopRequested = false;
export function requestStopAll() { stopRequested = true; emit(); }
export function isStopRequested() { return stopRequested; }
export function clearStop() { stopRequested = false; }