'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { useAuthStore } from '@/lib/store/authStore';
import { submitReview } from '@/lib/api/menu';
import {
  CheckCircle2, Clock, CookingPot, Truck, XCircle, Loader2, ArrowLeft,
  Star, ThumbsUp,
} from 'lucide-react';

interface TrackedOrder {
  id: string;
  status: string;
  subtotal?: string;
  discount?: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  orderItems?: { quantity: number; foodItem?: { id: string; name: string } }[];
}

const STATUS_FLOW = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];

const STATUS_CONFIG: Record<string, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
  PLACED: { label: 'Order Placed', icon: Clock, color: 'text-yellow-500' },
  ACCEPTED: { label: 'Order Accepted', icon: CheckCircle2, color: 'text-blue-500' },
  PREPARING: { label: 'Being Prepared', icon: CookingPot, color: 'text-orange-500' },
  READY: { label: 'Ready to Serve', icon: Truck, color: 'text-green-500' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, color: 'text-green-600' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-red-500' },
};

function ReviewForm({ items, onSubmitted }: {
  items: { id: string; name: string }[];
  onSubmitted: () => void;
}) {
  const token = useAuthStore((s) => s.token);
  const [selectedItem, setSelectedItem] = useState(items[0]?.id || '');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedItem) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitReview(token, { foodItemId: selectedItem, rating, comment: comment || undefined });
      setSubmitted(true);
      onSubmitted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6 animate-fade-in">
        <ThumbsUp className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="font-bold text-lg">Thank you for your review!</p>
        <p className="text-sm text-muted-foreground">Your feedback helps us improve.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-500" /> Rate Your Order
      </h4>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Item</label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="w-full p-2 border border-border rounded-lg bg-background text-sm"
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-1 transition-all ${star <= rating ? 'text-yellow-400 scale-110' : 'text-gray-200'}`}
              >
                <Star className="w-6 h-6" fill={star <= rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
            rows={2}
            className="w-full p-2 border border-border rounded-lg bg-background resize-none text-sm"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !selectedItem}
          className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Submit Review
        </button>
      </div>
    </form>
  );
}

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchOrder = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/orders/track/${orderId}`
        );
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        if (!cancelled) setOrder(data);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId]);

  const currentStepIndex = order ? STATUS_FLOW.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'CANCELLED';
  const isCompleted = order?.status === 'COMPLETED';
  const discountAmount = order?.discount ? Number(order.discount) : 0;

  const orderItems = order?.orderItems
    ?.map((oi) => ({ id: oi.foodItem?.id || '', name: oi.foodItem?.name || 'Item' }))
    .filter((i) => i.id) || [];

  return (
    <main className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-12 flex-grow">
        <Link href="/menu" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Link>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your order...</p>
          </div>
        ) : error || !order ? (
          <div className="premium-card p-12 text-center max-w-md mx-auto">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">{error || 'This order does not exist.'}</p>
            <Link href="/menu" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10 animate-slide-up">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Order Status</h1>
              <p className="text-muted-foreground">
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">#{order.id.slice(0, 8)}</p>
            </div>

            {/* Status Tracker */}
            <div className="premium-card p-8 mb-8">
              {isCancelled ? (
                <div className="text-center py-6">
                  <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-red-600 mb-2">Order Cancelled</h3>
                  <p className="text-muted-foreground">This order has been cancelled.</p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-0">
                  {STATUS_FLOW.map((status, idx) => {
                    const config = STATUS_CONFIG[status];
                    const Icon = config.icon;
                    const isStepCompleted = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div key={status} className="flex md:flex-col items-center gap-3 md:gap-2 flex-1 relative">
                        <div className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500 ${
                          isStepCompleted
                            ? isCurrent
                              ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse'
                              : 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-medium text-center">
                          <span className={isStepCompleted ? 'text-foreground' : 'text-muted-foreground'}>
                            {config.label}
                          </span>
                        </div>
                        {idx < STATUS_FLOW.length - 1 && (
                          <div className={`hidden md:block absolute h-0.5 w-full left-[60%] top-5 ${
                            isStepCompleted ? 'bg-green-500' : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="premium-card p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">Order Items</h3>
              <div className="space-y-3">
                {order.orderItems?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span>{item.quantity}x {item.foodItem?.name || 'Item'}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal ? Number(order.subtotal).toFixed(2) : Number(order.total).toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">₹{Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Review Form - only shown on completed orders */}
            {isCompleted && orderItems.length > 0 && (
              <div className="premium-card p-6">
                <ReviewForm
                  items={orderItems}
                  onSubmitted={() => {}}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
