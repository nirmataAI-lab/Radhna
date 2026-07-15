import { ChefHat, LogOut, CookingPot, CheckCheck, X, RefreshCw, Maximize2, Minimize2, Bell, BellOff } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { fetchActiveOrders, loginApi, updateOrderStatus } from './api';
import type { OrderStatus } from './api';
import { useAuthStore } from './authStore';

// ─── Notification Sound ─────────────────────────────

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Play a pleasant two-tone chime for new orders
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.linearRampToValueAtTime(0, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };
    playTone(523, 0, 0.12);   // C5
    playTone(659, 0.1, 0.15); // E5
    playTone(784, 0.2, 0.2);  // G5
  } catch {}
}

// ─── Login ──────────────────────────────────────────

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="premium-card p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <ChefHat className="w-12 h-12 text-[var(--color-primary)] mb-4" />
          <h1 className="text-2xl font-bold text-center">Chief Login</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Kitchen Display System</p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-200">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chief@restaurant.com"
              required
              className="w-full p-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
              required
              className="w-full p-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white font-bold py-2.5 rounded-lg mt-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

interface Order {
  id: string;
  orderType: string;
  status: string;
  createdAt: string;
  table?: { tableNumber: string } | null;
  orderItems?: {
    id: string;
    quantity: number;
    specialInstructions?: string;
    foodItem?: { name: string } | null;
  }[];
}

// ─── KDS Order Card ─────────────────────────────────

