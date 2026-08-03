import { ChefHat, LogOut, CookingPot, CheckCheck, RefreshCw, Maximize2, Minimize2, Bell, BellOff, Keyboard, Package, Undo2, UtensilsCrossed } from 'lucide-react';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { fetchActiveOrders, updateOrderStatus, recallOrder } from '../api';
import type { OrderStatus } from '../api';
import { useAuthStore } from '../authStore';
import { KeyboardShortcutsHelp } from '../components/KeyboardShortcutsHelp';
import { PrepStockTab } from '../components/PrepStockTab';
import { MenuManageTab } from '../components/MenuManageTab';
import { useItemCheckoff } from '../hooks/useItemCheckoff';
import { SUPPORTED_LANGS } from '../lib/i18n';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from 'ui-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { OrderCard, type Order } from '../components/OrderCard';
import { getRecallReason } from '../lib/orderRecall';

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    playTone(523, 0, 0.12);
    playTone(659, 0.1, 0.15);
    playTone(784, 0.2, 0.2);
  } catch {}
}

export function KitchenDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname === '/' ? 'active' : location.pathname.split('/')[1] as 'active' | 'recall' | 'completed' | 'stock' | 'menu';
  const setActiveTab = useCallback(
    (tab: string) => navigate(`/${tab === 'active' ? '' : tab}`),
    [navigate],
  );
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [completed, setCompleted] = useState<Order[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const setSoundEnabledBoth = (val: boolean | ((prev: boolean) => boolean)) => {
    setSoundEnabled((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      soundEnabledRef.current = next;
      return next;
    });
  };
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
    if (reason === null) return;
    setStatusLoading(order.id);
    try {
      const updated = await recallOrder(order.id, reason);
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

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadOrders]);

  useEffect(() => {
    loadOrders();
    const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';
    const token = useAuthStore.getState().token;
    const socket: Socket = io(WS_URL, { transports: ['websocket', 'polling'], auth: { token } });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('newOrder', (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      if (soundEnabledRef.current) playNotificationSound();
    });

    socket.on('orderStatusUpdate', (updatedOrder: Order) => {
      setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
      setCompleted((prev) => prev.filter((o) => o.id !== updatedOrder.id));
      if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
        setCompleted((prev) => [updatedOrder, ...prev]);
      } else {
        setOrders((prev) => {
          const exists = prev.find((o) => o.id === updatedOrder.id);
          if (exists) return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
          return [updatedOrder, ...prev];
        });
      }
    });

    return () => { socket.disconnect(); };
  }, [loadOrders]);

  const activeOrders = orders;
  const recalledOrders = useMemo(() => orders.filter((o) => getRecallReason(o) !== null), [orders]);
  const visibleOrders = useMemo(() => {
    if (activeTab === 'active') return activeOrders;
    if (activeTab === 'recall') return recalledOrders;
    if (activeTab === 'completed') return completed;
    return [];
  }, [activeTab, activeOrders, recalledOrders, completed]);

  const advanceOrder = useCallback((order: Order) => {
    const next: Record<string, OrderStatus | undefined> = { PLACED: 'PREPARING', ACCEPTED: 'PREPARING', PREPARING: 'READY', READY: 'COMPLETED' };
    const nextStatus = next[order.status];
    if (nextStatus) handleStatusUpdate(order.id, nextStatus);
  }, [handleStatusUpdate]);

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
      if (key === 's') { e.preventDefault(); setSoundEnabledBoth((v) => !v); return; }
      if (key === 'a') { e.preventDefault(); setAutoRefresh((v) => !v); return; }
      if (key === 'r') { e.preventDefault(); loadOrders(); return; }
      if (key === 't') {
        e.preventDefault();
        const order = ['active', 'recall', 'completed'];
        const i = order.indexOf(activeTab as any);
        const next = order[(i + 1) % order.length];
        setActiveTab(next);
        setFocusIndex(null);
        return;
      }

      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < visibleOrders.length) {
          e.preventDefault();
          setFocusIndex(idx);
        }
        return;
      }

      if (focusIndex === null) return;
      const order = visibleOrders[focusIndex];
      if (!order) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advanceOrder(order);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (order.status !== 'CANCELLED' && order.status !== 'COMPLETED') handleStatusUpdate(order.id, 'CANCELLED');
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
  }, [showHelp, focusIndex, visibleOrders, advanceOrder, handleStatusUpdate, loadOrders, toggleFullscreen, activeTab, setActiveTab]);

  useEffect(() => {
    if (focusIndex !== null && focusIndex >= visibleOrders.length) {
      setFocusIndex(visibleOrders.length > 0 ? visibleOrders.length - 1 : null);
    }
  }, [visibleOrders.length, focusIndex]);

  return (
    <div ref={containerRef} className={`min-h-screen flex bg-[var(--color-background)] ${isFullscreen ? 'kds-fullscreen' : ''}`}>
      {!isFullscreen && (
        <aside className="flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-[var(--shadow-glow)]" style={{ background: 'var(--gradient-primary)' }}>
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold leading-tight tracking-tight text-[var(--color-foreground)]">{t('app.title')}</h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">{t('app.subtitle')}</p>
            </div>
          </div>

          <div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${isConnected ? 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)]'}`}>
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-[var(--color-success)]' : 'bg-[var(--color-destructive)]'} ${isConnected ? 'animate-pulse' : ''}`} />
            {isConnected ? t('status.live') : t('status.offline')}
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
              {t('nav.active')}
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
              {t('nav.recall')}
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
              {t('nav.completed')}
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
              {t('nav.stock')}
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-2.5 rounded-lg p-3 text-left transition ${
                activeTab === 'menu'
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] shadow-inner'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}
            >
              <UtensilsCrossed className="h-4 w-4" />
              Menu
            </button>
          </nav>
          <div className="mt-auto flex flex-col gap-1 border-t border-[var(--color-border)] pt-4">
            <div className="px-1 pb-1"><LanguageSwitcher supportedLangs={SUPPORTED_LANGS} /></div>
            <button
              onClick={() => setSoundEnabledBoth(!soundEnabled)}
              className={`flex items-center gap-2 rounded-lg p-3 text-sm font-medium transition ${
                soundEnabled ? 'text-[var(--color-success)] hover:bg-[var(--color-success)]/10' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
              }`}
            >
              {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {soundEnabled ? t('sidebar.soundOn') : t('sidebar.soundOff')}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-lg p-3 text-sm font-medium text-[var(--color-destructive)] transition hover:bg-[var(--color-destructive)]/10"
            >
              <LogOut className="h-4 w-4" /> {t('sidebar.logout')}
            </button>
          </div>
        </aside>
      )}

      <main className={`max-h-screen flex-1 overflow-y-auto ${isFullscreen ? 'p-6' : 'p-8'}`}>
        <header className={`mb-6 flex items-center justify-between border-b border-[var(--color-border)] pb-4 ${isFullscreen ? 'kds-header' : ''}`}>
          <div className="min-w-0">
            <h2 className={`font-display font-bold tracking-tight flex items-center gap-3 ${isFullscreen ? 'text-4xl' : 'text-3xl'}`}>
              {activeTab === 'active'
                ? 'Kitchen Display'
                : activeTab === 'recall'
                ? 'Recall Lane'
                : activeTab === 'completed'
                ? 'Completed Orders'
                : activeTab === 'stock'
                ? 'Prep Stock'
                : 'Menu Manager'}
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
                : activeTab === 'stock'
                ? 'Set today\u2019s batch quantities'
                : 'Add, edit and remove menu items and categories'}
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

        {activeTab === 'menu' ? (
          <MenuManageTab />
        ) : activeTab === 'stock' ? (
          <PrepStockTab />
        ) : activeTab === 'active' ? (
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
                      <span className="text-lg">{order.customer?.name || 'Guest Order'}</span>
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
