import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Zap, Minus, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel
} from '@/components/ui/alert-dialog';

const ROLE_LABEL = { admin: 'Administrator', premium: 'Premium user', user: 'User' };

export default function AccountSection() {
  const { user, checkUserAuth, logout } = useAuth();
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState(null);
  const [delOpen, setDelOpen] = useState(false);
  const [delOpen2, setDelOpen2] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delErr, setDelErr] = useState(null);

  const initials = (user?.email || '?').slice(0, 1).toUpperCase();
  const amt = Number(amount) || 0;
  const isRemove = amt < 0;
  const isZero = amt === 0;

  const apply = async () => {
    if (isZero) return;
    try {
      await base44.functions.invoke('manageCredits', { action: 'adjust', amount: amt });
      setAmount(''); setMsg(`${amt > 0 ? 'Added' : 'Removed'} ${Math.abs(amt)} credit${Math.abs(amt) > 1 ? 's' : ''}`);
      setTimeout(() => setMsg(null), 1800);
      await checkUserAuth();
    } catch (e) { setMsg(e.message || 'Could not update credits'); }
  };

  const doDelete = async () => {
    setDeleting(true); setDelErr(null);
    try {
      await base44.functions.invoke('deleteAccount', { confirm: true });
      logout(true); // clears token and reloads → auth redirect to login
    } catch (e) {
      setDelErr(e.message || 'Could not delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Profile */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[hsl(var(--c-accent))]/15 flex items-center justify-center text-[hsl(var(--c-accent))] font-semibold text-lg shrink-0">{initials}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[hsl(var(--c-text))] truncate">{user?.email || '—'}</p>
          <span className="inline-flex items-center mt-1 text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--c-accent))]/15 text-[hsl(var(--c-accent))]">{ROLE_LABEL[user?.role] || user?.role || '—'}</span>
        </div>
      </div>

      {/* Balance */}
      <div className="flex items-center gap-4 rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-input))] px-4 py-4">
        <div className="w-11 h-11 rounded-full bg-[hsl(var(--c-accent))]/15 flex items-center justify-center shrink-0">
          <Zap className="w-6 h-6 text-[hsl(var(--c-accent))]" />
        </div>
        <div className="min-w-0">
          <p className="text-3xl font-semibold text-[hsl(var(--c-text))] leading-none">{user?.credits ?? '…'}</p>
          <p className="text-xs text-[hsl(var(--c-dim))] mt-1.5">credits balance · 1 per OCR / translation · +4 daily login gift</p>
        </div>
      </div>

      {user?.role === 'admin' && (
      <div>
        <label className="block text-xs text-[hsl(var(--c-dim))] mb-1.5">Add or remove credits (admin)</label>
        <div className="flex items-center gap-2">
          <div className="relative w-36">
            <input
              type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 7 or -7"
              className="w-full bg-[hsl(var(--c-input))] border border-[hsl(var(--c-border))] rounded-lg pl-9 pr-3 py-2 text-sm text-[hsl(var(--c-text))] focus:outline-none focus:border-[hsl(var(--c-accent))]"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--c-dim))]">{isRemove ? <Minus className="w-4 h-4" /> : <Zap className="w-4 h-4" />}</span>
          </div>
          <button
            onClick={apply}
            disabled={isZero}
            className={`flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed bg-[hsl(var(--c-accent))] hover:bg-[hsl(var(--c-accent-2))]'}`}
          >
            Apply
          </button>
          {msg && <span className={`text-xs truncate ${msg.includes('Could') ? 'text-rose-400' : 'text-emerald-400'}`}>{msg}</span>}
        </div>
        <p className="text-[11px] text-[hsl(var(--c-dim))] mt-1.5">Positive number adds credits, negative (e.g. -7) removes them.</p>
      </div>
      )}

      {/* Delete account */}
      <div className="pt-3 border-t border-[hsl(var(--c-border))]">
        <button onClick={() => setDelOpen(true)} className="flex items-center gap-1.5 text-sm text-[hsl(var(--c-danger-strong))] hover:opacity-80">
          <Trash2 className="w-4 h-4" /> Delete account
        </button>
      </div>

      {/* Confirmation step 1 */}
      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent className="bg-[hsl(var(--c-card))] text-[hsl(var(--c-text))] border-[hsl(var(--c-border))]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription className="text-[hsl(var(--c-dim))]">
              This will permanently delete your account and all remaining credits. You will be signed out immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[hsl(var(--c-soft))] text-[hsl(var(--c-text))] border-[hsl(var(--c-border))]">Cancel</AlertDialogCancel>
            <button onClick={() => { setDelOpen(false); setDelOpen2(true); }} className="bg-[hsl(var(--c-danger-strong))] hover:opacity-90 text-white rounded-md px-4 py-2 text-sm font-medium">
              Continue
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation step 2 */}
      <AlertDialog open={delOpen2} onOpenChange={setDelOpen2}>
        <AlertDialogContent className="bg-[hsl(var(--c-card))] text-[hsl(var(--c-text))] border-[hsl(var(--c-border))]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-[hsl(var(--c-dim))]">
              This is your final warning. Once you confirm, your account and credits are gone forever and cannot be recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {delErr && <p className="text-xs text-rose-400 -mt-1">{delErr}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="bg-[hsl(var(--c-soft))] text-[hsl(var(--c-text))] border-[hsl(var(--c-border))]">Cancel</AlertDialogCancel>
            <button onClick={doDelete} disabled={deleting} className="flex items-center gap-1.5 bg-[hsl(var(--c-danger-strong))] hover:opacity-90 disabled:opacity-50 text-white rounded-md px-4 py-2 text-sm font-medium">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete forever
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}