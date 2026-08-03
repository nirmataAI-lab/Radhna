import { useEffect, useMemo, useState } from 'react';
import {
  Search, TrendingUp, ListOrdered, UtensilsCrossed, Tag, Star, ScrollText,
  Package, BarChart3, Sun, Moon, LogOut, Command as CmdIcon, Users,
} from 'lucide-react';

export type PaletteTab =
  | 'dashboard' | 'analytics' | 'orders' | 'menu'
  | 'inventory' | 'coupons' | 'reviews' | 'audit' | 'staff';

interface Action {
  id: string;
  label: string;
  hint?: string;
  icon: any;
  keywords?: string;
  run: () => void;
}

export function CommandPalette({
  open, onClose, setTab, toggleTheme, dark, logout,
}: {
  open: boolean;
  onClose: () => void;
  setTab: (t: PaletteTab) => void;
  toggleTheme: () => void;
  dark: boolean;
  logout: () => void;
}) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  const actions: Action[] = useMemo(() => [
    { id: 'go:dashboard', label: 'Go to Dashboard', icon: TrendingUp, keywords: 'home overview', run: () => setTab('dashboard') },
    { id: 'go:analytics', label: 'Go to Analytics', icon: BarChart3, keywords: 'reports charts revenue', run: () => setTab('analytics') },
    { id: 'go:orders', label: 'Go to Orders', icon: ListOrdered, keywords: 'kds tickets', run: () => setTab('orders') },
    { id: 'go:menu', label: 'Go to Menu', icon: UtensilsCrossed, keywords: 'items food categories', run: () => setTab('menu') },
    { id: 'go:inventory', label: 'Go to Inventory', icon: Package, keywords: 'stock supplies', run: () => setTab('inventory') },
    { id: 'go:coupons', label: 'Go to Coupons', icon: Tag, keywords: 'promo discount', run: () => setTab('coupons') },
    { id: 'go:reviews', label: 'Go to Reviews', icon: Star, keywords: 'ratings feedback', run: () => setTab('reviews') },
    { id: 'go:audit', label: 'Go to Audit Log', icon: ScrollText, keywords: 'history activity', run: () => setTab('audit') },
    { id: 'go:staff', label: 'Go to Staff', icon: Users, keywords: 'users team admins chefs', run: () => setTab('staff') },
    { id: 'act:theme', label: dark ? 'Switch to Light Mode' : 'Switch to Dark Mode', icon: dark ? Sun : Moon, keywords: 'theme appearance', run: toggleTheme },
    { id: 'act:logout', label: 'Log Out', icon: LogOut, keywords: 'signout exit', run: logout },
  ], [setTab, toggleTheme, dark, logout]);

  const filtered = useMemo(() => {
    if (!q.trim()) return actions;
    const needle = q.toLowerCase();
    return actions.filter((a) =>
      a.label.toLowerCase().includes(needle) ||
      (a.keywords ?? '').toLowerCase().includes(needle),
    );
  }, [q, actions]);

  useEffect(() => { setActive(0); }, [q, open]);
  useEffect(() => { if (!open) setQ(''); }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter') {
        e.preventDefault();
        const a = filtered[active];
        if (a) { a.run(); onClose(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, active, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[15vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[var(--color-card)] border border-[var(--color-border)] shadow-2xl overflow-hidden"
        onClick={(e: any) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <Search className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          <input
            autoFocus
            value={q}
            onChange={(e: any) => setQ(e.target.value)}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--color-muted-foreground)]"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-muted-foreground)]">ESC</kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              No matches for "{q}"
            </li>
          ) : filtered.map((a, i) => {
            const Icon = a.icon;
            return (
              <li key={a.id}>
                <button
                  onClick={() => { a.run(); onClose(); }}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    i === active
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1">{a.label}</span>
                  {i === active && (
                    <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-muted-foreground)]">↵</kbd>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border)] text-[11px] text-[var(--color-muted-foreground)]">
          <span className="flex items-center gap-1"><CmdIcon className="w-3 h-3" /> K to toggle</span>
          <span>↑ ↓ to navigate · ↵ to run</span>
        </div>
      </div>
    </div>
  );
}
