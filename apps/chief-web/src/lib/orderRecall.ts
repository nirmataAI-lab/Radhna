const RECALL_PREFIX = 'RECALL:';

export function getRecallReason(order: {
  cancelReason?: string | null;
  status: string;
}): string | null {
  if (!order.cancelReason) return null;
  if (order.status === 'CANCELLED') return null;
  if (!order.cancelReason.startsWith(RECALL_PREFIX)) return null;
  return order.cancelReason.slice(RECALL_PREFIX.length).trim() || 'Sent back to kitchen';
}