function OrderCard({ order, onStatusUpdate, statusLoading }: {
  order: Order;
  onStatusUpdate: (id: string, status: OrderStatus) => void;
  statusLoading: string | null;
}) {
  const timeSince = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const isUrgent = timeSince > 15 && order.status !== 'READY' && order.status !== 'COMPLETED';
  const isNew = timeSince < 2 && order.status === 'PLACED';

  const statusStyles: Record<string, { bg: string; ring: string; label: string }> = {
    PLACED:    { bg: 'bg-[var(--color-destructive)]', ring: 'ring-[var(--color-destructive)]/60', label: 'New order' },
    ACCEPTED:  { bg: 'bg-[var(--color-warning)]',     ring: 'ring-[var(--color-warning)]/60',     label: 'Accepted' },
    PREPARING: { bg: 'bg-[var(--color-primary)]',     ring: 'ring-[var(--color-primary)]/60',     label: 'Preparing' },
    READY:     { bg: 'bg-[var(--color-success)]',     ring: 'ring-[var(--color-success)]/60',     label: 'Ready' },
    COMPLETED: { bg: 'bg-[var(--color-muted-foreground)]', ring: 'ring-white/10', label: 'Completed' },
    CANCELLED: { bg: 'bg-neutral-600', ring: 'ring-white/10', label: 'Cancelled' },
  };
  const s = statusStyles[order.status] ?? statusStyles.PLACED;

  return (
    <div
      className={`premium-card flex flex-col overflow-hidden ${isNew ? 'status-urgent' : ''} ${isUrgent ? 'ring-2 ring-[var(--color-warning)]/50' : ''}`}
      style={{ animation: 'slide-up 0.35s cubic-bezier(0.22,1,0.36,1)' }}
    >
      {/* Header bar */}
      <div className={`relative ${s.bg} p-4 text-white`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-display text-2xl font-bold leading-tight tracking-tight">
              {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : order.orderType.replace('_', ' ')}
            </div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] opacity-90">
              {s.label} · #{order.id.slice(0, 6)}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-2xl font-bold leading-none tabular-nums">
              {timeSince < 60 ? `${timeSince}` : new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {timeSince < 60 && <span className="ml-0.5 text-xs font-normal opacity-80">m</span>}
            </div>
            {isUrgent && (
              <div className="mt-1.5 inline-flex animate-pulse items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                ⚠ Urgent
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 p-5">
        <ul className="space-y-3">
          {order.orderItems?.map((item: any) => (
            <li key={item.id} className="border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xl font-bold text-[var(--color-primary)] tabular-nums">
                  {item.quantity}×
                </span>
                <span className="flex-1 font-display text-lg font-semibold leading-tight text-[var(--color-foreground)]">
                  {item.foodItem?.name || 'Unknown Item'}
                </span>
              </div>
              {item.specialInstructions && (
                <div className="mt-2 flex items-start gap-2 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-3 py-2 text-sm font-medium text-[var(--color-warning)]">
                  <span className="mt-0.5">📝</span>
                  <span className="flex-1">{item.specialInstructions}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-[var(--color-border)] bg-black/20 p-3">
        {order.status === 'CANCELLED' ? (
          <div className="w-full py-2 text-center text-base font-bold text-[var(--color-destructive)]">
            ❌ Cancelled
          </div>
        ) : order.status === 'PLACED' ? (
          <>
            <button
              onClick={() => onStatusUpdate(order.id, 'PREPARING')}
              disabled={statusLoading === order.id}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-3 text-base font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
            >
              {statusLoading === order.id ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><CookingPot className="h-5 w-5" /> Start Preparing</>}
            </button>
            <button
              onClick={() => onStatusUpdate(order.id, 'CANCELLED')}
              disabled={statusLoading === order.id}
              className="rounded-xl border border-[var(--color-destructive)]/40 px-4 text-[var(--color-destructive)] transition hover:bg-[var(--color-destructive)]/10 disabled:opacity-50"
              title="Cancel Order"
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : order.status === 'PREPARING' ? (
          <>
            <button
              onClick={() => onStatusUpdate(order.id, 'READY')}
              disabled={statusLoading === order.id}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-success)] py-3 text-base font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
            >
              {statusLoading === order.id ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><CheckCheck className="h-5 w-5" /> Mark Ready</>}
            </button>
            <button
              onClick={() => onStatusUpdate(order.id, 'CANCELLED')}
              disabled={statusLoading === order.id}
              className="rounded-xl border border-[var(--color-destructive)]/40 px-4 text-[var(--color-destructive)] transition hover:bg-[var(--color-destructive)]/10 disabled:opacity-50"
              title="Cancel Order"
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : order.status === 'READY' ? (
          <button
            onClick={() => onStatusUpdate(order.id, 'COMPLETED')}
            disabled={statusLoading === order.id}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-success)] py-3 text-base font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            {statusLoading === order.id ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><CheckCheck className="h-5 w-5" /> Complete Order</>}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Kitchen Dashboard ──────────────────────────────

function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [completed, setCompleted] = useState<Order[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const logout = useAuthStore((state) => state.logout);

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchActiveOrders();
      setOrders(data.filter((o: Order) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'));
      setCompleted(data.filter((o: Order) => o.status === 'COMPLETED'));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, []);

  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    setStatusLoading(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setStatusLoading(null);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  // Auto-refresh polling (fallback for WebSocket)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadOrders, 15000); // 15s
    return () => clearInterval(interval);
  }, [autoRefresh, loadOrders]);

  // WebSocket
  useEffect(() => {
    loadOrders();

    const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    const token = useAuthStore.getState().token;
    const socket: Socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('newOrder', (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      if (soundEnabled) playNotificationSound();
    });

    socket.on('orderStatusUpdate', (updatedOrder: Order) => {
      setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
      setCompleted((prev) => prev.filter((o) => o.id !== updatedOrder.id));

      if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
        setCompleted((prev) => [updatedOrder, ...prev]);
      } else {
        setOrders((prev) => {
          const exists = prev.find((o) => o.id === updatedOrder.id);
          if (exists) {
            return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
          }
          return [updatedOrder, ...prev];
        });
      }
    });

    return () => { socket.disconnect(); };
  }, [loadOrders, soundEnabled]);

  const activeOrders = orders;

  return (
    <div ref={containerRef} className={`min-h-screen flex bg-[var(--color-background)] ${isFullscreen ? 'kds-fullscreen' : ''}`}>
      {/* Sidebar — collapsed in full-screen mode */}
      {!isFullscreen && (
        <aside className="w-64 bg-[var(--color-card)] border-r border-[var(--color-border)] p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <ChefHat className="w-6 h-6 text-[var(--color-primary)]" />
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-primary)]">Chief Panel</h1>
          </div>
          <nav className="flex flex-col gap-1 text-sm font-medium flex-1">
            <button
              onClick={() => setActiveTab('active')}
              className={`p-3 rounded-lg text-left transition-colors flex items-center gap-2 ${
                activeTab === 'active'
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              <CookingPot className="w-4 h-4" />
              Active Orders
              {activeOrders.length > 0 && (
                <span className="ml-auto bg-[var(--color-primary)] text-white text-xs px-2 py-0.5 rounded-full">
                  {activeOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`p-3 rounded-lg text-left transition-colors flex items-center gap-2 ${
                activeTab === 'completed'
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              <CheckCheck className="w-4 h-4" />
              Completed
            </button>
          </nav>
          <div className="flex flex-col gap-2 mt-auto">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-2 text-sm font-medium p-3 rounded-lg transition-colors ${
                soundEnabled ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {soundEnabled ? 'Sound On' : 'Sound Off'}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-red-500 p-3 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>
      )}

      <main className={`flex-1 overflow-y-auto max-h-screen ${isFullscreen ? 'p-6' : 'p-8'}`}>
        {/* Header */}
        <header className={`flex justify-between items-center mb-6 border-b border-[var(--color-border)] pb-4 ${isFullscreen ? 'kds-header' : ''}`}>
          <h2 className={`font-bold flex items-center gap-3 ${isFullscreen ? 'text-4xl' : 'text-3xl'}`}>
            {activeTab === 'active' ? (
              <><ChefHat className="w-8 h-8 text-[var(--color-primary)]" /> Kitchen Display</>
            ) : 'Completed Orders'}
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${
                isConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </h2>
          <div className="flex items-center gap-3">
            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className={`flex items-center gap-2 text-sm border border-[var(--color-border)] px-3 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors ${
                isFullscreen ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : ''
              }`}
              title={isFullscreen ? 'Exit full screen' : 'Full screen mode'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isFullscreen ? 'Exit' : 'Full Screen'}
            </button>
            {/* Auto-refresh toggle */}
            {!isFullscreen && (
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 text-sm border px-3 py-2 rounded-lg transition-colors ${
                  autoRefresh ? 'border-green-300 text-green-600' : 'border-[var(--color-border)]'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto
              </button>
            )}
            <button
              onClick={loadOrders}
              className="flex items-center gap-2 text-sm border border-[var(--color-border)] px-3 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </header>

        {activeTab === 'active' ? (
          <>
            {/* Active orders grid */}
            <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
              {activeOrders.length === 0 ? (
                <div className="col-span-full text-center py-20 text-[var(--color-muted-foreground)]">
                  <ChefHat className="w-20 h-20 mx-auto mb-4 opacity-10" />
                  <p className="text-2xl font-medium">No active orders</p>
                  <p className="text-lg">Waiting for new orders to arrive...</p>
                </div>
              ) : (
                activeOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusUpdate={handleStatusUpdate}
                    statusLoading={statusLoading}
                  />
                ))
              )}
            </div>
          </>
        ) : (
          <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
            {completed.length === 0 ? (
              <div className="col-span-full text-center py-20 text-[var(--color-muted-foreground)]">
                <CheckCheck className="w-20 h-20 mx-auto mb-4 opacity-10" />
                <p className="text-2xl font-medium">No completed orders yet</p>
              </div>
            ) : (
              completed.map((order) => (
                <div
                  key={order.id}
                  className="premium-card flex flex-col opacity-75 overflow-hidden"
                >
                  <div
                    className={`text-white p-4 font-bold flex justify-between items-center ${
                      order.status === 'CANCELLED' ? 'bg-gray-500' : 'bg-green-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {order.table?.tableNumber
                          ? `Table ${order.table.tableNumber}`
                          : order.orderType}
                      </span>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full uppercase">
                        {order.status}
                      </span>
                    </div>
                    <span className="text-sm">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2">
                      {order.orderItems?.map((item: any) => (
                        <li key={item.id} className="flex justify-between text-base">
                          <span>
                            {item.quantity}x {item.foodItem?.name || 'Unknown'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Login />;
  return <KitchenDashboard />;
}
