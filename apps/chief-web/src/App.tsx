import { ChefHat, LogOut, CookingPot, CheckCheck, X, RefreshCw, Maximize2, Minimize2, Bell, BellOff, Keyboard, Package, Undo2, AlertTriangle } from 'lucide-react';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { fetchActiveOrders, loginApi, updateOrderStatus, recallOrder } from './api';
import type { OrderStatus } from './api';
import { useAuthStore } from './authStore';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { PrepStockTab } from './components/PrepStockTab';
import { useItemCheckoff } from './hooks/useItemCheckoff';


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
      setAuth(data.access_token, data.user, data.refresh_token);
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
  status: string;
  createdAt: string;
  cancelReason?: string | null;
  customer?: { id: string; email?: string; name?: string } | null;
  orderItems?: {
    id: string;
    quantity: number;
    specialInstructions?: string;
    foodItem?: { name: string } | null;
  }[];
}

// A recalled order = still active (PREPARING/READY) but its cancelReason
// starts with "RECALL:". Backend uses this convention to avoid a schema change.
const RECALL_PREFIX = 'RECALL:';
function getRecallReason(order: Pick<Order, 'cancelReason' | 'status'>): string | null {
  if (!order.cancelReason) return null;
  if (order.status === 'CANCELLED') return null;
  if (!order.cancelReason.startsWith(RECALL_PREFIX)) return null;
  return order.cancelReason.slice(RECALL_PREFIX.length).trim() || 'Sent back to kitchen';
}



// ─── KDS Order Card ─────────────────────────────────

