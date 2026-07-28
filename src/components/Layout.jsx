import { Link, useLocation, Outlet } from 'react-router-dom';
import { ScanText, Settings as SettingsIcon } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Workspace', icon: ScanText },
  { to: '/settings', label: 'Settings', icon: SettingsIcon }
];

export default function Layout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <aside className="w-16 md:w-60 shrink-0 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="h-16 flex items-center gap-2 px-4 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <ScanText className="w-5 h-5 text-white" />
          </div>
          <span className="hidden md:block font-heading font-semibold tracking-tight">MangaOCR</span>
        </div>
        <nav className="flex-1 p-2 md:p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden md:block">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-800 text-xs text-slate-600 hidden md:block">
          AI OCR for manga &amp; webtoons
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}