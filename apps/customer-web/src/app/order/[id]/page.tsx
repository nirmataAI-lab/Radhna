'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { useAuthStore } from '@/lib/store/authStore';
import { submitReview } from '@/lib/api/menu';
import {
  CheckCircle2, Clock, CookingPot, Truck, XCircle, Loader2, ArrowLeft,
  Star, ThumbsUp, Bell,
} from 'lucide-react';

function playReadyChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    playNote(523.25, 0, 0.2);
    playNote(659.25, 0.15, 0.2);
    playNote(783.99, 0.3, 0.4);
  } catch (e) {
    console.error('Audio chime error', e);
  }
}

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
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchOrder = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/orders/track/${orderId}`
        );
        if (!res.ok) throw new Error('Order not found');
        const data: TrackedOrder = await res.json();
        
        if (!cancelled) {
          // Check for status transition to READY
          if (prevStatusRef.current && prevStatusRef.current !== 'READY' && data.status === 'READY') {
            playReadyChime();
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(`🍽️ Order #${data.id.slice(0, 6).toUpperCase()} is Ready!`, {
                body: 'Your order is ready at the counter. Please collect it!',
                icon: '/favicon.ico',
              });
            }
          }
          prevStatusRef.current = data.status;
          setOrder(data);
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId]);

  const currentStepIndex = order ? STATUS_FLOW.indexOf(order.status) : -1;
  const isCancelled = order?.status === 'CANCELLED';
  const isCompleted = order?.status === 'COMPLETED';
  const isReady = order?.status === 'READY';
  const discountAmount = order?.discount ? Number(order.discount) : 0;

  const orderItems = order?.orderItems
    ?.map((oi) => ({ id: oi.foodItem?.id || '', name: oi.foodItem?.name || 'Item' }))
    .filter((i) => i.id) || [];

  const tokenNumber = order ? `#${order.id.slice(0, 6).toUpperCase()}` : '';

  return (
    <main className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-12 flex-grow">
        <Link href="/menu" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Link>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: 'var(--primary)' }} />
            <p style={{ color: 'var(--muted-foreground)' }}>Loading your order...</p>
          </div>
        ) : error || !order ? (
          <div className="p-12 text-center max-w-md mx-auto rounded-3xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Order Not Found</h2>
            <p className="mb-6" style={{ color: 'var(--muted-foreground)' }}>{error || 'This order does not exist.'}</p>
            <Link href="/menu" className="btn-primary px-6 py-3">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 animate-slide-up">
              <div className="inline-block px-8 py-4 rounded-2xl mb-5 shadow-sm"
                style={{ background: 'color-mix(in srgb, var(--primary) 10%, var(--card))', border: '1.5px dashed color-mix(in srgb, var(--primary) 35%, var(--border))' }}>
                <span className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>Your Token Number</span>
                <span className="text-4xl font-black font-mono tracking-widest" style={{ color: 'var(--primary)' }}>{tokenNumber}</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: 'var(--foreground)' }}>Order Status</h1>
              <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Glowing Order Ready Notification Banner */}
            {isReady && (
              <div className="relative overflow-hidden text-white p-6 rounded-3xl shadow-xl mb-10 text-center animate-fade-in"
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  boxShadow: '0 8px 32px rgba(22,163,74,.4)',
                  border: '1px solid #4ade80'
                }}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2.5 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 grid place-items-center animate-pulse">
                      <Bell className="w-5 h-5 text-yellow-300" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider drop-shadow-md">ORDER READY! 🍽️</h2>
                  </div>
                  <p className="text-sm md:text-base font-medium text-white/90">
                    Your order is prepared and ready at the counter. Please collect it!
                  </p>
                </div>
              </div>
            )}

            {/* Status Tracker */}
            <div className="p-8 mb-8 rounded-3xl shadow-sm overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {isCancelled ? (
                <div className="text-center py-6">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-80" />
                  <h3 className="text-2xl font-bold text-red-600 mb-2">Order Cancelled</h3>
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>This order has been cancelled.</p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-0 relative">
                  {/* Background progress line for desktop */}
                  <div className="hidden md:block absolute h-1 left-10 right-10 top-6 -translate-y-1/2 rounded-full"
                    style={{ background: 'var(--muted)' }} />

                  {/* Active progress line for desktop */}
                  <div className="hidden md:block absolute h-1 left-10 top-6 -translate-y-1/2 rounded-full transition-all duration-700 ease-in-out"
                    style={{
                      background: currentStepIndex > 0 ? '#10b981' : 'transparent',
                      width: `calc(${(currentStepIndex / (STATUS_FLOW.length - 1)) * 100}% - 5rem)`
                    }} />

                  {STATUS_FLOW.map((status, idx) => {
                    const config = STATUS_CONFIG[status];
                    const Icon = config.icon;
                    const isStepCompleted = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div key={status} className="flex md:flex-col items-center gap-4 md:gap-3 flex-1 relative z-10">
                        <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-500 shadow-sm ${
                          isStepCompleted
                            ? isCurrent && !isCompleted
                              ? 'scale-110 shadow-lg'
                              : 'scale-100'
                            : 'scale-95 opacity-50'
                        }`}
                        style={{
                          background: isStepCompleted ? (isCurrent && !isCompleted ? 'var(--primary)' : '#10b981') : 'var(--muted)',
                          color: isStepCompleted ? 'white' : 'var(--muted-foreground)',
                          boxShadow: isCurrent && !isCompleted ? '0 0 20px rgba(249,115,22,0.3)' : undefined
                        }}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="text-sm font-bold text-center">
                          <span style={{ color: isStepCompleted ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="p-6 mb-8 rounded-3xl shadow-sm"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--foreground)' }}>Order Summary</h3>
              <div className="space-y-3">
                {order.orderItems?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0"
                    style={{ borderColor: 'var(--border)' }}>
                    <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      <span className="font-bold mr-2" style={{ color: 'var(--primary)' }}>{item.quantity}x</span>
                      {item.foodItem?.name || 'Item'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex justify-between text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  <span>Subtotal</span>
                  <span>₹{order.subtotal ? Number(order.subtotal).toFixed(2) : Number(order.total).toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm font-medium text-green-600">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xl pt-3"
                  style={{ borderTop: '1px solid var(--border)', color: 'var(--foreground)' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>₹{Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Review Form */}
            {isCompleted && orderItems.length > 0 && (
              <div className="p-6 rounded-3xl shadow-sm"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
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
