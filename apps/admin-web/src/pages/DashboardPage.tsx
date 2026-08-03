import { useState, useCallback, useEffect } from 'react';
import { IndianRupee, ShoppingBag, Clock, AlertTriangle, PackageOpen, RefreshCcw } from 'lucide-react';
import { fetchOverviewStats, fetchAllFoodItems } from '../api';
import type { FoodItem } from '../api';
import { Card, CardHeader, CardTitle, CardContent, Button } from 'ui-components';

export function DashboardPage() {
  const [stats, setStats] = useState({ revenue: 0, totalOrders: 0, activeOrders: 0 });
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
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
    }
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
    <div className="animate-in fade-in duration-300">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">Today's business overview</p>
        </div>
        <Button onClick={load} isLoading={loading} variant="outline" size="sm">
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </header>

      {loadError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
          <strong>Error:</strong> {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {loading ? (
          // Skeleton loaders for stat cards
          [0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-muted)] animate-pulse mb-4" />
                <div className="h-3 w-24 bg-[var(--color-muted)] rounded animate-pulse mb-3" />
                <div className="h-8 w-20 bg-[var(--color-muted)] rounded animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : (
          cards.map((c) => (
            <Card key={c.label}>
              <CardContent className="pt-6">
                <div className={`p-2 rounded-lg w-fit ${c.color} mb-4`}><c.icon className="w-5 h-5" /></div>
                <p className="text-[var(--color-muted-foreground)] font-medium text-sm mb-1">{c.label}</p>
                <p className="text-3xl font-bold">{c.value}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-4 flex flex-row items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <CardTitle>Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
