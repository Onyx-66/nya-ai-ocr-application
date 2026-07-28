import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ScanText, Settings as SettingsIcon, Library as LibraryIcon, Activity, BarChart3, Zap } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import Home from '@/pages/Home';
import Library from '@/pages/Library';
import Operations from '@/pages/Operations';
import Usage from '@/pages/Usage';
import Settings from '@/pages/Settings';

const LOGO_URL = 'https://media.base44.com/images/public/6a688b2529efa59d9f9f1863/5009bade8_AddText_07-27-012338.png';

const navItems = [
  { to: '/', label: 'Workspace', icon: ScanText },
  { to: '/library', label: 'Library', icon: LibraryIcon },
  { to: '/operations', label: 'Operations', icon: Activity },
  { to: '/usage', label: 'Usage', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon }
];

// Keep-alive tabs: all pages stay mounted; inactive ones are hidden so their
// scroll position, form state, and query criteria survive tab switches.
const PAGES = [
  { path: '/', Comp: Home },
  { path: '/library', Comp: Library },
  { path: '/operations', Comp: Operations },
  { path: '/usage', Comp: Usage },
  { path: '/settings', Comp: Settings }
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
    <div className="h-screen flex bg-[hsl(var(--c-bg))] text-[hsl(var(--c-text))] overflow-hidden">
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

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Safe-area spacer for notches / status bars (mobile only) */}
        <div className="lg:hidden bg-[hsl(var(--c-card))]" style={{ height: 'env(safe-area-inset-top)' }} />
        <header className="lg:hidden flex items-center gap-2 px-4 h-14 border-b border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))]/95 backdrop-blur shrink-0">
          <div className="w-7 h-7 rounded-lg overflow-hidden bg-black shrink-0">
            <Image src={LOGO_URL} fittingType="fill" className="w-full h-full" />
          </div>
          <span className="font-heading font-semibold tracking-tight text-[hsl(var(--c-text))]">Nya Smart OCR</span>
          <span className="ml-auto flex items-center gap-1 text-xs text-[hsl(var(--c-dim))]">
            <Zap className="w-3.5 h-3.5 text-[hsl(var(--c-accent))]" />
            <span className="font-semibold text-[hsl(var(--c-text))]">{user?.credits ?? '…'}</span>
          </span>
        </header>

        {/* Keep-alive page area: each page stays mounted in its own scroll container. */}
        <div className="flex-1 relative overflow-hidden">
          {PAGES.map(({ path, Comp }) => {
            const active = pathname === path;
            return (
              <motion.div
                key={path}
                animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
                style={{ display: active ? 'block' : 'none' }}
              >
                <div className="min-h-full pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-6">
                  <Comp />
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Fixed footer nav — tablet & phone */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[hsl(var(--c-card))] border-t border-[hsl(var(--c-border))] flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
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