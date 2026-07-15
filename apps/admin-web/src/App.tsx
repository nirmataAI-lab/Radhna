import {
  LayoutDashboard, LogOut, TrendingUp, ChefHat, ListOrdered, UtensilsCrossed, Sun, Moon, 
  BarChart3, Tag, Bell, BellRing, Package, Star, ScrollText, Eye, EyeOff, ShieldCheck,
  Sparkles, Zap, ArrowRight, Search, Users, X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { loginApi } from './api';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { CommandPalette, useCommandPaletteHotkey } from './components/CommandPalette';
import { SUPPORTED_LANGS } from './lib/i18n';
import { LanguageSwitcher } from 'ui-components';
import { useTranslation } from 'react-i18next';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { OrdersPage } from './pages/OrdersPage';
import { MenuPage } from './pages/MenuPage';
import { CouponsPage } from './pages/CouponsPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { AuditPage } from './pages/AuditPage';
import { StaffTab as StaffPage } from './pages/StaffPage';

type Tab = 'dashboard' | 'analytics' | 'orders' | 'menu' | 'coupons' | 'inventory' | 'reviews' | 'audit' | 'staff';

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('admin-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('admin-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      setAuth(data.access_token, data.user, data.refresh_token);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@restaurant.com');
    setPassword('password123');
  };

  const features = [
    { icon: TrendingUp, title: 'Real-time analytics', desc: 'Revenue, orders and table occupancy at a glance.' },
    { icon: ChefHat, title: 'Kitchen sync', desc: 'Orders stream live to the KDS the moment they land.' },
    { icon: ShieldCheck, title: 'Role-based access', desc: 'Fine-grained permissions with full audit trail.' },
  ];

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-[var(--color-background)]">
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden text-white"
        style={{ background: 'var(--gradient-primary)' }}>
        <div className="absolute inset-0 opacity-40"
          style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25), transparent 45%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.25), transparent 55%)' }} />
        <div className="relative z-10 flex items-center gap-2 text-lg font-semibold tracking-tight">
          <LayoutDashboard className="w-6 h-6" />
          <span>Cloud Kitchen OS</span>
        </div>
        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Admin console
            </div>
            <h2 className="font-display text-5xl leading-[1.05] mb-4">
              Run your kitchen<br />like a well-oiled<br />machine.
            </h2>
            <p className="text-white/80 max-w-md">
              One dashboard for orders, menu, inventory, tables and analytics — built for teams that ship food fast.
            </p>
          </div>
          <ul className="space-y-4 max-w-md">
            {features.map((f) => (
              <li key={f.title} className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-white/15 backdrop-blur-md grid place-items-center">
                  <f.icon className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{f.title}</div>
                  <div className="text-xs text-white/75">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 text-xs text-white/70">
          © {new Date().getFullYear()} Cloud Kitchen OS · v1.0
        </div>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <LayoutDashboard className="w-6 h-6 text-[var(--color-primary)]" />
            <span className="font-semibold">Cloud Kitchen OS</span>
          </div>
          <h1 className="font-display text-4xl mb-2">Welcome back</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-8">
            Sign in to your admin dashboard to continue.
          </p>

          {error && (
            <div role="alert" className="flex gap-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4 text-sm border border-red-200 dark:border-red-900">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@restaurant.com" required autoComplete="email" autoFocus
                className="w-full px-3.5 py-2.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
              </div>
              <div className="relative">
                <input id="password" type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pr-10 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition" />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 grid place-items-center text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="gradient-button w-full font-semibold py-2.5 rounded-lg mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Signing in…' : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>

            <button type="button" onClick={fillDemo}
              className="w-full text-sm font-medium py-2 rounded-lg border border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition flex items-center justify-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Fill demo credentials
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function Sidebar({ tab, setTab, dark, toggleTheme, logout, newOrderCount, onNewOrdersClick }: {
  tab: Tab; setTab: (t: Tab) => void;
  dark: boolean; toggleTheme: () => void; logout: () => void;
  newOrderCount: number; onNewOrdersClick: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  
  const items: { tab: Tab; icon: any; label: string }[] = [
    { tab: 'dashboard', icon: TrendingUp, label: t('nav.dashboard') },
    { tab: 'analytics', icon: BarChart3, label: t('nav.analytics') },
    { tab: 'orders', icon: ListOrdered, label: t('nav.orders') },
    { tab: 'menu', icon: UtensilsCrossed, label: t('nav.menu') },
    { tab: 'inventory', icon: Package, label: t('nav.inventory') },
    { tab: 'coupons', icon: Tag, label: t('nav.coupons') },
    { tab: 'reviews', icon: Star, label: t('nav.reviews') },
    { tab: 'audit', icon: ScrollText, label: t('nav.audit') },
    { tab: 'staff', icon: Users, label: t('nav.staff') },
  ];

  return (
    <aside className="w-64 bg-[var(--color-card)] border-r border-[var(--color-border)] p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-8">
        <LayoutDashboard className="w-6 h-6 text-[var(--color-primary)]" />
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-primary)]">{t('app.title')}</h1>
      </div>
      <nav className="flex flex-col gap-1 text-sm font-medium flex-1">
        {items.map(({ tab: t, icon: Icon, label }) => (
          <button key={t} onClick={() => setTab(t)}
            className={`p-3 rounded-lg text-left transition-colors flex items-center gap-2 ${
              tab === t ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </nav>
      <button
        onClick={onNewOrdersClick}
        className="flex items-center gap-2 px-3 py-2.5 mb-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--color-muted)] relative"
      >
        {newOrderCount > 0 ? (
          <><BellRing className="w-4 h-4 text-[var(--color-primary)] animate-pulse" />
            <span className="text-[var(--color-primary)]">{t('sidebar.newOrders')}</span>
            <span className="ml-auto bg-[var(--color-primary)] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
              {newOrderCount}
            </span>
          </>
        ) : (
          <><Bell className="w-4 h-4 text-[var(--color-muted-foreground)]" />
            <span className="text-[var(--color-muted-foreground)]">{t('sidebar.noNewOrders')}</span>
          </>
        )}
      </button>
      <div className="mb-4 p-3 bg-[var(--color-muted)] rounded-lg text-xs text-[var(--color-muted-foreground)]">
        <p className="font-medium text-[var(--color-foreground)] mb-1">{user?.name || 'Admin'}</p>
        <p>{user?.email}</p>
      </div>
      <div className="flex gap-2 mb-2 items-center">
        <button onClick={toggleTheme}
          className="flex-1 p-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)] transition-colors flex items-center justify-center gap-1">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {dark ? t('sidebar.light') : t('sidebar.dark')}
        </button>
        <LanguageSwitcher supportedLangs={SUPPORTED_LANGS} />
      </div>
      <button onClick={logout}
        className="flex items-center gap-2 text-sm font-medium text-red-500 p-3 hover:bg-red-50 rounded-lg transition-colors">
        <LogOut className="w-4 h-4" /> {t('sidebar.logout')}
      </button>
    </aside>
  );
}

function NotificationToast({ order, onClose, onView }: {
  order: { id: string; createdAt: string };
  onClose: () => void; onView: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up max-w-sm w-full bg-[var(--color-card)] p-4 rounded-xl shadow-xl border-l-4 border-[var(--color-primary)]">
      <div className="flex items-start gap-3">
        <div className="bg-[var(--color-primary)]/10 p-2 rounded-full flex-shrink-0">
          <BellRing className="w-5 h-5 text-[var(--color-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">New Order Received!</p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs font-mono text-[var(--color-muted-foreground)] mt-0.5">
            #{order.id.slice(0, 8)}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onView} className="text-xs px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:opacity-90">
            View
          </button>
          <button onClick={onClose} className="text-xs px-2 py-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] rounded-lg">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const tab = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1) as Tab;
  const setTab = (t: Tab) => navigate(`/${t === 'dashboard' ? '' : t}`);
  
  const token = useAuthStore((state) => state.token);
  const { dark, toggle: toggleTheme } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [lastPollTime, setLastPollTime] = useState(() => new Date().toISOString());
  const [toastOrder, setToastOrder] = useState<any | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const apiToken = useAuthStore((s) => s.token);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useCommandPaletteHotkey(paletteOpen, setPaletteOpen);

  useEffect(() => {
    if (!apiToken) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/orders/recent?since=${encodeURIComponent(lastPollTime)}`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        });
        if (res.ok) {
          const recentOrders = await res.json();
          if (recentOrders.length > 0) {
            setNewOrders((prev) => {
              const existingIds = new Set(prev.map((o: any) => o.id));
              const fresh = recentOrders.filter((o: any) => !existingIds.has(o.id));
              if (fresh.length > 0) {
                setToastOrder(fresh[0]);
                try {
                  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.frequency.value = 660;
                  gain.gain.value = 0.15;
                  osc.start();
                  osc.stop(ctx.currentTime + 0.1);
                } catch {}
              }
              return [...fresh, ...prev].slice(0, 50);
            });
          }
          setLastPollTime(new Date().toISOString());
        }
      } catch {}
    };

    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [apiToken, lastPollTime]);

  const dismissNewOrders = () => {
    setNewOrders([]);
    setToastOrder(null);
  };

  if (!token) return <Login />;

  return (
    <div className="min-h-screen flex bg-[var(--color-background)]">
      <Sidebar
        tab={tab} setTab={setTab} dark={dark} toggleTheme={toggleTheme} logout={logout}
        newOrderCount={newOrders.length} onNewOrdersClick={() => { setTab('orders'); dismissNewOrders(); }}
      />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
            title="Command palette"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search commands…</span>
            <kbd className="ml-2 text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)]">⌘K</kbd>
          </button>
        </div>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        setTab={(t) => setTab(t as Tab)}
        toggleTheme={toggleTheme}
        dark={dark}
        logout={logout}
      />

      {toastOrder && (
        <NotificationToast
          order={toastOrder}
          onClose={() => setToastOrder(null)}
          onView={() => { setTab('orders'); dismissNewOrders(); }}
        />
      )}
    </div>
  );
}
