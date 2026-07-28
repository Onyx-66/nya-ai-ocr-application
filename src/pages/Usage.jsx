import { useMemo, useState } from 'react';
import { getUsage, clearUsage } from '@/lib/usage';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Zap, CalendarDays, BookOpen, TrendingUp, Trash2 } from 'lucide-react';

const ACCENT = '#7c6ff5';
const fmtMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const fmtDay = (d) => d.toISOString().slice(0, 10);

export default function Usage() {
  const [tick, setTick] = useState(0);
  const usage = useMemo(() => getUsage(), [tick]);

  const now = new Date();
  const monthKey = fmtMonth(now);
  const monthCount = usage.filter((u) => fmtMonth(new Date(u.ts)) === monthKey).length;
  const total = usage.length;

  const bySeries = {};
  usage.forEach((u) => { bySeries[u.series || 'Untitled'] = (bySeries[u.series || 'Untitled'] || 0) + 1; });
  const topSeries = Object.entries(bySeries).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, count]) => ({ name: name.length > 14 ? name.slice(0, 13) + '…' : name, count, full: name }));

  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    days.push({ date: fmtDay(d), label: String(d.getDate()), count: 0 });
  }
  const dayMap = Object.fromEntries(days.map((d) => [d.date, d]));
  usage.forEach((u) => { const k = fmtDay(new Date(u.ts)); if (dayMap[k]) dayMap[k].count++; });

  const ocrCount = usage.filter((u) => u.type === 'ocr').length;
  const tlCount = usage.filter((u) => u.type === 'translation').length;

  const tooltipStyle = { background: 'hsl(222 40% 12%)', border: '1px solid hsl(217 33% 20%)', borderRadius: 8, color: '#e7e9f3', fontSize: 12 };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl font-heading font-semibold text-[hsl(var(--c-text))]">Usage dashboard</h1>
        {usage.length > 0 && (
          <button onClick={() => { clearUsage(); setTick((t) => t + 1); }} className="flex items-center gap-1.5 text-xs text-[hsl(var(--c-dim))] hover:text-rose-400">
            <Trash2 className="w-3.5 h-3.5" />Clear
          </button>
        )}
      </div>
      <p className="text-[hsl(var(--c-dim))] text-sm mb-6">Track credits spent and which series consume the most processing.</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4">
          <div className="flex items-center gap-2 text-[hsl(var(--c-dim))]"><Zap className="w-4 h-4 text-[hsl(var(--c-accent))]" /><span className="text-[11px] uppercase tracking-wide">This month</span></div>
          <p className="text-2xl font-semibold text-[hsl(var(--c-text))] mt-1">{monthCount}</p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4">
          <div className="flex items-center gap-2 text-[hsl(var(--c-dim))]"><TrendingUp className="w-4 h-4 text-emerald-400" /><span className="text-[11px] uppercase tracking-wide">All time</span></div>
          <p className="text-2xl font-semibold text-[hsl(var(--c-text))] mt-1">{total}</p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4">
          <div className="flex items-center gap-2 text-[hsl(var(--c-dim))]"><BookOpen className="w-4 h-4 text-[hsl(var(--c-accent))]" /><span className="text-[11px] uppercase tracking-wide">OCR jobs</span></div>
          <p className="text-2xl font-semibold text-[hsl(var(--c-text))] mt-1">{ocrCount}</p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4">
          <div className="flex items-center gap-2 text-[hsl(var(--c-dim))]"><BookOpen className="w-4 h-4 text-emerald-400" /><span className="text-[11px] uppercase tracking-wide">Translations</span></div>
          <p className="text-2xl font-semibold text-[hsl(var(--c-text))] mt-1">{tlCount}</p>
        </div>
      </div>

      {usage.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[hsl(var(--c-border))] p-10 text-center text-[hsl(var(--c-dim))]">
          <CalendarDays className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No usage recorded yet. Run OCR or translation to start building your stats.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Daily usage */}
          <div className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4">
            <h2 className="text-sm font-medium text-[hsl(var(--c-text))] mb-3">Daily credits · last 30 days</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={days} margin={{ top: 5, right: 12, left: -18, bottom: 40 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT} stopOpacity={0.5} />
                      <stop offset="95%" stopColor={ACCENT} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-40} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} tickLine={false} axisLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(215 20% 70%)' }} />
                  <Area type="monotone" dataKey="count" stroke={ACCENT} strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per series */}
          <div className="rounded-xl border border-[hsl(var(--c-border))] bg-[hsl(var(--c-card))] p-4">
            <h2 className="text-sm font-medium text-[hsl(var(--c-text))] mb-3">Top series by processing power</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSeries} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(210 40% 90%)', fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(217 33% 16%)' }} />
                  <Bar dataKey="count" fill={ACCENT} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}