import { useState, useCallback, useEffect } from 'react';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { fetchAnalytics, fetchAllOrders } from '../api';
import type { AnalyticsData } from '../api';
import { exportRowsAsCSV } from '../lib/csv';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, Legend,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';


const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await fetchAnalytics(days)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const handleExportSalesCSV = async (rangeDays: number) => {
    setExportingCsv(true);
    try {
      const rawOrders = await fetchAllOrders();
      const rows = Array.isArray(rawOrders) ? rawOrders : (rawOrders as any)?.data ?? [];
      
      const cutoff = new Date();
      if (rangeDays === 1) {
        cutoff.setHours(0, 0, 0, 0);
      } else {
        cutoff.setDate(cutoff.getDate() - rangeDays);
        cutoff.setHours(0, 0, 0, 0);
      }

      const filtered = rows.filter((o: any) => new Date(o.createdAt) >= cutoff);
      const labelMap: Record<number, string> = {
        1: 'today',
        7: '7days',
        30: '1month',
        90: '3months',
        180: '6months',
      };
      const periodLabel = labelMap[rangeDays] || `${rangeDays}days`;

      exportRowsAsCSV(
        `sales_report_${periodLabel}_${new Date().toISOString().slice(0, 10)}`,
        filtered,
        [
          { key: 'id', label: 'Order ID' },
          { key: 'createdAt', label: 'Date & Time', format: (v) => new Date(v).toLocaleString() },
          { key: 'customer', label: 'Customer', format: (_v, r) => r.customer?.name || r.customer?.email || 'Guest' },
          { key: 'status', label: 'Order Status' },
          { key: 'paymentStatus', label: 'Payment Status' },
          { key: 'subtotal', label: 'Subtotal (INR)', format: (v) => Number(v || 0).toFixed(2) },
          { key: 'discount', label: 'Discount (INR)', format: (v) => Number(v || 0).toFixed(2) },
          { key: 'tax', label: 'Tax (INR)', format: (v) => Number(v || 0).toFixed(2) },
          { key: 'total', label: 'Total (INR)', format: (v) => Number(v || 0).toFixed(2) },
          {
            key: 'orderItems',
            label: 'Items Ordered',
            format: (v) =>
              Array.isArray(v)
                ? v.map((item: any) => `${item.quantity}x ${item.foodItem?.name || 'Item'}`).join('; ')
                : '',
          },
        ],
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to export sales report');
    } finally {
      setExportingCsv(false);
    }
  };

  return (
    <div className="animate-fade-in p-2">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-foreground)' }}>Analytics</h2>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Business performance overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select 
              value={days} 
              onChange={(e: any) => setDays(parseInt(e.target.value))}
              className="h-10 pl-4 pr-10 py-2 text-sm font-semibold rounded-xl appearance-none outline-none transition-all focus:ring-2"
              style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-foreground)',
                '--tw-ring-color': 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
              } as any}
            >
              <option value={7} style={{ color: 'var(--color-foreground)', background: 'var(--color-card)' }}>Last 7 days</option>
              <option value={30} style={{ color: 'var(--color-foreground)', background: 'var(--color-card)' }}>Last 30 days</option>
              <option value={90} style={{ color: 'var(--color-foreground)', background: 'var(--color-card)' }}>Last 90 days</option>
              <option value={180} style={{ color: 'var(--color-foreground)', background: 'var(--color-card)' }}>Last 180 days</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className="relative">
            <select
              onChange={(e: any) => {
                if (e.target.value) {
                  handleExportSalesCSV(parseInt(e.target.value));
                  e.target.value = '';
                }
              }}
              disabled={exportingCsv}
              className="h-10 pl-4 pr-10 py-2 text-sm font-bold rounded-xl appearance-none outline-none transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:opacity-90"
              style={{
                background: 'var(--color-primary)',
                color: 'white',
              }}
            >
              <option value="" style={{ color: 'var(--color-foreground)', background: 'var(--color-card)' }}>Download CSV Report...</option>
              <option value="1" style={{ color: 'var(--color-foreground)', background: 'var(--color-card)' }}>1 Day (Today)</option>
              <option value="7" style={{ color: 'var(--color-foreground)', background: 'var(--color-card)' }}>7 Days</option>
              <option value="30" style={{ color: 'var(--color-foreground)', background: 'var(--color-card)' }}>1 Month (30 Days)</option>
              <option value="90" style={{ color: 'var(--color-foreground)', background: 'var(--color-card)' }}>3 Months (90 Days)</option>
              <option value="180" style={{ color: 'var(--color-foreground)', background: 'var(--color-card)' }}>6 Months (180 Days)</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <button onClick={load} disabled={loading}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all hover:bg-[var(--color-muted)] disabled:opacity-50"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}>
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--color-muted-foreground)]" /></div>
      ) : !data ? (
        <div className="text-center py-16 text-[var(--color-muted-foreground)]">No data available</div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top-level KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl rounded-full group-hover:scale-125 group-hover:bg-emerald-500/20 transition-all duration-700 pointer-events-none" />
              <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted-foreground)' }}>Total Revenue</p>
              <p className="text-4xl font-black" style={{ color: 'var(--color-foreground)' }}>₹{data.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-blue-500/10 dark:bg-blue-500/20 blur-3xl rounded-full group-hover:scale-125 group-hover:bg-blue-500/20 transition-all duration-700 pointer-events-none" />
              <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted-foreground)' }}>Total Orders</p>
              <p className="text-4xl font-black" style={{ color: 'var(--color-foreground)' }}>{data.totalOrders}</p>
            </div>
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 relative overflow-hidden group">
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-purple-500/10 dark:bg-purple-500/20 blur-3xl rounded-full group-hover:scale-125 group-hover:bg-purple-500/20 transition-all duration-700 pointer-events-none" />
              <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-muted-foreground)' }}>Avg. Order Value</p>
              <p className="text-4xl font-black" style={{ color: 'var(--color-foreground)' }}>₹{data.averageOrderValue.toFixed(2)}</p>
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-sm">
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg" style={{ color: 'var(--color-foreground)' }}>Revenue Trend</h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}>
                  {data.revenueTrend.length} day{data.revenueTrend.length === 1 ? '' : 's'} with sales
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="h-[300px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12, fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: 'var(--color-foreground)' }}
                      formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={4} fill="url(#revGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Popular Items & Peak Hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-sm">
              <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-bold text-lg" style={{ color: 'var(--color-foreground)' }}>Most Popular Items</h3>
              </div>
              <div className="p-6">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.popularItems.slice(0, 8)} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="popGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.7} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fill: 'var(--color-foreground)', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12, fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: 'var(--color-foreground)' }}
                        formatter={(v: any, name: any) => name === 'revenue' ? [`₹${Number(v).toFixed(2)}`, 'Revenue'] : [Number(v), 'Sold']}
                      />
                      <Bar dataKey="count" fill="url(#popGradient)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-sm">
              <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-bold text-lg" style={{ color: 'var(--color-foreground)' }}>Peak Hours</h3>
              </div>
              <div className="p-6">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.peakHours} margin={{ top: 16 }}>
                      <defs>
                        <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="label" height={60} tick={{ fill: 'var(--color-muted-foreground)', fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} angle={-45} textAnchor="end" interval="preserveStartEnd" />
                      <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12, fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: 'var(--color-foreground)' }}
                        formatter={(value: any) => [Number(value), 'Orders']}
                      />
                      <Bar dataKey="orders" fill="url(#peakGradient)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-sm">
            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--color-foreground)' }}>Payment Status Breakdown</h3>
            </div>
            <div className="p-6">
              {data.paymentBreakdown.length === 0 ? (
                <div className="text-sm font-semibold py-8 text-center" style={{ color: 'var(--color-muted-foreground)' }}>No payments in range</div>
              ) : (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.paymentBreakdown}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={3}
                      >
                        {data.paymentBreakdown.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 12, fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: 'var(--color-foreground)' }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Coupon / Discount Analytics */}
          {data.discountStats && (
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-sm">
              <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--color-foreground)' }}>
                  📊 Discount &amp; Coupon Stats
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl border" style={{ background: 'color-mix(in srgb, #3b82f6 8%, transparent)', borderColor: 'color-mix(in srgb, #3b82f6 20%, transparent)' }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted-foreground)' }}>Total Discount</p>
                    <p className="text-2xl font-black text-blue-500">₹{data.discountStats.totalDiscountGiven.toFixed(2)}</p>
                  </div>
                  <div className="p-5 rounded-2xl border" style={{ background: 'color-mix(in srgb, #10b981 8%, transparent)', borderColor: 'color-mix(in srgb, #10b981 20%, transparent)' }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted-foreground)' }}>Orders w/ Discount</p>
                    <p className="text-2xl font-black text-green-500">{data.discountStats.discountOrderCount}</p>
                  </div>
                  <div className="p-5 rounded-2xl border" style={{ background: 'color-mix(in srgb, #a855f7 8%, transparent)', borderColor: 'color-mix(in srgb, #a855f7 20%, transparent)' }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted-foreground)' }}>% Discounted</p>
                    <p className="text-2xl font-black text-purple-500">{data.discountStats.discountPercentage}%</p>
                  </div>
                  <div className="p-5 rounded-2xl border" style={{ background: 'color-mix(in srgb, #f59e0b 8%, transparent)', borderColor: 'color-mix(in srgb, #f59e0b 20%, transparent)' }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-muted-foreground)' }}>Avg Discount/Order</p>
                    <p className="text-2xl font-black text-amber-500">₹{data.discountStats.averageDiscountPerOrder.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
