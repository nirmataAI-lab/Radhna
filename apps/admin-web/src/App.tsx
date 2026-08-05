import {
  LayoutDashboard, LogOut, TrendingUp, ChefHat, ListOrdered, UtensilsCrossed, Sun, Moon,
  BarChart3, Tag, BellRing, Star, ScrollText, ShieldCheck,
  Sparkles, Zap, ArrowRight, Search, Users, X, Sliders, Menu,
  Eye, EyeOff, Command
} from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { loginApi } from './api';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { CommandPalette } from './components/CommandPalette';
import { useCommandPaletteHotkey } from './hooks/useCommandPaletteHotkey';
import { InstallPWA } from 'ui-components';
import { useTranslation } from 'react-i18next';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const OrdersPage    = lazy(() => import('./pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const MenuPage      = lazy(() => import('./pages/MenuPage').then((m) => ({ default: m.MenuPage })));
const CouponsPage   = lazy(() => import('./pages/CouponsPage').then((m) => ({ default: m.CouponsPage })));
const ReviewsPage   = lazy(() => import('./pages/ReviewsPage').then((m) => ({ default: m.ReviewsPage })));
const CustomersPage = lazy(() => import('./pages/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const AuditPage     = lazy(() => import('./pages/AuditPage').then((m) => ({ default: m.AuditPage })));
const StaffPage     = lazy(() => import('./pages/StaffPage').then((m) => ({ default: m.StaffTab })));
const SettingsPage  = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));

type Tab = 'dashboard' | 'analytics' | 'orders' | 'menu' | 'coupons' | 'reviews' | 'customers' | 'audit' | 'staff' | 'settings';

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

/* ──────────────────────────────────────────────────────────
   LOGIN PAGE
────────────────────────────────────────────────────────── */
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
    setPassword('dev-password-123');
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-[var(--color-background)]">
      {/* Left branding panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-14 overflow-hidden"
        style={{ background: 'var(--gradient-sidebar)' }}>
        {/* Ambient orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,.6), transparent 70%)', transform: 'translate(-40%, -40%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,.5), transparent 70%)', transform: 'translate(30%, 30%)' }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <LayoutDashboard className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Cloud Kitchen OS</span>
        </div>

        <div className="relative z-10 space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 text-white/70 text-xs font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5 text-[#10b981]" /> Admin Console · v1.0
            </div>
            <h2 className="text-[3.25rem] font-bold text-white leading-[1.05] tracking-tight mb-5">
              Run your kitchen<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                like a machine.
              </span>
            </h2>
            <p className="text-white/55 text-base max-w-sm leading-relaxed">
              One dashboard for orders, menu, staff, analytics — built for teams that move fast.
            </p>
          </div>
          <ul className="space-y-5 max-w-sm">
            {[
              { icon: TrendingUp, title: 'Real-time analytics', desc: 'Revenue, orders and table occupancy at a glance.', color: '#10b981' },
              { icon: ChefHat, title: 'Kitchen sync', desc: 'Orders stream live to the KDS the moment they land.', color: '#f59e0b' },
              { icon: ShieldCheck, title: 'Role-based access', desc: 'Fine-grained permissions with full audit trail.', color: '#3b82f6' },
            ].map((f) => (
              <li key={f.title} className="flex gap-3.5 items-start">
                <div className="shrink-0 w-9 h-9 rounded-xl grid place-items-center mt-0.5"
                  style={{ background: `${f.color}22`, border: `1px solid ${f.color}33` }}>
                  <f.icon className="w-4 h-4" style={{ color: f.color }} />
                </div>
                <div>
                  <div className="font-semibold text-sm text-white/90">{f.title}</div>
                  <div className="text-xs text-white/45 mt-0.5">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-white/25">
          © {new Date().getFullYear()} Cloud Kitchen OS. All rights reserved.
        </div>
      </aside>

      {/* Right login form */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: 'var(--gradient-primary)' }}>
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[var(--color-foreground)]">Cloud Kitchen OS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)] mb-2">Welcome back</h1>
            <p className="text-[var(--color-muted-foreground)] text-sm">Sign in to your admin dashboard.</p>
          </div>

          {error && (
            <div role="alert" className="flex gap-2.5 items-start bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 p-3.5 rounded-xl mb-5 text-sm">
              <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-[var(--color-foreground)]">Email</label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@restaurant.com"
                required autoComplete="email" autoFocus
                className="input-premium"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[var(--color-foreground)]">Password</label>
              <div className="relative">
                <input
                  id="password" type={showPw ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  className="input-premium pr-10"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 grid place-items-center text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="gradient-button w-full py-2.5 rounded-xl mt-1 flex items-center justify-center gap-2 text-sm">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                : <>Sign in <ArrowRight className="w-4 h-4" /></>}
            </button>

            <InstallPWA variant="inline"
              className="w-full text-sm font-semibold py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-muted)] transition flex items-center justify-center gap-2" />

            <button type="button" onClick={fillDemo}
              className="w-full text-sm font-medium py-2 rounded-xl border border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-[var(--color-muted-foreground)] transition flex items-center justify-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Fill demo credentials
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   SIDEBAR
────────────────────────────────────────────────────────── */
function Sidebar({ tab, setTab, dark, toggleTheme, logout, newOrderCount, onNewOrdersClick, sidebarOpen, setSidebarOpen }: {
  tab: Tab; setTab: (t: Tab) => void;
  dark: boolean; toggleTheme: () => void; logout: () => void;
  newOrderCount: number; onNewOrdersClick: () => void;
  sidebarOpen: boolean; setSidebarOpen: (o: boolean) => void;
}) {
  const user = useAuthStore((s) => s.user);
  useTranslation(); // keep i18n context initialised

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { tab: 'dashboard' as Tab, icon: TrendingUp, label: 'Dashboard' },
        { tab: 'analytics' as Tab, icon: BarChart3, label: 'Analytics' },
      ],
    },
    {
      label: 'Operations',
      items: [
        { tab: 'orders' as Tab, icon: ListOrdered, label: 'Orders' },
        { tab: 'menu' as Tab, icon: UtensilsCrossed, label: 'Menu' },
        { tab: 'coupons' as Tab, icon: Tag, label: 'Coupons' },
      ],
    },
    {
      label: 'Management',
      items: [
        { tab: 'staff' as Tab, icon: Users, label: 'Staff' },
        { tab: 'customers' as Tab, icon: Users, label: 'Customers' },
        { tab: 'reviews' as Tab, icon: Star, label: 'Reviews' },
        { tab: 'audit' as Tab, icon: ScrollText, label: 'Audit Log' },
        { tab: 'settings' as Tab, icon: Sliders, label: 'Settings' },
      ],
    },
  ];

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col sidebar-dark
        transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
              style={{ background: 'var(--gradient-primary)' }}>
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-tight leading-tight">
              Cloud Kitchen<br />
              <span className="text-white/40 font-normal text-xs">Admin Console</span>
            </span>
          </div>
          <button className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/6 transition"
            onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New orders bell */}
        {newOrderCount > 0 && (
          <button onClick={() => { onNewOrdersClick(); setSidebarOpen(false); }}
            className="mx-3 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition animate-pulse-glow"
            style={{ background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', color: '#34d399' }}>
            <BellRing className="w-3.5 h-3.5 animate-pulse" />
            {newOrderCount} new order{newOrderCount !== 1 ? 's' : ''}
            <span className="ml-auto bg-[#10b981] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{newOrderCount}</span>
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25 px-2.5 mb-1.5">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ tab: tabItem, icon: Icon, label }) => (
                  <button key={tabItem}
                    onClick={() => { setTab(tabItem); setSidebarOpen(false); }}
                    className={`nav-item w-full ${tab === tabItem ? 'active' : ''}`}>
                    <Icon className="w-4 h-4 shrink-0 nav-icon" />
                    <span>{label}</span>
                    {tabItem === 'orders' && newOrderCount > 0 && (
                      <span className="ml-auto bg-[#10b981] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{newOrderCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom user section */}
        <div className="border-t border-white/6 p-3 space-y-1">
          <button onClick={toggleTheme}
            className="nav-item w-full">
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            <span>{dark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button onClick={logout}
            className="nav-item w-full !text-red-400 hover:!bg-red-500/10">
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
          <div className="px-3 py-2.5 mt-1 rounded-xl" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full grid place-items-center text-xs font-bold text-white shrink-0"
                style={{ background: 'var(--gradient-primary)' }}>
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white/80 text-xs font-semibold truncate">{user?.name || 'Admin'}</p>
                <p className="text-white/30 text-[10px] truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   NOTIFICATION TOAST
────────────────────────────────────────────────────────── */
function NotificationToast({ order, onClose, onView }: {
  order: { id: string; createdAt: string };
  onClose: () => void; onView: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast-premium">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: 'rgba(16,185,129,.15)' }}>
          <BellRing className="w-4.5 h-4.5 text-[var(--color-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-[var(--color-foreground)]">New Order!</p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 font-mono">
            #{order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={onView}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--gradient-primary)' }}>View</button>
          <button onClick={onClose}
            className="text-xs px-2 py-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] rounded-lg transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-3 h-0.5 rounded-full overflow-hidden bg-[var(--color-border)]">
        <div className="h-full bg-[var(--color-primary)] rounded-full"
          style={{ animation: 'shimmer 8s linear forwards', width: '100%', transformOrigin: 'left' }} />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   PAGE SHELL LOADER
────────────────────────────────────────────────────────── */
function PageShellLoader() {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="skeleton h-8 w-48 rounded-xl" />
      <div className="skeleton h-4 w-64 rounded-lg" />
      <div className="grid grid-cols-3 gap-4 mt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-64 rounded-xl mt-2" />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   MAIN APP
────────────────────────────────────────────────────────── */
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const tab = location.pathname === '/' ? 'dashboard' : location.pathname.substring(1) as Tab;
  const setTab = (t: Tab) => navigate(`/${t === 'dashboard' ? '' : t}`);

  const token = useAuthStore((state) => state.token);
  const { dark, toggle: toggleTheme } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const lastPollTimeRef = useRef(new Date().toISOString());
  const [toastOrder, setToastOrder] = useState<any | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const apiToken = useAuthStore((s) => s.token);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useCommandPaletteHotkey(paletteOpen, setPaletteOpen);

  useEffect(() => {
    if (!apiToken) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/orders/recent?since=${encodeURIComponent(lastPollTimeRef.current)}`, {
          headers: { Authorization: `Bearer ${apiToken}` },
        });
        if (res.ok) {
          const recentOrders = await res.json();
          lastPollTimeRef.current = new Date().toISOString();
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
                  osc.connect(gain); gain.connect(ctx.destination);
                  osc.frequency.value = 660; gain.gain.value = 0.12;
                  osc.start(); osc.stop(ctx.currentTime + 0.1);
                } catch {}
              }
              return [...fresh, ...prev].slice(0, 50);
            });
          }
        }
      } catch {}
    };
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, [API_URL, apiToken]);

  const dismissNewOrders = () => { setNewOrders([]); setToastOrder(null); };

  if (!token) return <Login />;

  // Get page title for top bar
  const pageTitles: Record<Tab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: "Today's overview" },
    analytics: { title: 'Analytics', subtitle: 'Revenue & performance insights' },
    orders: { title: 'Orders', subtitle: 'Manage incoming orders' },
    menu: { title: 'Menu', subtitle: 'Items, categories & pricing' },
    coupons: { title: 'Coupons', subtitle: 'Discounts & promotions' },
    reviews: { title: 'Reviews', subtitle: 'Customer feedback' },
    customers: { title: 'Customers', subtitle: 'Customer database' },
    audit: { title: 'Audit Log', subtitle: 'System activity trail' },
    staff: { title: 'Staff', subtitle: 'Team management' },
    settings: { title: 'Settings', subtitle: 'App configuration' },
  };

  const currentPage = pageTitles[tab] || pageTitles.dashboard;

  return (
    <div className="min-h-screen flex bg-[var(--color-background)]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Sidebar
        tab={tab} setTab={setTab} dark={dark} toggleTheme={toggleTheme} logout={logout}
        newOrderCount={newOrders.length}
        onNewOrdersClick={() => { setTab('orders'); dismissNewOrders(); setSidebarOpen(false); }}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-lg shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold text-base text-[var(--color-foreground)] leading-tight">{currentPage.title}</h2>
              <p className="text-xs text-[var(--color-muted-foreground)]">{currentPage.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Command palette trigger */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden md:flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] border border-[var(--color-border)] px-3 py-1.5 rounded-lg hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
              title="Command palette">
              <Search className="w-3.5 h-3.5" />
              <span>Search…</span>
              <kbd className="ml-1 text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] font-mono bg-[var(--color-muted)]">⌘K</kbd>
            </button>
            <button
              onClick={() => setPaletteOpen(true)}
              className="md:hidden p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] transition">
              <Command className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-8 max-w-[1400px] mx-auto animate-fade-in">
            <Suspense fallback={<PageShellLoader />}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/coupons" element={<CouponsPage />} />
                <Route path="/reviews" element={<ReviewsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </div>
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
