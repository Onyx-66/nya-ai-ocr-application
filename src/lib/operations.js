// Lightweight in-memory operations store with pub/sub.
// BatchWorkspace pushes updates here; the Operations page subscribes.
let ops = [];
const subs = new Set();
function emit() { subs.forEach((cb) => cb(ops)); }

export function subscribe(cb) {
  subs.add(cb);
  cb(ops);
  return () => subs.delete(cb);
}

export function addOp(partial) {
  const op = { id: crypto.randomUUID(), status: 'running', progress: null, startedAt: Date.now(), ...partial };
  ops = [op, ...ops];
  emit();
  return op.id;
}

export function updateOp(id, patch) {
  ops = ops.map((o) => (o.id === id ? { ...o, ...patch } : o));
  emit();
}

export function removeOp(id) {
  ops = ops.filter((o) => o.id !== id);
  emit();
}

export function clearFinished() {
  ops = ops.filter((o) => o.status === 'running');
  emit();
}