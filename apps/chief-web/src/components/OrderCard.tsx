import { AlertTriangle, RefreshCw, CookingPot, X, CheckCheck, Undo2 } from 'lucide-react';
import type { OrderStatus } from '../api';

export interface Order {
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

const RECALL_PREFIX = 'RECALL:';
export function getRecallReason(order: Pick<Order, 'cancelReason' | 'status'>): string | null {
  if (!order.cancelReason) return null;
  if (order.status === 'CANCELLED') return null;
  if (!order.cancelReason.startsWith(RECALL_PREFIX)) return null;
  return order.cancelReason.slice(RECALL_PREFIX.length).trim() || 'Sent back to kitchen';
}

export function OrderCard({ order, onStatusUpdate, onRecall, statusLoading, isChecked, onToggleItem, isFocused, index }: {
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
