import {
  ChefHat, LogOut, CookingPot, CheckCheck, RefreshCw, Maximize2, Minimize2,
  Bell, BellOff, Keyboard, Package, Undo2, UtensilsCrossed, Sun, Moon,
  Wifi, WifiOff, Menu, X, Zap, Clock
} from 'lucide-react';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { fetchActiveOrders, updateOrderStatus, recallOrder } from '../api';
import type { OrderStatus } from '../api';
import { useAuthStore } from '../authStore';
import { KeyboardShortcutsHelp } from '../components/KeyboardShortcutsHelp';
import { PrepStockTab } from '../components/PrepStockTab';
import { MenuManageTab } from '../components/MenuManageTab';
import { useItemCheckoff } from '../hooks/useItemCheckoff';
import { useNavigate, useLocation } from 'react-router-dom';
import { OrderCard, type Order } from '../components/OrderCard';
import { getRecallReason } from '../lib/orderRecall';

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
      gain.gain.linearRampToValueAtTime(0, start + dur);
      osc.start(start); osc.stop(start + dur);
    };
    playTone(523, 0, 0.12);
    playTone(659, 0.1, 0.15);
    playTone(784, 0.2, 0.2);
  } catch {}
}

type ActiveTab = 'active' | 'recall' | 'completed' | 'stock' | 'menu';

