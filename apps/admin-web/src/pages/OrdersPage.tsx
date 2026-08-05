import { useState, useCallback, useEffect } from 'react';
import { RefreshCcw, Download, ChefHat, X, CheckSquare, Square, ListOrdered, CheckCircle2, Clock, CookingPot, Truck, XCircle } from 'lucide-react';
import { fetchAllOrders, updateOrderStatus, updateOrderPaymentStatus } from '../api';
import type { Order } from '../api';
import { exportRowsAsCSV } from '../lib/csv';

const STATUS_ICONS: Record<string, React.FC<{ className?: string }>> = {
  PLACED: Clock,
  ACCEPTED: CheckCircle2,
  PREPARING: CookingPot,
  READY: Truck,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await fetchAllOrders(statusFilter || undefined);
      const rows = Array.isArray(result) ? result : (result as any)?.data ?? [];
      setOrders(rows);
      setSelected(new Set());
    }
    catch (e: any) { setLoadError(e?.message || 'Failed to load orders'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const selectableIds = orders.filter(o => o.status !== 'CANCELLED').map(o => o.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selected.has(id));

  const toggleAll = () => {
    setSelected(() => {
      if (allSelected) return new Set();
      return new Set(selectableIds);
    });
  };
  
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkUpdatePayment = async (status: 'PAID') => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all([...selected].map(id => updateOrderPaymentStatus(id, status).catch(() => null)));
      await load();
    } finally { setBulkBusy(false); }
  };

  return (
    <div className="animate-fade-in p-2">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-foreground)' }}>Orders Management</h2>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Monitor and manage live restaurant orders</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select 
              value={statusFilter} 
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="h-10 pl-4 pr-10 py-2 text-sm font-semibold rounded-xl appearance-none outline-none transition-all focus:ring-2"
              style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-foreground)',
                '--tw-ring-color': 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
              } as any}
            >
              <option value="">All Statuses</option>
              <option value="PLACED">Placed</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <button
            onClick={() => exportRowsAsCSV(`orders-${new Date().toISOString().slice(0,10)}`, orders, [
              { key: 'id', label: 'Order ID' },
              { key: 'createdAt', label: 'Created', format: (v) => new Date(v).toISOString() },
              { key: 'status', label: 'Status' },
              { key: 'paymentStatus', label: 'Payment' },
              { key: 'customer', label: 'Customer', format: (_v, r) => r.customer?.name || r.customer?.email || '' },
              { key: 'orderItems', label: 'Items', format: (v) => (v?.length ?? 0) },
              { key: 'subtotal', label: 'Subtotal' },
              { key: 'discount', label: 'Discount' },
              { key: 'tax', label: 'Tax' },
              { key: 'total', label: 'Total' },
            ])}
            disabled={orders.length === 0}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-muted)]"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          
          <button onClick={load} disabled={loading}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-all hover:bg-[var(--color-muted)] disabled:opacity-50"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}>
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Bulk actions bar */}
      <div className={`transition-all duration-300 overflow-hidden ${selected.size > 0 ? 'max-h-20 mb-6 opacity-100' : 'max-h-0 mb-0 opacity-0'}`}>
        <div className="px-5 py-3 rounded-2xl flex items-center justify-between"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-md grid place-items-center text-xs font-bold text-white shadow-sm bg-[var(--color-primary)]">
              {selected.size}
            </span>
            <span className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>Orders Selected</span>
          </div>
          <div className="flex gap-2">
            <button disabled={bulkBusy} onClick={() => bulkUpdatePayment('PAID')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
              style={{ background: '#10b981', color: 'white' }}>
              <CheckSquare className="w-3.5 h-3.5" /> Mark Paid
            </button>
            <button disabled={bulkBusy} onClick={() => setSelected(new Set())}
              className="h-8 px-3 rounded-lg text-xs font-bold transition-all hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--color-foreground)' }}>
              Clear
            </button>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 p-4 rounded-xl text-sm font-semibold flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#ef4444' }}>
          <XCircle className="w-4 h-4" /> {loadError}
        </div>
      )}

      {/* Table Card */}
      <div className="card-premium overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full grid place-items-center mb-5 opacity-40"
              style={{ background: 'var(--color-muted)' }}>
              <ListOrdered className="w-10 h-10" style={{ color: 'var(--color-muted-foreground)' }} />
            </div>
            <p className="text-xl font-bold mb-1" style={{ color: 'var(--color-foreground)' }}>No orders found</p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Try adjusting your status filter or wait for new orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-4 px-4 border-b w-12" style={{ borderColor: 'var(--color-border)' }}>
                    <button onClick={toggleAll} disabled={selectableIds.length === 0}
                      className="p-1 rounded-md transition-colors hover:bg-[var(--color-muted)] disabled:opacity-30">
                      {allSelected ? <CheckSquare className="w-5 h-5 text-[var(--color-primary)]" /> : <Square className="w-5 h-5 text-[var(--color-muted-foreground)]" />}
                    </button>
                  </th>
                  <th className="py-4 px-4 border-b font-bold text-xs uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Order ID</th>
                  <th className="py-4 px-4 border-b font-bold text-xs uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Customer</th>
                  <th className="py-4 px-4 border-b font-bold text-xs uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Items</th>
                  <th className="py-4 px-4 border-b font-bold text-xs uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Amount</th>
                  <th className="py-4 px-4 border-b font-bold text-xs uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Payment</th>
                  <th className="py-4 px-4 border-b font-bold text-xs uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Status</th>
                  <th className="py-4 px-4 border-b font-bold text-xs uppercase tracking-wider" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Time</th>
                  <th className="py-4 px-4 border-b font-bold text-xs uppercase tracking-wider text-right" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const selectable = order.status !== 'CANCELLED';
                  const isSel = selected.has(order.id);
                  const StatusIcon = STATUS_ICONS[order.status] || CheckCircle2;
                  
                  return (
                  <tr key={order.id} 
                    className={`transition-colors group ${isSel ? 'bg-[var(--color-muted)]' : 'hover:bg-[var(--color-muted)]/50'}`}>
                    <td className="py-3 px-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <button onClick={() => selectable && toggleOne(order.id)} disabled={!selectable}
                        className="p-1 rounded-md transition-colors hover:bg-[var(--color-muted)] disabled:opacity-20 disabled:cursor-not-allowed">
                        {isSel ? <CheckSquare className="w-5 h-5 text-[var(--color-primary)]" /> : <Square className="w-5 h-5 text-[var(--color-muted-foreground)]" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <span className="font-mono text-xs font-bold px-2 py-1 rounded-md"
                        style={{ background: 'var(--color-muted)', color: 'var(--color-foreground)' }}>
                        #{parseInt(order.id.slice(-4), 16) % 9000 + 1000}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
                        {order.customer?.name || 'Walk-in'}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {order.customer?.email || 'No email'}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <span className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                        {order.orderItems?.length || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <span className="text-sm font-black" style={{ color: 'var(--color-foreground)' }}>
                        ₹{Number(order.total).toFixed(0)}
                      </span>
                    </td>
                    <td className="py-3 px-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase"
                        style={{
                          background: order.paymentStatus === 'PAID' ? 'rgba(16,185,129,.1)' : order.paymentStatus === 'FAILED' ? 'rgba(239,68,68,.1)' : 'var(--color-muted)',
                          color: order.paymentStatus === 'PAID' ? '#10b981' : order.paymentStatus === 'FAILED' ? '#ef4444' : 'var(--color-muted-foreground)'
                        }}>
                        {order.status === 'CANCELLED' && order.paymentStatus === 'PENDING' ? 'CANCELLED' : order.paymentStatus}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                        order.status === 'READY' ? 'animate-pulse' : ''
                      }`}
                        style={{
                          background: order.status === 'CANCELLED' ? 'rgba(239,68,68,.1)' : order.status === 'COMPLETED' ? 'var(--color-muted)' : 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                          color: order.status === 'CANCELLED' ? '#ef4444' : order.status === 'COMPLETED' ? 'var(--color-muted-foreground)' : 'var(--color-primary)',
                          border: order.status === 'CANCELLED' ? '1px solid rgba(239,68,68,.2)' : order.status === 'COMPLETED' ? '1px solid var(--color-border)' : '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)',
                        }}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {order.status}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="text-xs font-semibold" style={{ color: 'var(--color-foreground)' }}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-4 border-b text-right" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(order.status === 'PLACED') && (
                          <button onClick={() => updateOrderStatus(order.id, 'PREPARING').then(load)}
                            className="p-1.5 rounded-lg text-white hover:scale-110 transition-transform shadow-sm"
                            style={{ background: '#3b82f6' }} title="Start Preparing">
                            <ChefHat className="w-4 h-4" />
                          </button>
                        )}
                        {(order.status === 'READY') && (
                          <button onClick={() => updateOrderStatus(order.id, 'COMPLETED').then(load)}
                            className="p-1.5 rounded-lg text-white hover:scale-110 transition-transform shadow-sm"
                            style={{ background: '#10b981' }} title="Mark Completed">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                          <button onClick={() => updateOrderStatus(order.id, 'CANCELLED').then(load)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors" title="Cancel">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
