import { useState, useCallback, useEffect } from 'react';
import { RefreshCcw, Download, ChefHat, Bell, ShieldCheck, X, CheckSquare, Square, ListOrdered } from 'lucide-react';
import { fetchAllOrders, updateOrderStatus, updateOrderPaymentStatus } from '../api';
import type { Order } from '../api';
import { exportRowsAsCSV } from '../lib/csv';
import { 
  Card, Button, Badge,
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell 
} from 'ui-components';

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
  PLACED: 'default',
  ACCEPTED: 'secondary',
  PREPARING: 'warning',
  READY: 'success',
  COMPLETED: 'outline',
  CANCELLED: 'destructive',
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
      // fetchAllOrders returns a paginated wrapper { data, meta } — unwrap it
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

  const bulkUpdate = async (status: 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED') => {
    if (selected.size === 0) return;
    if (status === 'CANCELLED' && !window.confirm(`Cancel ${selected.size} order(s)?`)) return;
    setBulkBusy(true);
    try {
      await Promise.all([...selected].map(id => updateOrderStatus(id, status).catch(() => null)));
      await load();
    } finally { setBulkBusy(false); }
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
    <div className="animate-in fade-in duration-300">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders Management</h2>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">View and manage all orders</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 py-1 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <option value="">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <Button
            variant="outline"
            size="sm"
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
            title="Export as CSV"
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button onClick={load} isLoading={loading} variant="outline" size="icon">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {selected.size > 0 && (
        <Card className="mb-4 bg-[var(--color-primary)]/5 border-[var(--color-primary)]/30">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-medium">
              {selected.size} selected
            </div>
            <div className="flex flex-wrap gap-2">
              <Button disabled={bulkBusy} onClick={() => bulkUpdatePayment('PAID')} size="sm" variant="outline" className="border-emerald-500 text-emerald-600 hover:bg-emerald-500/10">
                <CheckSquare className="w-3.5 h-3.5 mr-1.5" /> Mark Paid
              </Button>
              <Button disabled={bulkBusy} onClick={() => setSelected(new Set())} size="sm" variant="ghost">
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loadError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-300">
          {loadError}
        </div>
      )}

      <Card className="overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-16 text-center text-[var(--color-muted-foreground)]">
            <ListOrdered className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No orders found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <button onClick={toggleAll} disabled={selectableIds.length === 0}
                    className="p-0.5 rounded hover:bg-[var(--color-border)] disabled:opacity-30 flex items-center justify-center" title="Select all active">
                    {allSelected ? <CheckSquare className="w-4 h-4 text-[var(--color-primary)]" /> : <Square className="w-4 h-4" />}
                  </button>
                </TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const selectable = order.status !== 'CANCELLED';
                const isSel = selected.has(order.id);
                return (
                <TableRow key={order.id} data-state={isSel ? 'selected' : undefined}>
                  <TableCell>
                    <button onClick={() => selectable && toggleOne(order.id)} disabled={!selectable}
                      className="p-0.5 rounded hover:bg-[var(--color-border)] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center">
                      {isSel ? <CheckSquare className="w-4 h-4 text-[var(--color-primary)]" /> : <Square className="w-4 h-4" />}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{order.id.slice(0, 8)}...</div>
                  </TableCell>
                  <TableCell>{order.customer?.name || order.customer?.email || '—'}</TableCell>
                  <TableCell>{order.orderItems?.length || 0} items</TableCell>
                  <TableCell className="font-medium">₹{Number(order.total).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'warning'}>
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_COLORS[order.status] || 'default'}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[var(--color-muted-foreground)] text-xs">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              );})}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
