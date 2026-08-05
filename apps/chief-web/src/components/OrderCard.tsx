import { AlertTriangle, RefreshCw, CookingPot, X, CheckCheck, Undo2, Clock } from 'lucide-react';
import type { OrderStatus } from '../api';
import { getRecallReason } from '../lib/orderRecall';

export interface Order {
  id: string;
  status: string;
  createdAt: string;
  tokenNumber?: number;
  cancelReason?: string | null;
  customer?: { id: string; email?: string; name?: string } | null;
  orderItems?: {
    id: string;
    quantity: number;
    specialInstructions?: string;
    foodItem?: { name: string } | null;
  }[];
}

function TimerDisplay({ createdAt, status }: { createdAt: string; status: string }) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  const isWarning = mins >= 8 && status !== 'READY' && status !== 'COMPLETED';
  const isUrgent  = mins >= 15 && status !== 'READY' && status !== 'COMPLETED';

  return (
    <div className={`flex items-center gap-1 font-mono text-lg font-bold tabular-nums ${
      isUrgent ? 'timer-urgent' : isWarning ? 'timer-warning' : 'timer-normal'
    }`}>
      <Clock className="w-3.5 h-3.5 opacity-70" />
      {mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}
    </div>
  );
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
  const timeSince  = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
  const isUrgent   = timeSince > 15 && order.status !== 'READY' && order.status !== 'COMPLETED';
  const isNew      = timeSince < 2 && order.status === 'PLACED';
  const isLoading  = statusLoading === order.id;

  // Determine card variant class
  let cardVariant = 'kds-card-new';
  if (order.status === 'PREPARING' || order.status === 'ACCEPTED') cardVariant = 'kds-card-cooking';
  if (order.status === 'READY')    cardVariant = 'kds-card-ready';
  if (isRecalled)                  cardVariant = '';

  // Header strip class
  let headerClass = 'kds-header-new';
  if (order.status === 'PREPARING' || order.status === 'ACCEPTED') headerClass = 'kds-header-cooking';
  if (order.status === 'READY')    headerClass = 'kds-header-ready';
  if (isRecalled)                  headerClass = 'kds-header-recalled';

  // Status badge class
  const statusBadgeClass: Record<string, string> = {
    PLACED:    'status-badge-new',
    ACCEPTED:  'status-badge-new',
    PREPARING: 'status-badge-cooking',
    READY:     'status-badge-ready',
    COMPLETED: 'status-badge-done',
    CANCELLED: 'status-badge-error',
  };
  const statusLabel: Record<string, string> = {
    PLACED:    'New',
    ACCEPTED:  'Accepted',
    PREPARING: 'Preparing',
    READY:     'Ready',
    COMPLETED: 'Done',
    CANCELLED: 'Cancelled',
  };

  const tokenNumber = order.tokenNumber ?? parseInt(order.id.slice(-4), 16) % 9000 + 1000;

  return (
    <div
      className={`kds-card ${cardVariant} flex flex-col animate-slide-up ${
        isUrgent && !isRecalled ? 'kds-card-urgent' : ''
      } ${isFocused ? 'focused' : ''}`}
    >
      {/* Keyboard shortcut badge */}
      {index < 9 && (
        <div className="absolute right-3 top-3 z-10 w-6 h-6 flex items-center justify-center rounded-md text-[10px] font-bold font-mono"
          style={{ background: 'rgba(0,0,0,.5)', color: 'rgba(255,255,255,.7)', backdropFilter: 'blur(4px)' }}>
          {index + 1}
        </div>
      )}

      {/* Recall banner */}
      {isRecalled && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold"
          style={{ background: 'rgba(239,68,68,.15)', borderBottom: '1px solid rgba(239,68,68,.2)', color: '#f87171' }}>
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="uppercase tracking-wide">Recalled</span>
          <span className="font-normal normal-case opacity-80 ml-1">· {recallReason}</span>
        </div>
      )}

      {/* Header strip */}
      <div className={`kds-header-strip ${headerClass}`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-base font-bold text-[var(--color-foreground)] leading-tight">
              {order.customer?.name || 'Guest'}
            </span>
            <span className="token-badge">
              Token #{tokenNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`status-badge ${statusBadgeClass[order.status] || 'status-badge-new'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {statusLabel[order.status] || order.status}
            </span>
            {isNew && (
              <span className="status-badge status-badge-new animate-pulse">🔔 Just arrived</span>
            )}
            {isUrgent && (
              <span className="status-badge status-badge-error">⚠ Urgent</span>
            )}
          </div>
        </div>
        <TimerDisplay createdAt={order.createdAt} status={order.status} />
      </div>

      {/* Items list */}
      <div className="flex-1 p-4">
        <ul className="space-y-2.5">
          {order.orderItems?.map((item) => {
            const checked = isChecked(item.id);
            const interactive = order.status === 'PREPARING' || order.status === 'ACCEPTED';
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => interactive && onToggleItem(item.id)}
                  disabled={!interactive}
                  className={`item-check w-full ${checked ? 'done' : ''} ${!interactive ? 'cursor-default' : ''}`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded-md border-2 grid place-items-center shrink-0 transition-all ${
                    checked
                      ? 'border-[var(--color-success)] bg-[var(--color-success)]'
                      : interactive ? 'border-[var(--color-border-strong)]' : 'border-[var(--color-border)] opacity-40'
                  }`}>
                    {checked && <CheckCheck className="w-3 h-3 text-white" />}
                  </div>
                  {/* Qty */}
                  <span className="font-mono text-lg font-black tabular-nums leading-none"
                    style={{ color: 'var(--color-primary)' }}>
                    {item.quantity}×
                  </span>
                  {/* Name */}
                  <span className={`flex-1 font-semibold text-sm text-[var(--color-foreground)] item-name`}>
                    {item.foodItem?.name || 'Unknown Item'}
                  </span>
                </button>
                {/* Special instructions */}
                {item.specialInstructions && (
                  <div className="mt-1.5 ml-10 flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                    style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.2)', color: '#fbbf24' }}>
                    <span>📝</span>
                    <span>{item.specialInstructions}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 p-3" style={{ borderTop: '1px solid var(--color-border)', background: 'rgba(0,0,0,.2)' }}>
        {order.status === 'CANCELLED' ? (
          <div className="w-full py-2 text-center text-sm font-bold" style={{ color: 'var(--color-destructive)' }}>
            ❌ Order Cancelled
          </div>
        ) : order.status === 'PLACED' || order.status === 'ACCEPTED' ? (
          <>
            <button
              onClick={() => onStatusUpdate(order.id, 'PREPARING')}
              disabled={isLoading}
              className="kds-btn kds-btn-advance"
            >
              {isLoading
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <><CookingPot className="w-4 h-4" /> Start Cooking</>}
            </button>
            <button
              onClick={() => onStatusUpdate(order.id, 'CANCELLED')}
              disabled={isLoading}
              className="kds-btn kds-btn-danger"
              style={{ flex: '0 0 auto', padding: '0.5rem 0.75rem' }}
              title="Cancel Order"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : order.status === 'PREPARING' ? (
          <>
            <button
              onClick={() => onStatusUpdate(order.id, 'READY')}
              disabled={isLoading}
              className="kds-btn kds-btn-ready"
            >
              {isLoading
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <><CheckCheck className="w-4 h-4" /> Mark Ready</>}
            </button>
            <button
              onClick={() => onStatusUpdate(order.id, 'CANCELLED')}
              disabled={isLoading}
              className="kds-btn kds-btn-danger"
              style={{ flex: '0 0 auto', padding: '0.5rem 0.75rem' }}
              title="Cancel Order"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : order.status === 'READY' ? (
          <>
            <button
              onClick={() => onStatusUpdate(order.id, 'COMPLETED')}
              disabled={isLoading}
              className="kds-btn kds-btn-ready"
            >
              {isLoading
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <><CheckCheck className="w-4 h-4" /> Complete</>}
            </button>
            <button
              onClick={() => onRecall(order)}
              disabled={isLoading}
              className="kds-btn kds-btn-danger"
              style={{ flex: '0 0 auto', padding: '0.5rem 0.75rem' }}
              title="Recall to kitchen"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