function OrderCard({ order, onStatusUpdate, onRecall, statusLoading, isChecked, onToggleItem, isFocused, index }: {
  order: Order;
  onStatusUpdate: (id: string, status: OrderStatus) => void;
  onRecall: (order: Order) => void;
  statusLoading: string | null;
  isChecked: (itemId: string) => boolean;
  onToggleItem: (itemId: string) => void;
  isFocused: boolean;
  index: number;
}) {
  const recallReason = getRecallReason(order);
  const isRecalled = !!recallReason;

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
      className={`premium-card relative flex flex-col overflow-hidden ${isNew ? 'status-urgent' : ''} ${isUrgent ? 'ring-2 ring-[var(--color-warning)]/50' : ''} ${isRecalled ? 'ring-2 ring-[var(--color-destructive)]' : ''} ${isFocused ? 'ring-4 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-background)]' : ''}`}
      style={{ animation: 'slide-up 0.35s cubic-bezier(0.22,1,0.36,1)' }}
    >
      {/* Position badge for keyboard shortcut */}
      {index < 9 && (
        <div className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md bg-black/40 font-mono text-xs font-bold text-white/90 backdrop-blur">
          {index + 1}
        </div>
      )}
      {isRecalled && (
        <div className="flex items-start gap-2 border-b border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/15 px-4 py-2 text-[var(--color-destructive)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-wider">
            Recalled · <span className="font-normal normal-case tracking-normal">{recallReason}</span>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className={`relative ${s.bg} p-4 text-white`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-display text-2xl font-bold leading-tight tracking-tight">
              {order.customer?.name || 'Takeaway'}

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
          {order.orderItems?.map((item: any) => {
            const checked = isChecked(item.id);
            const interactive = order.status === 'PREPARING' || order.status === 'ACCEPTED';
            return (
              <li key={item.id} className="border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => interactive && onToggleItem(item.id)}
                  disabled={!interactive}
                  className={`flex w-full items-baseline gap-3 rounded-lg text-left transition ${
                    interactive ? 'cursor-pointer hover:bg-[var(--color-muted)]/60 px-2 -mx-2 py-1' : 'cursor-default'
                  } ${checked ? 'opacity-50 line-through decoration-2' : ''}`}
                  title={interactive ? (checked ? 'Mark as pending' : 'Mark as done') : undefined}
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                    checked ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white' : 'border-[var(--color-border)]'
                  } ${!interactive ? 'opacity-40' : ''}`}>
                    {checked && <CheckCheck className="h-3 w-3" />}
                  </span>
                  <span className="font-mono text-xl font-bold text-[var(--color-primary)] tabular-nums">
                    {item.quantity}×
                  </span>
                  <span className="flex-1 font-display text-lg font-semibold leading-tight text-[var(--color-foreground)]">
                    {item.foodItem?.name || 'Unknown Item'}
                  </span>
                </button>
                {item.specialInstructions && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-3 py-2 text-sm font-medium text-[var(--color-warning)]">
                    <span className="mt-0.5">📝</span>
                    <span className="flex-1">{item.specialInstructions}</span>
                  </div>
                )}
              </li>
            );
          })}
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
          <>
            <button
              onClick={() => onStatusUpdate(order.id, 'COMPLETED')}
              disabled={statusLoading === order.id}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-success)] py-3 text-base font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
            >
              {statusLoading === order.id ? <RefreshCw className="h-5 w-5 animate-spin" /> : <><CheckCheck className="h-5 w-5" /> Complete Order</>}
            </button>
            <button
              onClick={() => onRecall(order)}
              disabled={statusLoading === order.id}
              className="rounded-xl border border-[var(--color-destructive)]/40 px-4 text-[var(--color-destructive)] transition hover:bg-[var(--color-destructive)]/10 disabled:opacity-50"
              title="Recall to kitchen"
            >
              <Undo2 className="h-5 w-5" />
            </button>
          </>
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
  const [activeTab, setActiveTab] = useState<'active' | 'recall' | 'completed' | 'stock'>('active');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logout = useAuthStore((state) => state.logout);
  const checkoff = useItemCheckoff();

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

  const handleRecall = useCallback(async (order: Order) => {
    const reason = window.prompt(
      `Recall order #${order.id.slice(0, 6)} back to the kitchen?\n\nReason (customer complaint, cold food, wrong item…):`,
      'Customer sent it back',
    );
    if (reason === null) return; // cancelled dialog
    setStatusLoading(order.id);
    try {
      const updated = await recallOrder(order.id, reason);
      // Optimistic local move — the socket will also deliver this, but updating
      // immediately keeps the UI snappy when the user recalls from Completed.
      setCompleted((prev) => prev.filter((o) => o.id !== updated.id));
      setOrders((prev) => {
        const without = prev.filter((o) => o.id !== updated.id);
        return [updated as unknown as Order, ...without];
      });
    } catch (err: any) {
      console.error('Failed to recall order:', err);
      alert(err?.message || 'Failed to recall order');
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
  const recalledOrders = useMemo(
    () => orders.filter((o) => getRecallReason(o) !== null),
    [orders],
  );
  const visibleOrders = useMemo(() => {
    if (activeTab === 'active') return activeOrders;
    if (activeTab === 'recall') return recalledOrders;
    if (activeTab === 'completed') return completed;
    return [];
  }, [activeTab, activeOrders, recalledOrders, completed]);


  const advanceOrder = useCallback((order: Order) => {
    const next: Record<string, OrderStatus | undefined> = {
      PLACED: 'PREPARING',
      ACCEPTED: 'PREPARING',
      PREPARING: 'READY',
      READY: 'COMPLETED',
    };
    const nextStatus = next[order.status];
    if (nextStatus) handleStatusUpdate(order.id, nextStatus);
  }, [handleStatusUpdate]);

  // Keyboard shortcuts
  useEffect(() => {
    const isTyping = (el: EventTarget | null) => {
      const t = el as HTMLElement | null;
      if (!t) return false;
      const tag = t.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t as any).isContentEditable;
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;

      if (e.key === 'Escape') {
        if (showHelp) setShowHelp(false);
        else setFocusIndex(null);
        return;
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }
      if (showHelp) return;

      const key = e.key.toLowerCase();
      if (key === 'f') { e.preventDefault(); toggleFullscreen(); return; }
      if (key === 's') { e.preventDefault(); setSoundEnabled((v) => !v); return; }
      if (key === 'a') { e.preventDefault(); setAutoRefresh((v) => !v); return; }
      if (key === 'r') { e.preventDefault(); loadOrders(); return; }
      if (key === 't') {
        e.preventDefault();
        setActiveTab((t) => {
          const order: Array<'active' | 'recall' | 'completed'> = ['active', 'recall', 'completed'];
          const i = order.indexOf(t as any);
          return order[(i + 1) % order.length];
        });
        setFocusIndex(null);
        return;
      }


      // Number keys 1-9 → focus by position
      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < visibleOrders.length) {
          e.preventDefault();
          setFocusIndex(idx);
        }
        return;
      }

      // Focused-order shortcuts
      if (focusIndex === null) return;
      const order = visibleOrders[focusIndex];
      if (!order) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advanceOrder(order);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (order.status !== 'CANCELLED' && order.status !== 'COMPLETED') {
          handleStatusUpdate(order.id, 'CANCELLED');
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex((i) => Math.min((i ?? -1) + 1, visibleOrders.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex((i) => Math.max((i ?? 1) - 1, 0));
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showHelp, focusIndex, visibleOrders, advanceOrder, handleStatusUpdate, loadOrders, toggleFullscreen]);

  // Clamp focus when list shrinks
  useEffect(() => {
    if (focusIndex !== null && focusIndex >= visibleOrders.length) {
      setFocusIndex(visibleOrders.length > 0 ? visibleOrders.length - 1 : null);
    }
  }, [visibleOrders.length, focusIndex]);


  return (
    <div ref={containerRef} className={`min-h-screen flex bg-[var(--color-background)] ${isFullscreen ? 'kds-fullscreen' : ''}`}>
      {/* Sidebar — collapsed in full-screen mode */}
      {!isFullscreen && (
        <aside className="flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-[var(--shadow-glow)]" style={{ background: 'var(--gradient-primary)' }}>
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold leading-tight tracking-tight text-[var(--color-foreground)]">Chief KDS</h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">Kitchen Display</p>
            </div>
          </div>

          <div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${isConnected ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]'}`}>
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-[var(--color-success)]' : 'bg-[var(--color-destructive)]'} ${isConnected ? 'animate-pulse' : ''}`} />
            {isConnected ? 'Live · connected' : 'Offline · reconnecting'}
          </div>

          <nav className="flex flex-1 flex-col gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-2.5 rounded-lg p-3 text-left transition ${
                activeTab === 'active'
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-inner'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <CookingPot className="h-4 w-4" />
              Active Orders
              {activeOrders.length > 0 && (
                <span className="ml-auto rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                  {activeOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('recall')}
              className={`flex items-center gap-2.5 rounded-lg p-3 text-left transition ${
                activeTab === 'recall'
                  ? 'bg-[var(--color-destructive)]/15 text-[var(--color-destructive)] shadow-inner'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <Undo2 className="h-4 w-4" />
              Recall Lane
              {recalledOrders.length > 0 && (
                <span className="ml-auto rounded-full bg-[var(--color-destructive)] px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                  {recalledOrders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-2.5 rounded-lg p-3 text-left transition ${
                activeTab === 'completed'
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-inner'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <CheckCheck className="h-4 w-4" />
              Completed
              {completed.length > 0 && (
                <span className="ml-auto rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--color-muted-foreground)]">
                  {completed.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-2.5 rounded-lg p-3 text-left transition ${
                activeTab === 'stock'
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-inner'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <Package className="h-4 w-4" />
              Prep Stock
            </button>
          </nav>
          <div className="mt-auto flex flex-col gap-1 border-t border-[var(--color-border)] pt-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-2 rounded-lg p-3 text-sm font-medium transition ${
                soundEnabled ? 'text-[var(--color-success)] hover:bg-[var(--color-success)]/10' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {soundEnabled ? 'Sound On' : 'Sound Off'}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-lg p-3 text-sm font-medium text-[var(--color-destructive)] transition hover:bg-[var(--color-destructive)]/10"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </aside>
      )}

      <main className={`max-h-screen flex-1 overflow-y-auto ${isFullscreen ? 'p-6' : 'p-8'}`}>
        {/* Header */}
        <header className={`mb-6 flex items-center justify-between border-b border-[var(--color-border)] pb-4 ${isFullscreen ? 'kds-header' : ''}`}>
          <div className="min-w-0">
            <h2 className={`font-display font-bold tracking-tight flex items-center gap-3 ${isFullscreen ? 'text-4xl' : 'text-3xl'}`}>
              {activeTab === 'active'
                ? 'Kitchen Display'
                : activeTab === 'recall'
                ? 'Recall Lane'
                : activeTab === 'completed'
                ? 'Completed Orders'
                : 'Prep Stock'}
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]' : 'bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-[var(--color-success)] animate-pulse' : 'bg-[var(--color-destructive)]'}`} />
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </h2>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {activeTab === 'active'
                ? `${activeOrders.length} order${activeOrders.length === 1 ? '' : 's'} in queue`
                : activeTab === 'recall'
                ? `${recalledOrders.length} order${recalledOrders.length === 1 ? '' : 's'} sent back to the kitchen`
                : activeTab === 'completed'
                ? `${completed.length} completed today`
                : 'Set today\u2019s batch quantities'}
            </p>

          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                isFullscreen ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
              title={isFullscreen ? 'Exit full screen' : 'Full screen mode'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Exit' : 'Full Screen'}
            </button>
            {!isFullscreen && (
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  autoRefresh ? 'border-[var(--color-success)]/40 text-[var(--color-success)]' : 'border-[var(--color-border)] text-[var(--color-muted-foreground)]'
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto
              </button>
            )}
            <button
              onClick={loadOrders}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              title="Keyboard shortcuts (press ?)"
            >
              <Keyboard className="h-4 w-4" />
              <kbd className="hidden font-mono text-xs opacity-70 md:inline">?</kbd>
            </button>
          </div>
        </header>

        {activeTab === 'stock' ? (
          <PrepStockTab />
        ) : activeTab === 'active' ? (
          <>
            <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
              {activeOrders.length === 0 ? (
                <div className="col-span-full text-center py-20 text-[var(--color-muted-foreground)]">
                  <ChefHat className="w-20 h-20 mx-auto mb-4 opacity-10" />
                  <p className="text-2xl font-medium">No active orders</p>
                  <p className="text-lg">Waiting for new orders to arrive...</p>
                </div>
              ) : (
                activeOrders.map((order, index) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    index={index}
                    isFocused={focusIndex === index}
                    onStatusUpdate={handleStatusUpdate}
                    onRecall={handleRecall}
                    statusLoading={statusLoading}
                    isChecked={checkoff.isChecked}
                    onToggleItem={checkoff.toggle}
                  />
                ))
              )}
            </div>
          </>
        ) : activeTab === 'recall' ? (
          <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
            {recalledOrders.length === 0 ? (
              <div className="col-span-full text-center py-20 text-[var(--color-muted-foreground)]">
                <Undo2 className="w-20 h-20 mx-auto mb-4 opacity-10" />
                <p className="text-2xl font-medium">Nothing recalled</p>
                <p className="text-lg">Recalled orders will land here so you can prioritise them.</p>
              </div>
            ) : (
              recalledOrders.map((order, index) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  index={index}
                  isFocused={focusIndex === index}
                  onStatusUpdate={handleStatusUpdate}
                  onRecall={handleRecall}
                  statusLoading={statusLoading}
                  isChecked={checkoff.isChecked}
                  onToggleItem={checkoff.toggle}
                />
              ))
            )}
          </div>
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
                  className="premium-card flex flex-col opacity-90 overflow-hidden"
                >
                  <div
                    className={`text-white p-4 font-bold flex justify-between items-center ${
                      order.status === 'CANCELLED' ? 'bg-gray-500' : 'bg-green-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{order.customer?.name || 'Takeaway'}</span>
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
                          <span>{item.quantity}x {item.foodItem?.name || 'Unknown'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {order.status === 'COMPLETED' && (
                    <div className="border-t border-[var(--color-border)] bg-black/10 p-3">
                      <button
                        onClick={() => handleRecall(order)}
                        disabled={statusLoading === order.id}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-destructive)]/40 py-2.5 text-sm font-bold text-[var(--color-destructive)] transition hover:bg-[var(--color-destructive)]/10 disabled:opacity-50"
                        title="Send this order back to the kitchen"
                      >
                        {statusLoading === order.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <><Undo2 className="h-4 w-4" /> Recall to Kitchen</>}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
      <KeyboardShortcutsHelp open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}


export default function App() {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Login />;
  return <KitchenDashboard />;
}
