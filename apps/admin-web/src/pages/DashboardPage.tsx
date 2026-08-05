import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, ShoppingBag, Clock, AlertTriangle, PackageOpen, RefreshCcw, TrendingUp, ArrowUpRight, ChefHat, Zap } from 'lucide-react';
import { fetchOverviewStats, fetchAllFoodItems } from '../api';
import type { FoodItem } from '../api';

export function DashboardPage() {
  const [stats, setStats] = useState({ revenue: 0, totalOrders: 0, activeOrders: 0 });
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [statsData, items] = await Promise.all([
        fetchOverviewStats(),
        fetchAllFoodItems(),
      ]);
      setStats(statsData);
      setFoodItems(items);
    } catch (e: any) {
      setLoadError(e?.message || 'Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, [load]);

  const lowStockItems = foodItems.filter(
    (item) => item.productionStock && item.productionStock.availableQty <= 5 && item.isEnabled
  );
  const outOfStockItems = foodItems.filter(
    (item) => item.productionStock && item.productionStock.availableQty <= 0
  );

  const statCards = [
    {
      label: "Today's Revenue",
      value: `₹${stats.revenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      sub: 'Total earnings today',
      icon: IndianRupee,
      color: 'emerald',
      gradient: 'linear-gradient(135deg, rgba(16,185,129,.12), rgba(5,150,105,.06))',
      iconBg: 'rgba(16,185,129,.15)',
      iconColor: '#10b981',
      trend: '+12.4%',
    },
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      sub: 'Orders placed today',
      icon: ShoppingBag,
      color: 'blue',
      gradient: 'linear-gradient(135deg, rgba(59,130,246,.10), rgba(37,99,235,.05))',
      iconBg: 'rgba(59,130,246,.15)',
      iconColor: '#3b82f6',
      trend: '+5.2%',
    },
    {
      label: 'Active Orders',
      value: stats.activeOrders.toString(),
      sub: 'Currently in kitchen',
      icon: Clock,
      color: 'orange',
      gradient: 'linear-gradient(135deg, rgba(249,115,22,.10), rgba(234,88,12,.05))',
      iconBg: 'rgba(249,115,22,.15)',
      iconColor: '#f97316',
      trend: null,
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-6 rounded-full" style={{ background: 'var(--gradient-primary)' }} />
            <h1 className="page-title">Dashboard</h1>
          </div>
          <p className="page-subtitle ml-3.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-muted)] transition-all text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] disabled:opacity-50"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {loadError && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <strong className="font-semibold">Error loading data</strong>
            <p className="mt-0.5 text-red-600 dark:text-red-400/80">{loadError}</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
        {loading
          ? [0, 1, 2].map((i) => (
            <div key={i} className="stat-card animate-fade-in">
              <div className="skeleton w-10 h-10 rounded-xl mb-4" />
              <div className="skeleton h-3 w-28 rounded mb-3" />
              <div className="skeleton h-9 w-24 rounded" />
            </div>
          ))
          : statCards.map((c) => (
            <div key={c.label} className="stat-card animate-slide-up group cursor-default">
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl grid place-items-center"
                  style={{ background: c.iconBg }}>
                  <c.icon className="w-5 h-5" style={{ color: c.iconColor }} />
                </div>
                {c.trend && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                    <ArrowUpRight className="w-3 h-3" />
                    {c.trend}
                  </div>
                )}
              </div>
              <p className="text-[var(--color-muted-foreground)] text-sm font-medium mb-1">{c.label}</p>
              <p className="text-3xl font-extrabold tracking-tight text-[var(--color-foreground)]">{c.value}</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-1.5">{c.sub}</p>
            </div>
          ))
        }
      </div>

      {/* Quick actions + stock alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick actions panel */}
        <div className="lg:col-span-1">
          <div className="premium-card p-5 h-full">
            <h3 className="font-bold text-sm text-[var(--color-foreground)] mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--color-primary)]" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                { label: 'View Active Orders', icon: Clock, color: '#f97316', to: '/orders' },
                { label: 'Manage Menu', icon: ChefHat, color: '#10b981', to: '/menu' },
                { label: 'Analytics Report', icon: TrendingUp, color: '#3b82f6', to: '/analytics' },
              ].map((action) => (
                <Link to={action.to} key={action.label}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--color-muted)] cursor-pointer transition-colors group">
                  <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
                    style={{ background: `${action.color}18` }}>
                    <action.icon className="w-4 h-4" style={{ color: action.color }} />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">{action.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-auto text-[var(--color-muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stock alerts */}
        <div className="lg:col-span-2">
          {(lowStockItems.length > 0 || outOfStockItems.length > 0) ? (
            <div className="premium-card p-5 h-full" style={{ borderColor: 'rgba(245,158,11,.3)' }}>
              <h3 className="font-bold text-sm text-[var(--color-foreground)] mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Stock Alerts
                <span className="ml-auto badge badge-amber">
                  {outOfStockItems.length + lowStockItems.filter(i => i.productionStock && i.productionStock.availableQty > 0).length} items
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {outOfStockItems.slice(0, 4).map((item) => (
                  <div key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)' }}>
                    <PackageOpen className="w-4 h-4 text-red-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[var(--color-foreground)] truncate block">{item.name}</span>
                      <span className="text-xs font-bold text-red-500">OUT OF STOCK</span>
                    </div>
                  </div>
                ))}
                {lowStockItems.filter(i => i.productionStock && i.productionStock.availableQty > 0).slice(0, 4).map((item) => (
                  <div key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.15)' }}>
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-[var(--color-foreground)] truncate block">{item.name}</span>
                      <span className="text-xs font-bold text-amber-500">Only {item.productionStock?.availableQty} left</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !loading ? (
            <div className="premium-card p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl grid place-items-center mb-4" style={{ background: 'rgba(16,185,129,.1)' }}>
                <ShoppingBag className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <p className="font-semibold text-[var(--color-foreground)]">All stocked up!</p>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">No stock alerts at the moment.</p>
            </div>
          ) : (
            <div className="premium-card p-5 h-full">
              <div className="skeleton h-4 w-32 rounded mb-5" />
              <div className="grid grid-cols-2 gap-2.5">
                {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
