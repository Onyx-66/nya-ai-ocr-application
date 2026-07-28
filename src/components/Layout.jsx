import { useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { ScanText, Settings as SettingsIcon, Library as LibraryIcon, Activity, BarChart3, Zap } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

const LOGO_URL = 'https://media.base44.com/images/public/6a688b2529efa59d9f9f1863/5009bade8_AddText_07-27-012338.png';

const navItems = [
  { to: '/', label: 'Workspace', icon: ScanText },
  { to: '/library', label: 'Library', icon: LibraryIcon },
  { to: '/operations', label: 'Operations', icon: Activity },
  { to: '/usage', label: 'Usage', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon }
];

export default function Layout() {
  const { pathname } = useLocation();
  const { user, checkUserAuth } = useAuth();
  const { toast } = useToast();

  // First-use welcome credits (15) + free daily login gift (+4).
  useEffect(() => {
    if (!user) return;
    const today = new Date().toLocaleDateString('en-CA');
    const patch = {};
    let base = user.credits;
    if (base == null) { base = 15; patch.credits = 15; }
    if (user.last_daily_gift !== today) {
      patch.credits = base + 4;
      patch.last_daily_gift = today;
    }
    if (Object.keys(patch).length) {
      const gifted = !!patch.last_daily_gift;
      base44.auth.updateMe(patch).then(() => {
        checkUserAuth();
        if (gifted) toast({ variant: 'success', title: 'Daily login gift', description: '+4 credits added to your account.' });
      }).catch(() => {});
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[hsl(var(--c-bg))] text-[hsl(var(--c-text))] flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex w-16 xl:w-60 shrink-0 border-r border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] flex-col">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-[hsl(var(--c-border))]">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-black">
            <Image src={LOGO_URL} fittingType="fill" className="w-full h-full" />
          </div>
          <span className="hidden xl:block font-heading font-semibold tracking-tight">Nya Smart OCR</span>
        </div>
        <nav className="flex-1 p-2 xl:p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to} to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors justify-center xl:justify-start ${
                  active ? 'bg-[hsl(var(--c-accent))] text-white' : 'text-[hsl(var(--c-dim))] hover:text-[hsl(var(--c-text))] hover:bg-[hsl(var(--c-soft))]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden xl:block">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[hsl(var(--c-border))] text-xs text-[hsl(var(--c-dim))] hidden xl:block">
          AI OCR for manga &amp; webtoons
        </div>
      </aside>

      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2 px-4 h-14 border-b border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))]/95 backdrop-blur">
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-black shrink-0">
            <Image src={LOGO_URL} fittingType="fill" className="w-full h-full" />
          </div>
          <span className="font-heading font-semibold tracking-tight text-[hsl(var(--c-text))]">Nya Smart OCR</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-[hsl(var(--c-dim))]">
            <Zap className="w-3.5 h-3.5 text-[hsl(var(--c-accent))]" />
            <span className="font-semibold text-[hsl(var(--c-text))]">{user?.credits ?? '…'}</span>
          </span>
        </header>
        <Outlet />
      </main>

      {/* Fixed footer nav — tablet & phone */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[hsl(var(--c-card))] border-t border-[hsl(var(--c-border))] flex">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to} to={to}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors ${
                active ? 'text-[hsl(var(--c-accent))]' : 'text-[hsl(var(--c-dim))]'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}