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

  return (
    <div
      className={`premium-card flex flex-col overflow-hidden animate-fade-in border-2 ${
        isNew
          ? 'border-red-400 shadow-lg shadow-red-200 dark:shadow-red-900/30'
          : isUrgent
            ? 'border-amber-400 shadow-md shadow-amber-200 dark:shadow-amber-900/20'
            : 'border-transparent'
      }`}
      style={{ animation: 'fade-in 0.3s ease-out' }}
    >
      {/* Header bar */}
      <div
        className={`text-white p-4 font-bold flex justify-between items-center text-lg ${
          order.status === 'PLACED'
            ? 'bg-red-500'
            : order.status === 'ACCEPTED'
              ? 'bg-yellow-500'
              : order.status === 'PREPARING'
                ? 'bg-blue-500'
                : 'bg-green-500'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">
            {order.table?.tableNumber
              ? `Table ${order.table.tableNumber}`
              : order.orderType}
          </span>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full uppercase tracking-wide">
            {order.status}
          </span>
          {isUrgent && <span className="text-sm bg-red-600 px-3 py-1 rounded-full animate-pulse">⚠️ URGENT</span>}
        </div>
        <div className="flex items-center gap-3">
          {timeSince < 60 ? (
            <span className="text-sm opacity-90">{timeSince}m ago</span>
          ) : (
            <span className="text-sm opacity-90">
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="p-5 flex-1">
        <ul className="space-y-4">
          {order.orderItems?.map((item: any) => (
            <li
              key={item.id}
              className="flex flex-col gap-1 border-b border-[var(--color-border)] pb-3 last:border-0"
            >
              <div className="flex justify-between font-semibold text-lg">
                <span>
                  {item.quantity}x {item.foodItem?.name || 'Unknown Item'}
                </span>
              </div>
              {item.specialInstructions && (
                <div className="flex items-start gap-2 text-amber-600">
                  <span className="text-lg">📝</span>
                  <span className="font-medium text-base">{item.specialInstructions}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-[var(--color-border)] flex gap-3">
        {order.status === 'CANCELLED' ? (
          <div className="w-full text-center text-red-500 font-bold text-lg py-3">
            ❌ Order Cancelled
          </div>
        ) : order.status === 'PLACED' ? (
          <>
            <button
              onClick={() => onStatusUpdate(order.id, 'PREPARING')}
              disabled={statusLoading === order.id}
              className="flex-1 bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md flex items-center justify-center gap-2 text-lg"
            >
              {statusLoading === order.id ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CookingPot className="w-5 h-5" /> Start Preparing
                </>
              )}
            </button>
            <button
              onClick={() => onStatusUpdate(order.id, 'CANCELLED')}
              disabled={statusLoading === order.id}
              className="px-4 py-3 border-2 border-red-300 text-red-500 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Cancel Order"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : order.status === 'PREPARING' ? (
          <>
            <button
              onClick={() => onStatusUpdate(order.id, 'READY')}
              disabled={statusLoading === order.id}
              className="flex-1 bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 shadow-md flex items-center justify-center gap-2 text-lg"
            >
              {statusLoading === order.id ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="w-5 h-5" /> Mark Ready
                </>
              )}
            </button>
            <button
              onClick={() => onStatusUpdate(order.id, 'CANCELLED')}
              disabled={statusLoading === order.id}
              className="px-4 py-3 border-2 border-red-300 text-red-500 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Cancel Order"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : order.status === 'READY' ? (
          <button
            onClick={() => onStatusUpdate(order.id, 'COMPLETED')}
            disabled={statusLoading === order.id}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 shadow-md flex items-center justify-center gap-2 text-lg"
          >
            {statusLoading === order.id ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCheck className="w-5 h-5" /> Complete Order
              </>
            )}
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
