import {
  LayoutDashboard, RefreshCcw, LogOut, IndianRupee, ShoppingBag,
  TrendingUp, ChefHat, ListOrdered, UtensilsCrossed, Sun, Moon, Plus,
  Edit3, Trash2, X, Loader2, BarChart3, Tag, Calendar, Percent,
  Bell, BellRing, Package, Star, ScrollText, Eye, EyeOff, ShieldCheck,
  Sparkles, Zap, ArrowRight, Clock,
} from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  fetchOverviewStats, loginApi, fetchAllOrders, updateOrderStatus,
  fetchCategories, createCategory, updateCategory, deleteCategory,
  fetchAllFoodItems, createFoodItem, updateFoodItem, deleteFoodItem,
  fetchAnalytics,
  fetchCoupons, createCoupon, deleteCoupon,
} from './api';
import type { Category, FoodItem, Order, AnalyticsData, Coupon } from './api';
import { AlertTriangle, PackageOpen } from 'lucide-react';
import { useAuthStore } from './authStore';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { InventoryTab, ReviewsTab, AuditTab } from './newTabs';

type Tab = 'dashboard' | 'analytics' | 'orders' | 'menu' | 'coupons' | 'inventory' | 'reviews' | 'audit';


const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// ─── Theme Context ──────────────────────────────────

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

// ─── Login ──────────────────────────────────────────

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
      setAuth(data.access_token, data.user);
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
      {/* Brand rail */}
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

      {/* Form */}
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
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
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
                <button type="button" className="text-xs text-[var(--color-primary)] hover:underline">Forgot?</button>
              </div>
              <div className="relative">
                <input id="password" type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pr-10 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] transition" />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 px-3 grid place-items-center text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="gradient-button w-full font-semibold py-2.5 rounded-lg mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <button type="button" onClick={fillDemo}
              className="w-full text-sm font-medium py-2 rounded-lg border border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition flex items-center justify-center gap-2">
              <Zap className="w-3.5 h-3.5" /> Fill demo credentials
            </button>
          </form>

          <p className="text-xs text-[var(--color-muted-foreground)] mt-8 text-center">
            Protected by role-based access control · Audit-logged
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────

function Sidebar({ tab, setTab, dark, toggleTheme, logout, newOrderCount, onNewOrdersClick }: {
  tab: Tab; setTab: (t: Tab) => void;
  dark: boolean; toggleTheme: () => void; logout: () => void;
  newOrderCount: number; onNewOrdersClick: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const items: { tab: Tab; icon: any; label: string }[] = [
    { tab: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
    { tab: 'analytics', icon: BarChart3, label: 'Analytics' },
    { tab: 'orders', icon: ListOrdered, label: 'Orders' },
    { tab: 'menu', icon: UtensilsCrossed, label: 'Menu' },
    { tab: 'inventory', icon: Package, label: 'Inventory' },
    
    { tab: 'coupons', icon: Tag, label: 'Coupons' },
    { tab: 'reviews', icon: Star, label: 'Reviews' },
    { tab: 'audit', icon: ScrollText, label: 'Audit Log' },
  ];

  return (
    <aside className="w-64 bg-[var(--color-card)] border-r border-[var(--color-border)] p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-8">
        <LayoutDashboard className="w-6 h-6 text-[var(--color-primary)]" />
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-primary)]">Admin Panel</h1>
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
      {/* Notification Bell */}
      <button
        onClick={onNewOrdersClick}
        className="flex items-center gap-2 px-3 py-2.5 mb-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--color-muted)] relative"
      >
        {newOrderCount > 0 ? (
          <><BellRing className="w-4 h-4 text-[var(--color-primary)] animate-pulse" />
            <span className="text-[var(--color-primary)]">New Orders</span>
            <span className="ml-auto bg-[var(--color-primary)] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
              {newOrderCount}
            </span>
          </>
        ) : (
          <><Bell className="w-4 h-4 text-[var(--color-muted-foreground)]" />
            <span className="text-[var(--color-muted-foreground)]">No new orders</span>
          </>
        )}
      </button>
      <div className="mb-4 p-3 bg-[var(--color-muted)] rounded-lg text-xs text-[var(--color-muted-foreground)]">
        <p className="font-medium text-[var(--color-foreground)] mb-1">{user?.name || 'Admin'}</p>
        <p>{user?.email}</p>
      </div>
      <div className="flex gap-2 mb-2">
        <button onClick={toggleTheme}
          className="flex-1 p-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)] transition-colors flex items-center justify-center gap-1">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} {dark ? 'Light' : 'Dark'}
        </button>
      </div>
      <button onClick={logout}
        className="flex items-center gap-2 text-sm font-medium text-red-500 p-3 hover:bg-red-50 rounded-lg transition-colors">
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </aside>
  );
}