export function KitchenDashboardPage({ dark, onToggleTheme }: { dark?: boolean; onToggleTheme?: () => void }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const activeTab = (location.pathname === '/' ? 'active' : location.pathname.split('/')[1]) as ActiveTab;
  const setActiveTab = useCallback((tab: string) => navigate(`/${tab === 'active' ? '' : tab}`), [navigate]);

  const [orders, setOrders]             = useState<Order[]>([]);
  const [completed, setCompleted]       = useState<Order[]>([]);
  const [isConnected, setIsConnected]   = useState(false);
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
  const [autoRefresh, setAutoRefresh]   = useState(true);
  const [showHelp, setShowHelp]         = useState(false);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [focusIndex, setFocusIndex]     = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logout   = useAuthStore((state) => state.logout);
  const checkoff = useItemCheckoff();

  const loadOrders = useCallback(async () => {
    try {
      const data = await fetchActiveOrders();
      setOrders(data.filter((o: Order) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'));
      setCompleted(data.filter((o: Order) => o.status === 'COMPLETED' || o.status === 'CANCELLED'));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, []);

  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    setStatusLoading(orderId);
    try { await updateOrderStatus(orderId, newStatus); }
    catch (err) { console.error('Failed to update order status:', err); }
    finally { setStatusLoading(null); }
  }, []);

  const handleRecall = useCallback(async (order: Order) => {
    const reason = window.prompt(
      `Recall order back to the kitchen?\n\nReason (cold food, wrong item…):`,
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

    socket.on('connect',    () => setIsConnected(true));
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

  const activeOrders  = orders;
  const recalledOrders = useMemo(() => orders.filter((o) => getRecallReason(o) !== null), [orders]);
  const visibleOrders = useMemo(() => {
    if (activeTab === 'active')    return activeOrders;
    if (activeTab === 'recall')    return recalledOrders;
    if (activeTab === 'completed') return completed;
    return [];
  }, [activeTab, activeOrders, recalledOrders, completed]);

  const advanceOrder = useCallback((order: Order) => {
    const next: Record<string, OrderStatus | undefined> = {
      PLACED: 'PREPARING', ACCEPTED: 'PREPARING', PREPARING: 'READY', READY: 'COMPLETED',
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
        e.preventDefault(); setShowHelp((v) => !v); return;
      }
      if (showHelp) return;

      const key = e.key.toLowerCase();
      if (key === 'f') { e.preventDefault(); toggleFullscreen(); return; }
      if (key === 's') { e.preventDefault(); setSoundEnabledBoth((v) => !v); return; }
      if (key === 'a') { e.preventDefault(); setAutoRefresh((v) => !v); return; }
      if (key === 'r') { e.preventDefault(); loadOrders(); return; }
      if (key === 't') {
        e.preventDefault();
        const order = ['active', 'stock', 'menu'];
        const i = order.indexOf(activeTab as any);
        if (i !== -1) {
          setActiveTab(order[(i + 1) % order.length]);
        }
        setFocusIndex(null); return;
      }

      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < visibleOrders.length) { e.preventDefault(); setFocusIndex(idx); }
        return;
      }

      if (focusIndex === null) return;
      const order = visibleOrders[focusIndex];
      if (!order) return;

      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advanceOrder(order); }
      else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (order.status !== 'CANCELLED' && order.status !== 'COMPLETED') handleStatusUpdate(order.id, 'CANCELLED');
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault(); setFocusIndex((i) => Math.min((i ?? -1) + 1, visibleOrders.length - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault(); setFocusIndex((i) => Math.max((i ?? 1) - 1, 0));
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

  // Tab config
  const tabs: { id: ActiveTab; label: string; icon: any; count?: number }[] = [
    { id: 'active',    label: 'Active',    icon: CookingPot, count: activeOrders.length },
    { id: 'stock',     label: 'Prep Stock', icon: Package },
    { id: 'menu',      label: 'Menu',       icon: UtensilsCrossed },
  ];

  // Header title
  const headerMap: Record<ActiveTab, { title: string; desc: string }> = {
    active:    { title: 'Kitchen Display', desc: `${activeOrders.length} order${activeOrders.length !== 1 ? 's' : ''} in queue` },
    recall:    { title: 'Recall Lane',     desc: `${recalledOrders.length} recalled order${recalledOrders.length !== 1 ? 's' : ''}` },
    completed: { title: 'Completed',       desc: `${completed.length} completed today` },
    stock:     { title: 'Prep Stock',      desc: "Set today's batch quantities" },
    menu:      { title: 'Menu Manager',    desc: 'Add, edit and remove menu items' },
  };
  const { title, desc } = headerMap[activeTab] ?? headerMap.active;

  const EmptyState = ({ icon: Icon, message, sub }: { icon: any; message: string; sub: string }) => (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl grid place-items-center mb-5 opacity-20"
        style={{ background: 'rgba(249,115,22,.15)' }}>
        <Icon className="w-10 h-10 text-[var(--color-primary)]" />
      </div>
      <p className="text-xl font-bold text-[var(--color-foreground)] opacity-40">{message}</p>
      <p className="text-sm text-[var(--color-muted-foreground)] mt-1 opacity-60">{sub}</p>
    </div>
  );

  return (
    <div ref={containerRef} className={`min-h-screen flex bg-[var(--color-background)] text-[var(--color-foreground)] ${isFullscreen ? 'kds-fullscreen' : ''}`}>
      {/* Mobile overlay */}
      {!isFullscreen && sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── Sidebar ──────────────────────────────────────────────────── */}
      {!isFullscreen && (
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col chief-sidebar
          transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* Brand */}
          <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
                style={{ background: 'var(--gradient-primary)' }}>
                <ChefHat className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Kitchen OS</p>
                <p className="text-white/35 text-[10px] font-medium">Chef Dashboard</p>
              </div>
            </div>
            <button className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/6 transition"
              onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Connection status */}
          <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium"
            style={{
              background: isConnected ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)',
              border: `1px solid ${isConnected ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)'}`,
              color: isConnected ? '#4ade80' : '#f87171',
            }}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? (
              <><Wifi className="w-3 h-3" /> Live connection</>
            ) : (
              <><WifiOff className="w-3 h-3" /> Offline</>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button key={id}
                onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
                className={`chief-nav-item ${activeTab === id ? 'active' : ''}`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {count !== undefined && count > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{
                      background: id === 'recall' ? 'rgba(239,68,68,.25)' : 'rgba(249,115,22,.25)',
                      color: id === 'recall' ? '#f87171' : '#fb923c',
                    }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom controls */}
          <div className="px-3 pb-4 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: '0.75rem', marginTop: '0' }}>
            {onToggleTheme && (
              <button onClick={onToggleTheme} className="chief-nav-item">
                {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                <span>{dark ? 'Light mode' : 'Dark mode'}</span>
              </button>
            )}
            <button onClick={() => setSoundEnabledBoth(!soundEnabled)}
              className={`chief-nav-item ${soundEnabled ? '!text-green-400 hover:!bg-green-500/10' : ''}`}>
              {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              <span>{soundEnabled ? 'Sound on' : 'Sound off'}</span>
            </button>
            <button onClick={logout} className="chief-nav-item !text-red-400 hover:!bg-red-500/10">
              <LogOut className="w-4 h-4" /> <span>Sign out</span>
            </button>
          </div>
        </aside>
      )}

      {/* ─── Main Content ──────────────────────────────────────────────── */}
      <main className={`max-h-screen flex-1 flex flex-col overflow-hidden ${isFullscreen ? 'p-0' : ''}`}>
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(13,21,37,.8)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            {!isFullscreen && (
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/6 transition">
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className={`font-display font-bold text-[var(--color-foreground)] leading-tight ${isFullscreen ? 'text-3xl' : 'text-xl'}`}>
                  {title}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isConnected
                    ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                    : 'bg-red-500/15 text-red-400 border border-red-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{desc}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {onToggleTheme && !isFullscreen && (
              <button onClick={onToggleTheme} title={dark ? 'Light mode' : 'Dark mode'}
                className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition">
                {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            {!isFullscreen && (
              <button onClick={() => setAutoRefresh(!autoRefresh)}
                title={autoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}
                className={`p-2 rounded-lg border transition ${
                  autoRefresh
                    ? 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                    : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]'
                }`}>
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              </button>
            )}
            <button onClick={loadOrders} title="Refresh orders"
              className="p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition">
              <Zap className="w-4 h-4" />
            </button>
            <button onClick={() => setShowHelp(true)} title="Keyboard shortcuts (?)"
              className="hidden md:flex p-2 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition">
              <Keyboard className="w-4 h-4" />
            </button>
            <button onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen (F)'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition ${
                isFullscreen
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                  : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
              }`}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </header>

        {/* Tab pills (fullscreen mode top bar) */}
        {isFullscreen && (
          <div className="flex gap-2 px-6 py-3 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
            {tabs.slice(0, 3).map(({ id, label, icon: Icon, count }) => (
              <button key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                  activeTab === id
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] border border-[var(--color-border)]'
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {label}
                {count !== undefined && count > 0 && (
                  <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 rounded-full">{count}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === 'menu' ? (
            <MenuManageTab />
          ) : activeTab === 'stock' ? (
            <PrepStockTab />
          ) : activeTab === 'active' ? (
            <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
              {activeOrders.length === 0
                ? <EmptyState icon={ChefHat} message="No active orders" sub="Waiting for new orders to arrive…" />
                : activeOrders.map((order, index) => (
                  <OrderCard key={order.id} order={order} index={index}
                    isFocused={focusIndex === index}
                    onStatusUpdate={handleStatusUpdate} onRecall={handleRecall}
                    statusLoading={statusLoading}
                    isChecked={checkoff.isChecked} onToggleItem={checkoff.toggle} />
                ))
              }
            </div>
          ) : activeTab === 'recall' ? (
            <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
              {recalledOrders.length === 0
                ? <EmptyState icon={Undo2} message="Nothing recalled" sub="Recalled orders will land here so you can prioritise them." />
                : recalledOrders.map((order, index) => (
                  <OrderCard key={order.id} order={order} index={index}
                    isFocused={focusIndex === index}
                    onStatusUpdate={handleStatusUpdate} onRecall={handleRecall}
                    statusLoading={statusLoading}
                    isChecked={checkoff.isChecked} onToggleItem={checkoff.toggle} />
                ))
              }
            </div>
          ) : (
            /* Completed orders */
            <div className={`grid gap-4 ${isFullscreen ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'}`}>
              {completed.length === 0
                ? <EmptyState icon={CheckCheck} message="No completed orders yet" sub="Completed and cancelled orders appear here." />
                : completed.map((order) => {
                  const isCancelled = order.status === 'CANCELLED';
                  const tokenNumber = order.tokenNumber ?? parseInt(order.id.slice(-4), 16) % 9000 + 1000;
                  return (
                    <div key={order.id} className="kds-card opacity-75 flex flex-col">
                      <div className="kds-header-strip" style={{
                        background: isCancelled
                          ? 'linear-gradient(90deg, rgba(100,116,139,.12), rgba(100,116,139,.04))'
                          : 'linear-gradient(90deg, rgba(34,197,94,.12), rgba(34,197,94,.04))',
                      }}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[var(--color-foreground)]">{order.customer?.name || 'Guest'}</span>
                            <span className="token-badge text-xs">Token #{tokenNumber}</span>
                          </div>
                          <span className={`status-badge mt-1 ${isCancelled ? 'status-badge-error' : 'status-badge-ready'}`}>
                            {isCancelled ? '✕ Cancelled' : '✓ Completed'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)] font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="p-4">
                        <ul className="space-y-1.5">
                          {order.orderItems?.map((item: any) => (
                            <li key={item.id} className="flex items-center gap-2 text-sm">
                              <span className="font-mono font-bold text-[var(--color-primary)]">{item.quantity}×</span>
                              <span className="text-[var(--color-foreground)]">{item.foodItem?.name || 'Unknown'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {order.status === 'COMPLETED' && (
                        <div className="p-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                          <button onClick={() => handleRecall(order)} disabled={statusLoading === order.id}
                            className="kds-btn kds-btn-danger w-full">
                            {statusLoading === order.id
                              ? <RefreshCw className="w-4 h-4 animate-spin" />
                              : <><Undo2 className="w-4 h-4" /> Recall to Kitchen</>}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              }
            </div>
          )}
        </div>
      </main>

      <KeyboardShortcutsHelp open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
