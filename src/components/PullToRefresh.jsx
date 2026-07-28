import { useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

// Native-style pull-to-refresh for touch devices. Wraps scrollable page
// content; pulling down at the top of the nearest scroll container triggers
// onRefresh with a smooth spinner. No-op on desktop (no touch events).
export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const wrapRef = useRef(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const scrollEl = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const THRESH = 64;

  const findScroll = () => {
    let el = wrapRef.current?.parentElement;
    while (el) {
      const s = window.getComputedStyle(el);
      if (el.scrollHeight > el.clientHeight && (s.overflowY === 'auto' || s.overflowY === 'scroll')) return el;
      el = el.parentElement;
    }
    return null;
  };

  const onTouchStart = (e) => {
    if (refreshing) return;
    scrollEl.current = findScroll();
    const top = scrollEl.current ? scrollEl.current.scrollTop : 0;
    if (top <= 0) { startY.current = e.touches[0].clientY; pulling.current = true; }
    else pulling.current = false;
  };
  const onTouchMove = (e) => {
    if (!pulling.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, 96));
  };
  const onTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull >= THRESH) {
      setRefreshing(true); setPull(THRESH);
      try { await onRefresh?.(); } finally { setRefreshing(false); setPull(0); }
    } else setPull(0);
  };

  const prog = Math.min(pull / THRESH, 1);

  return (
    <div ref={wrapRef} className={className} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div style={{ transform: `translateY(${pull}px)`, transition: pulling.current ? 'none' : 'transform 0.2s ease' }}>
        {children}
      </div>
      <div className="flex items-center justify-center text-[hsl(var(--c-accent))]" style={{ height: pull, marginTop: -pull, opacity: prog }}>
        {refreshing ? <Loader2 className="w-6 h-6 animate-spin" /> : pull > 8 ? <RefreshCw className="w-6 h-6" style={{ transform: `rotate(${pull * 4}deg)` }} /> : null}
      </div>
    </div>
  );
}