// ─── Status Colors ──────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  ACCEPTED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  PREPARING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  READY: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  CANCELLED: 'bg-red-50 text-red-500 line-through dark:bg-red-900/20',
};

// ─── Dashboard Tab ──────────────────────────────────

function DashboardTab() {
  const [stats, setStats] = useState({ revenue: 0, totalOrders: 0, activeOrders: 0 });
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, items] = await Promise.all([
        fetchOverviewStats(),
        fetchAllFoodItems(),
      ]);
      setStats(statsData);
      setFoodItems(items);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, [load]);

  const lowStockItems = foodItems.filter(
    (item) => item.productionStock && item.productionStock.availableQty <= 5 && item.isEnabled
  );
  const outOfStockItems = foodItems.filter(
    (item) => item.productionStock && item.productionStock.availableQty <= 0
  );

  const cards = [
    { label: "Today's Revenue", value: `₹${stats.revenue.toFixed(2)}`, icon: IndianRupee, color: 'bg-green-50 text-green-600 dark:bg-green-900/30' },
    { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingBag, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' },
    { label: 'Active Orders', value: stats.activeOrders.toString(), icon: Clock, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30' },
  ];

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div><h2 className="text-3xl font-bold">Dashboard</h2><p className="text-[var(--color-muted-foreground)] text-sm mt-1">Today's business overview</p></div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 text-sm font-bold bg-white dark:bg-[var(--color-card)] border border-[var(--color-border)] px-4 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="premium-card p-6">
            <div className={`p-2 rounded-lg w-fit ${c.color} mb-4`}><c.icon className="w-5 h-5" /></div>
            <p className="text-[var(--color-muted-foreground)] font-medium text-sm mb-1">{c.label}</p>
            <p className="text-3xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="premium-card p-6 mb-8 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-lg">Stock Alerts</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {outOfStockItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                <PackageOpen className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-xs ml-auto font-bold">OUT OF STOCK</span>
              </div>
            ))}
            {lowStockItems.filter(i => i.productionStock && i.productionStock.availableQty > 0).slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-xs ml-auto font-bold">Stock: {item.productionStock?.availableQty}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics Tab ──────────────────────────────────

function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await fetchAnalytics(days)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div><h2 className="text-3xl font-bold">Analytics</h2><p className="text-[var(--color-muted-foreground)] text-sm mt-1">Business performance overview</p></div>
        <div className="flex items-center gap-3">
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))}
            className="text-sm border border-[var(--color-border)] px-3 py-2 rounded-lg bg-[var(--color-card)]">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 text-sm border border-[var(--color-border)] px-3 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 mx-auto animate-spin" /></div>
      ) : !data ? (
        <div className="text-center py-16 text-[var(--color-muted-foreground)]">No data available</div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top-level KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="premium-card p-5">
              <p className="text-sm text-[var(--color-muted-foreground)] mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">₹{data.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="premium-card p-5">
              <p className="text-sm text-[var(--color-muted-foreground)] mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-blue-600">{data.totalOrders}</p>
            </div>
            <div className="premium-card p-5">
              <p className="text-sm text-[var(--color-muted-foreground)] mb-1">Avg. Order Value</p>
              <p className="text-3xl font-bold text-purple-600">₹{data.averageOrderValue.toFixed(2)}</p>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="premium-card p-5">
            <h3 className="font-bold mb-4">Revenue Trend</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Popular Items & Peak Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="premium-card p-5">
              <h3 className="font-bold mb-4">Most Popular Items</h3>
              <div className="space-y-3">
                {data.popularItems.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">{item.name}</span>
                        <span className="font-bold text-[var(--color-primary)]">{item.count}x</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div className="bg-primary rounded-full h-1.5 transition-all"
                          style={{ width: `${Math.min(100, (item.count / Math.max(...data.popularItems.map(i => i.count))) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card p-5">
              <h3 className="font-bold mb-4">Peak Hours</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => [Number(value), 'Orders']} />
                    <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="premium-card p-5">
            <h3 className="font-bold mb-4">Payment Status Breakdown</h3>
            <div className="flex flex-wrap gap-4">
              {data.paymentBreakdown.map((item, idx) => (
                <div key={item.status} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="text-sm font-medium">{item.status}</span>
                  <span className="text-sm font-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coupon / Discount Analytics */}
          {data.discountStats && (
            <div className="premium-card p-5">
              <h3 className="font-bold mb-4">📊 Discount &amp; Coupon Stats</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-xs text-[var(--color-muted-foreground)] mb-1">Total Discount Given</p>
                  <p className="text-xl font-bold text-blue-600">₹{data.discountStats.totalDiscountGiven.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p className="text-xs text-[var(--color-muted-foreground)] mb-1">Orders with Discount</p>
                  <p className="text-xl font-bold text-green-600">{data.discountStats.discountOrderCount}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-xs text-[var(--color-muted-foreground)] mb-1">% Orders Discounted</p>
                  <p className="text-xl font-bold text-purple-600">{data.discountStats.discountPercentage}%</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-xs text-[var(--color-muted-foreground)] mb-1">Avg Discount/Order</p>
                  <p className="text-xl font-bold text-amber-600">₹{data.discountStats.averageDiscountPerOrder.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Orders Tab ─────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setOrders(await fetchAllOrders(statusFilter || undefined)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div><h2 className="text-3xl font-bold">Orders Management</h2><p className="text-[var(--color-muted-foreground)] text-sm mt-1">View and manage all orders</p></div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-[var(--color-border)] px-3 py-2 rounded-lg bg-[var(--color-card)]">
            <option value="">All Statuses</option>
            <option value="PLACED">Placed</option><option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option>
          </select>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 text-sm border border-[var(--color-border)] px-3 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>
      <div className="premium-card overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-muted-foreground)]">
            <ListOrdered className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]">
                  <th className="text-left p-3 font-semibold">Order</th>
                  <th className="text-left p-3 font-semibold">Customer</th>
                  <th className="text-left p-3 font-semibold">Items</th>
                  <th className="text-left p-3 font-semibold">Total</th>
                  <th className="text-left p-3 font-semibold">Payment</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Time</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors">
                    <td className="p-3 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="p-3">{order.customer?.name || order.customer?.email || '—'}</td>
                    <td className="p-3">{order.orderItems?.length || 0} items</td>
                    <td className="p-3 font-medium">₹{Number(order.total).toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{order.paymentStatus}</span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || ''}`}>{order.status}</span>
                    </td>
                    <td className="p-3 text-[var(--color-muted-foreground)]">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {(order.status === 'PLACED') && (
                          <button onClick={() => updateOrderStatus(order.id, 'PREPARING').then(load)}
                            className="p-1.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors" title="Start Preparing">
                            <ChefHat className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                          <button onClick={() => updateOrderStatus(order.id, 'CANCELLED').then(load)}
                            className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors" title="Cancel">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Menu Tab ───────────────────────────────────────

function MenuTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | null>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [c, f] = await Promise.all([fetchCategories(), fetchAllFoodItems()]); setCategories(c); setFoodItems(f); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this food item?')) return;
    await deleteFoodItem(id);
    load();
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm('Delete this category? Items must be removed first.')) return;
    try { await deleteCategory(id); load(); }
    catch (e: any) { alert(e.message); }
  };

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div><h2 className="text-3xl font-bold">Menu Management</h2><p className="text-[var(--color-muted-foreground)] text-sm mt-1">Add, edit, and manage menu items</p></div>
        <div className="flex gap-2">
          <button onClick={() => { setShowAddCat(true); setEditCat(null); }}
            className="flex items-center gap-2 text-sm font-bold bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Category
          </button>
          <button onClick={() => { setShowAddItem(true); setEditItem(null); }}
            className="flex items-center gap-2 text-sm font-bold bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Food Item
          </button>
        </div>
      </header>
      {(showAddCat || editCat) && (
        <CategoryFormModal category={editCat} onClose={() => { setShowAddCat(false); setEditCat(null); }}
          onSaved={() => { setShowAddCat(false); setEditCat(null); load(); }} />
      )}
      {(showAddItem || editItem) && (
        <FoodItemFormModal item={editItem} categories={categories} onClose={() => { setShowAddItem(false); setEditItem(null); }}
          onSaved={() => { setShowAddItem(false); setEditItem(null); load(); }} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-1 premium-card p-4 h-fit">
          <h3 className="font-bold mb-3 pb-2 border-b border-[var(--color-border)]">Categories</h3>
          <div className="flex flex-col gap-1">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--color-muted)] group">
                <span className="text-sm font-medium">{cat.name}</span>
                <div className="hidden group-hover:flex gap-1">
                  <button onClick={() => setEditCat(cat)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit3 className="w-3 h-3" /></button>
                  <button onClick={() => handleDeleteCat(cat.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4">
          {loading ? (
            <div className="text-center py-12 text-[var(--color-muted-foreground)]"><Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />Loading...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {foodItems.map((item) => (
                <div key={item.id} className={`premium-card p-4 ${!item.isEnabled ? 'opacity-50' : ''} animate-fade-in`}>
                  <div className="flex justify-between items-start mb-2">
                    <div><h4 className="font-semibold text-sm">{item.name}</h4><p className="text-xs text-[var(--color-muted-foreground)]">{item.category?.name}</p></div>
                    <span className="font-bold text-[var(--color-primary)]">₹{Number(item.price).toFixed(2)}</span>
                  </div>
                  {item.description && <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2 mb-2">{item.description}</p>}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.isVeg && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">Veg</span>}
                    {!item.isVeg && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">Non-Veg</span>}
                    {item.isPopular && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">Popular</span>}
                    {item.isTodaysSpecial && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Special</span>}
                    {!item.isEnabled && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">Disabled</span>}
                    {item.productionStock && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Stock: {item.productionStock.availableQty}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditItem(item)}
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors flex items-center justify-center gap-1">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {foodItems.length === 0 && (
                <div className="col-span-full text-center py-12 text-[var(--color-muted-foreground)]">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No menu items yet. Add your first item!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Category Form Modal ────────────────────────────

function CategoryFormModal({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(category?.name || '');
  const [order, setOrder] = useState(category?.displayOrder?.toString() || '0');
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (category) await updateCategory(category.id, { name: name.trim(), displayOrder: parseInt(order) || 0 });
      else await createCategory({ name: name.trim(), displayOrder: parseInt(order) || 0 });
      onSaved();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--color-card)] p-6 rounded-xl shadow-xl w-full max-w-sm m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">{category ? 'Edit Category' : 'Add Category'}</h3>
        <div className="flex flex-col gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="w-full p-2 border border-[var(--color-border)] rounded-lg" />
          <input value={order} onChange={(e) => setOrder(e.target.value)} placeholder="Display order" type="number" className="w-full p-2 border border-[var(--color-border)] rounded-lg" />
          <div className="flex gap-2 mt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)] transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !name.trim()}
              className="flex-1 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {category ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Food Item Form Modal ───────────────────────────

function FoodItemFormModal({ item, categories, onClose, onSaved }: {
  item: FoodItem | null; categories: Category[]; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [description, setDescription] = useState(item?.description || '');
  const [categoryId, setCategoryId] = useState(item?.categoryId || categories[0]?.id || '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [stock, setStock] = useState(item?.productionStock?.availableQty?.toString() || '0');
  const [isVeg, setIsVeg] = useState(item?.isVeg ?? true);
  const [isPopular, setIsPopular] = useState(item?.isPopular ?? false);
  const [isSpecial, setIsSpecial] = useState(item?.isTodaysSpecial ?? false);
  const [isEnabled, setIsEnabled] = useState(item?.isEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!name.trim() || !price || !categoryId) return;
    setSaving(true);
    try {
      const data = { name: name.trim(), price: parseFloat(price), categoryId, description: description || undefined, imageUrl: imageUrl || undefined, isVeg, isPopular, isTodaysSpecial: isSpecial, isEnabled, stock: parseInt(stock) || 0 };
      if (item) await updateFoodItem(item.id, data); else await createFoodItem(data);
      onSaved();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };
  const inputClass = "w-full p-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50";
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--color-card)] p-6 rounded-xl shadow-xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">{item ? 'Edit Food Item' : 'Add Food Item'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="text-xs font-medium mb-1 block">Name *</label><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></div>
          <div><label className="text-xs font-medium mb-1 block">Price *</label><input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" className={inputClass} /></div>
          <div><label className="text-xs font-medium mb-1 block">Category *</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="col-span-2"><label className="text-xs font-medium mb-1 block">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} /></div>
          <div className="col-span-2"><label className="text-xs font-medium mb-1 block">Image URL</label><input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputClass} /></div>
          <div><label className="text-xs font-medium mb-1 block">Stock</label><input value={stock} onChange={(e) => setStock(e.target.value)} type="number" className={inputClass} /></div>
          <div className="flex flex-col gap-2 justify-end pb-1">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isVeg} onChange={(e) => setIsVeg(e.target.checked)} /> Veg</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} /> Popular</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isSpecial} onChange={(e) => setIsSpecial(e.target.checked)} /> Today's Special</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} /> Enabled</label>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)] transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim() || !price || !categoryId}
            className="flex-1 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {item ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tables Tab (with QR Code Generator) ────────────

function TablesTab() {
  const [tables, setTables] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [qrGeneratorTable, setQrGeneratorTable] = useState<TableType | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTables(await fetchTables()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this table?')) return;
    await deleteTable(id);
    load();
  };

  const CUSTOMER_URL = import.meta.env.VITE_CUSTOMER_URL || 'http://localhost:3001';

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div><h2 className="text-3xl font-bold">Tables Management</h2><p className="text-[var(--color-muted-foreground)] text-sm mt-1">Manage restaurant tables and print QR codes</p></div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-sm font-bold bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Table
        </button>
      </header>

      {showAdd && (
        <TableFormModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />
      )}

      {qrGeneratorTable && (
        <QRCodeModal table={qrGeneratorTable} customerUrl={CUSTOMER_URL} onClose={() => setQrGeneratorTable(null)} />
      )}

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((t) => {
            const menuUrl = `${CUSTOMER_URL}/menu?table=${t.tableNumber}`;
            return (
              <div key={t.id} className="premium-card p-5 text-center animate-fade-in">
                <div className="text-3xl font-bold text-[var(--color-primary)] mb-1">{t.tableNumber}</div>
                <p className="text-sm text-[var(--color-muted-foreground)] mb-3">Capacity: {t.capacity} people</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button onClick={() => setQrGeneratorTable(t)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> Print QR
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(menuUrl); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                    Copy Link
                  </button>
                  <button onClick={() => handleDelete(t.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {t._count && <p className="text-xs text-[var(--color-muted-foreground)] mt-2">{t._count.orders} orders</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── QR Code Generator Modal ────────────────────────

function QRCodeModal({ table, customerUrl, onClose }: { table: TableType; customerUrl: string; onClose: () => void }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrDataUrl = useRef<string | null>(null);
  const menuUrl = `${customerUrl}/menu?table=${table.tableNumber}`;

  useEffect(() => {
    (async () => {
      try {
        const QRCode = (await import('qrcode')).default;
        if (qrRef.current) {
          const canvas = document.createElement('canvas');
          await QRCode.toCanvas(canvas, menuUrl, {
            width: 200,
            margin: 2,
            color: { dark: '#1e293b', light: '#ffffff' },
          });
          qrRef.current.innerHTML = '';
          qrRef.current.appendChild(canvas);
          qrDataUrl.current = canvas.toDataURL();
        }
      } catch {
        const img = document.createElement('img');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(menuUrl)}`;
        img.alt = `QR for ${table.tableNumber}`;
        img.className = 'mx-auto';
        qrDataUrl.current = img.src;
        if (qrRef.current) {
          qrRef.current.innerHTML = '';
          qrRef.current.appendChild(img);
        }
      }
    })();
  }, [menuUrl, table.tableNumber]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
        if (!qrDataUrl.current) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>QR Code — ${table.tableNumber}</title>
      <style>
        body { font-family: Arial; text-align: center; padding: 40px; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        .sub { color: #666; margin-bottom: 24px; font-size: 14px; }
        .qr-wrap { margin: 20px 0; }
        .url { color: #10b981; font-size: 12px; word-break: break-all; margin-top: 12px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <h1>📋 ${table.tableNumber}</h1>
        <p class="sub">Scan to view menu &amp; order</p>
        <div class="qr-wrap"><img src="${qrDataUrl.current}" style="width: 250px; height: 250px;" /></div>
        <p class="url">${menuUrl}</p>
        <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--color-card)] p-6 rounded-xl shadow-xl w-full max-w-sm m-4 text-center" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-1">QR Code — {table.tableNumber}</h3>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-4">Customers scan to order from their table</p>
        <div ref={qrRef} className="flex justify-center mb-4" style={{ minHeight: 200 }}>
          <div className="animate-pulse bg-muted rounded-lg" style={{ width: 200, height: 200 }} />
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] mb-4 break-all">{menuUrl}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)] transition-colors">Close</button>
          <button onClick={handlePrint}
            className="flex-1 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center justify-center gap-2 shadow-md">
            🖨️ Print
          </button>
        </div>
      </div>
    </div>
  );
}

function TableFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!number.trim()) return;
    setSaving(true);
    try { await createTable({ tableNumber: number.trim(), capacity: parseInt(capacity) || 4 }); onSaved(); }
    catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--color-card)] p-6 rounded-xl shadow-xl w-full max-w-sm m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">Add Table</h3>
        <div className="flex flex-col gap-3">
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g. T6" className="w-full p-2 border border-[var(--color-border)] rounded-lg" />
          <input value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Capacity" type="number" className="w-full p-2 border border-[var(--color-border)] rounded-lg" />
          <div className="flex gap-2 mt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg">Cancel</button>
            <button onClick={handleSave} disabled={saving || !number.trim()}
              className="flex-1 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Coupons Tab ────────────────────────────────────

function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCoupons(await fetchCoupons()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await deleteCoupon(id);
    load();
  };

  const now = new Date();

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div><h2 className="text-3xl font-bold">Coupons Management</h2><p className="text-[var(--color-muted-foreground)] text-sm mt-1">Create and manage discount coupons</p></div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-sm font-bold bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </header>

      {showAdd && (
        <CouponFormModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />
      )}

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 mx-auto animate-spin" /></div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 premium-card">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30 text-[var(--color-muted-foreground)]" />
          <p className="text-lg font-medium">No coupons created yet</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Create your first coupon to offer discounts!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => {
            const validFrom = new Date(coupon.validFrom);
            const validTo = new Date(coupon.validTo);
            const isActive = now >= validFrom && now <= validTo;
            const isExpired = now > validTo;
            const usageLeft = coupon.usageLimit ? coupon.usageLimit - coupon.usageCount : null;

            return (
              <div key={coupon.id} className={`premium-card p-5 animate-fade-in ${
                isExpired ? 'opacity-50' : ''
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Percent className="w-5 h-5 text-[var(--color-primary)]" />
                    <span className="font-bold text-lg tracking-wide">{coupon.code}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    isActive ? 'bg-green-100 text-green-700' :
                    isExpired ? 'bg-red-100 text-red-500' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {isActive ? 'Active' : isExpired ? 'Expired' : 'Scheduled'}
                  </span>
                </div>

                <div className="text-2xl font-bold mb-2">
                  {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}%` : `₹${Number(coupon.value).toFixed(2)}`}
                  <span className="text-sm font-normal text-[var(--color-muted-foreground)] ml-1">
                    {coupon.discountType === 'PERCENTAGE' ? 'OFF' : 'OFF'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-xs text-[var(--color-muted-foreground)] mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {validFrom.toLocaleDateString()} → {validTo.toLocaleDateString()}
                  </div>
                  <span>Used: {coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' (unlimited)'}</span>
                  {usageLeft !== null && usageLeft > 0 && (
                    <span className="text-green-600">{usageLeft} uses left</span>
                  )}
                  {usageLeft !== null && usageLeft <= 0 && (
                    <span className="text-red-500">Fully redeemed</span>
                  )}
                </div>

                <button onClick={() => handleDelete(coupon.id)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Coupon Form Modal ──────────────────────────────

function CouponFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [value, setValue] = useState('10');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().split('T')[0]);
  const [validTo, setValidTo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [usageLimit, setUsageLimit] = useState('100');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!code.trim() || !value || !validFrom || !validTo) return;
    setSaving(true);
    try {
      await createCoupon({
        code: code.trim(),
        discountType,
        value: parseFloat(value),
        validFrom: new Date(validFrom).toISOString(),
        validTo: new Date(validTo).toISOString(),
        usageLimit: parseInt(usageLimit) || undefined,
      });
      onSaved();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const inputClass = "w-full p-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-background)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[var(--color-card)] p-6 rounded-xl shadow-xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">Create Coupon</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Coupon Code *</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SAVE20" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block">Type *</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}
                className={inputClass}>
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Value *</label>
              <input value={value} onChange={(e) => setValue(e.target.value)} type="number" step="0.01"
                className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium mb-1 block">Valid From *</label>
              <input value={validFrom} onChange={(e) => setValidFrom(e.target.value)} type="date"
                className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Valid To *</label>
              <input value={validTo} onChange={(e) => setValidTo(e.target.value)} type="date"
                className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block">Usage Limit (leave empty for unlimited)</label>
            <input value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} type="number"
              className={inputClass} />
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={onClose}
              className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)] transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !code.trim() || !value || !validFrom || !validTo}
              className="flex-1 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Order Notification Toast ───────────────────

function NotificationToast({ order, onClose, onView }: {
  order: { id: string; table?: { tableNumber: string } | null; orderType: string; createdAt: string };
  onClose: () => void; onView: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up max-w-sm w-full premium-card p-4 border-l-4 border-[var(--color-primary)] shadow-xl">
      <div className="flex items-start gap-3">
        <div className="bg-[var(--color-primary)]/10 p-2 rounded-full flex-shrink-0">
          <BellRing className="w-5 h-5 text-[var(--color-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">New Order Received!</p>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
            {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : order.orderType}
            {' · '}{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs font-mono text-[var(--color-muted-foreground)] mt-0.5">
            #{order.id.slice(0, 8)}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onView}
            className="text-xs px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
            View
          </button>
          <button onClick={onClose}
            className="text-xs px-2 py-1.5 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────

export default function App() {
  const token = useAuthStore((state) => state.token);
  const [tab, setTab] = useState<Tab>('dashboard');
  const { dark, toggle: toggleTheme } = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [lastPollTime, setLastPollTime] = useState(() => new Date().toISOString());
  const [toastOrder, setToastOrder] = useState<any | null>(null);
  const apiToken = useAuthStore((s) => s.token);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // Poll for new orders every 10 seconds
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
                // Play a subtle notification sound
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
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'analytics' && <AnalyticsTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'menu' && <MenuTab />}
        {tab === 'inventory' && <InventoryTab />}
        {tab === 'tables' && <TablesTab />}
        {tab === 'coupons' && <CouponsTab />}
        {tab === 'reviews' && <ReviewsTab />}
        {tab === 'audit' && <AuditTab />}
      </main>

      {/* Toast Notification */}
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
