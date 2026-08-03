import { useState, useCallback, useEffect } from 'react';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { fetchAnalytics } from '../api';
import type { AnalyticsData } from '../api';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, Legend,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, Button } from 'ui-components';

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AnalyticsPage() {
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
    <div className="animate-in fade-in duration-300">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">Business performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={days} 
            onChange={(e: any) => setDays(parseInt(e.target.value))}
            className="h-9 px-3 py-1 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={load} isLoading={loading} variant="outline" size="icon">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--color-muted-foreground)]" /></div>
      ) : !data ? (
        <div className="text-center py-16 text-[var(--color-muted-foreground)]">No data available</div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top-level KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">₹{data.totalRevenue.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-blue-600">{data.totalOrders}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-[var(--color-muted-foreground)] mb-1">Avg. Order Value</p>
                <p className="text-3xl font-bold text-purple-600">₹{data.averageOrderValue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend */}
          <Card>
            <CardHeader className="flex flex-row items-baseline justify-between pb-2">
              <CardTitle className="text-lg">Revenue Trend</CardTitle>
              <span className="text-xs text-[var(--color-muted-foreground)] font-medium">
                {data.revenueTrend.length} day{data.revenueTrend.length === 1 ? '' : 's'} with sales
              </span>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Popular Items & Peak Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Most Popular Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.popularItems.slice(0, 8)} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                        formatter={(v: any, name: any) => name === 'revenue' ? [`₹${Number(v).toFixed(2)}`, 'Revenue'] : [Number(v), 'Sold']}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Peak Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.peakHours} margin={{ top: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={2} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, boxShadow: 'var(--shadow-sm)' }}
                        formatter={(value: any) => [Number(value), 'Orders']}
                      />
                      <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {data.paymentBreakdown.length === 0 ? (
                <div className="text-sm text-[var(--color-muted-foreground)] py-8 text-center">No payments in range</div>
              ) : (
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.paymentBreakdown}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {data.paymentBreakdown.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coupon / Discount Analytics */}
          {data.discountStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">📊 Discount &amp; Coupon Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-2">
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                    <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Total Discount Given</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{data.discountStats.totalDiscountGiven.toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30">
                    <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Orders with Discount</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{data.discountStats.discountOrderCount}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
                    <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1">% Orders Discounted</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.discountStats.discountPercentage}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                    <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1">Avg Discount/Order</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">₹{data.discountStats.averageDiscountPerOrder.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
