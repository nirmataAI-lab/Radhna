'use client';

import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { X, Minus, Plus, ShoppingBag, Loader2, CheckCircle2, MessageSquare, CreditCard, Ticket, Percent } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { submitOrder } from '@/lib/api/orders';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Extend window for Razorpay
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: Record<string, unknown>) => void) => void;
    };
  }
}

export function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, updateInstructions, getTotalPrice, clearCart } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [couponData, setCouponData] = useState<{
    discountType: string;
    discountAmount: number;
    discountValue: number;
    description: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Load Razorpay checkout script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        if (script.parentNode) script.parentNode.removeChild(script);
      };
    }
  }, []);

  if (!mounted) return null;

  // ─── Coupon Validation ─────────────────────────────

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponStatus('loading');
    setCouponError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), orderTotal: getTotalPrice() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setCouponStatus('invalid');
        setCouponError(err?.message || 'Invalid coupon');
        setCouponData(null);
        return;
      }
      const data = await res.json();
      setCouponStatus('valid');
      setCouponData(data);
      setCouponError(null);
    } catch {
      setCouponStatus('invalid');
      setCouponError('Failed to validate coupon');
      setCouponData(null);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponStatus('idle');
    setCouponData(null);
    setCouponError(null);
  };

  // ─── Payment & Checkout ────────────────────────────

  const handlePayment = async (orderId: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/billing/${orderId}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        setPaymentSuccess(false);
        setSuccessOrderId(orderId);
        setIsSubmitting(false);
        clearCart();
        return;
      }

      const paymentData = await res.json();

      return new Promise<void>((resolve) => {
        const options = {
          key: paymentData.keyId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: 'Radhna Cuisine',
          description: `Order #${paymentData.orderId.slice(0, 8)}`,
          order_id: paymentData.razorpayOrderId,
          handler: async function (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) {
            try {
              const verifyRes = await fetch(`${API_BASE_URL}/billing/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  orderId: paymentData.orderId,
                }),
              });
              if (verifyRes.ok) setPaymentSuccess(true);
            } catch {}
            setSuccessOrderId(paymentData.orderId);
            clearCart();
            setIsSubmitting(false);
            resolve();
          },
          modal: {
            ondismiss: () => {
              setError('Payment cancelled. You can pay later or try again.');
              setIsSubmitting(false);
              resolve();
            },
          },
          prefill: { contact: '', email: '' },
          theme: { color: '#10b981' },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function () {
          setError('Payment failed. Your order is saved — you can pay later.');
          setIsSubmitting(false);
          resolve();
        });
        rzp.open();
      });
    } catch {
      setPaymentSuccess(false);
      setSuccessOrderId(orderId);
      setIsSubmitting(false);
      clearCart();
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      setError('Please sign in or register to place your order.');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const customerInfo = { id: user.id, email: user.email, phone: user.phone || undefined };
      const order = await submitOrder(
        items,
        customerInfo,
        couponStatus === 'valid' ? couponCode : undefined,
      );
      await handlePayment(order.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit order';
      setError(message);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (successOrderId) {
      setTimeout(() => {
        setSuccessOrderId(null);
        setPaymentSuccess(false);
        setError(null);
        removeCoupon();
      }, 300);
    }
  };

  const subtotal = getTotalPrice();
  const discount = couponData?.discountAmount || 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.05 * 100) / 100; // 5% GST
  const total = taxableAmount + tax;

  return (
    <>
      {isOpen && (
        <div
          className="cart-overlay"
          onClick={handleClose}
        />
      )}

      <div
        className={`cart-panel border-l ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ borderColor: 'var(--color-border)' }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-card)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl grid place-items-center"
              style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}>
              <ShoppingBag className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>Your Order</h2>
          </div>
          <button onClick={handleClose}
            className="p-2 rounded-xl transition-colors hover:bg-[var(--color-muted)]">
            <X className="w-5 h-5" style={{ color: 'var(--color-muted-foreground)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {successOrderId ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in px-6">
              <div className="w-20 h-20 rounded-full grid place-items-center mb-5"
                style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 0 32px rgba(22,163,74,.4)' }}>
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-foreground)' }}>Order Confirmed! 🎉</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-muted-foreground)' }}>
                Your order has been sent to the kitchen.
              </p>
              {paymentSuccess && (
                <p className="text-sm font-semibold mb-3 flex items-center gap-1.5"
                  style={{ color: '#16a34a' }}>
                  <CreditCard className="w-4 h-4" /> Payment successful
                </p>
              )}
              {discount > 0 && (
                <p className="text-sm mb-3" style={{ color: '#16a34a' }}>🎉 Saved ₹{discount.toFixed(2)} with coupon</p>
              )}
              {/* Token badge */}
              <div className="my-4 px-8 py-5 rounded-2xl w-full max-w-xs text-center"
                style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, var(--color-card))', border: '1.5px dashed color-mix(in srgb, var(--color-primary) 35%, var(--color-border))' }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-1" style={{ color: 'var(--color-muted-foreground)' }}>Your Token Number</p>
                <p className="text-4xl font-black tracking-widest font-mono" style={{ color: 'var(--color-primary)' }}>
                  #{successOrderId.slice(0, 6).toUpperCase()}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Show this to our team</p>
              </div>
              <div className="flex gap-3 mt-4 w-full max-w-xs">
                <Link
                  href={`/order/${successOrderId}`}
                  className="flex-1 py-3 rounded-full font-bold shadow-md text-center text-sm transition-opacity hover:opacity-90"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  Track Order
                </Link>
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-full font-bold text-sm transition-colors"
                  style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl grid place-items-center mb-4 opacity-30"
                style={{ background: 'var(--color-muted)' }}>
                <ShoppingBag className="w-8 h-8" style={{ color: 'var(--color-muted-foreground)' }} />
              </div>
              <p className="font-semibold" style={{ color: 'var(--color-foreground)' }}>Your cart is empty</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>Add items from the menu to get started.</p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.id}
                  className="flex gap-3 p-3.5 rounded-2xl"
                  style={{ border: '1px solid var(--color-border)', background: 'var(--color-card)' }}>
                  <div className="relative w-18 h-18 rounded-xl overflow-hidden flex-shrink-0"
                    style={{ width: 72, height: 72, background: 'var(--color-muted)' }}>
                    {item.imageUrl && (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    )}
                    {!item.imageUrl && (
                      <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🍽️</div>
                    )}
                  </div>

                  <div className="flex flex-col flex-grow justify-between min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm line-clamp-1" style={{ color: 'var(--color-foreground)' }}>{item.name}</h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: 'var(--color-muted-foreground)' }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {item.specialInstructions && (
                      <p className="text-xs italic truncate mt-0.5" style={{ color: '#d97706' }}>
                        📝 {item.specialInstructions}
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-1.5">
                      <span className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setInstructionsOpen(instructionsOpen === item.id ? null : item.id)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: item.specialInstructions ? '#d97706' : 'var(--color-muted-foreground)', background: item.specialInstructions ? 'rgba(217,119,6,.08)' : 'transparent' }}
                          title={item.specialInstructions ? 'Edit instructions' : 'Add instructions'}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <div className="qty-stepper" style={{ '--primary': 'var(--color-primary)' } as any}>
                          <button className="qty-btn qty-btn-minus" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="qty-count text-xs">{item.quantity}</span>
                          <button className="qty-btn qty-btn-plus" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {instructionsOpen === item.id && (
                      <div className="mt-2 animate-fade-in">
                        <textarea
                          value={item.specialInstructions || ''}
                          onChange={(e) => updateInstructions(item.id, e.target.value)}
                          placeholder="E.g. No onions, extra cheese..."
                          rows={2}
                          className="w-full text-xs p-2 rounded-xl resize-none outline-none"
                          style={{ border: '1.5px solid var(--color-border)', background: 'var(--color-muted)', color: 'var(--color-foreground)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Coupon Code Section */}
              <div className="rounded-2xl p-4"
                style={{ border: '1px solid var(--color-border)', background: 'var(--color-card)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Ticket className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Have a coupon?</span>
                </div>
                {couponStatus === 'valid' && couponData ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-2.5">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-green-600" />
                      <div>
                        <p className="text-sm font-bold text-green-700">{couponCode.toUpperCase()}</p>
                        <p className="text-xs text-green-600">-₹{couponData.discountAmount.toFixed(2)} {couponData.description}</p>
                      </div>
                    </div>
                    <button onClick={removeCoupon} className="text-green-600 hover:text-green-800 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponStatus('idle'); setCouponError(null); }}
                      placeholder="Enter coupon code"
                      className="flex-1 p-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary/50 uppercase"
                    />
                    <button
                      onClick={validateCoupon}
                      disabled={couponStatus === 'loading' || !couponCode.trim()}
                      className="px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {couponStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-xs text-red-500 mt-1">{couponError}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Checkout Area */}
        {!successOrderId && items.length > 0 && (
          <div className="p-4 shrink-0"
            style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-card)', boxShadow: '0 -4px 16px -4px rgba(0,0,0,.08)' }}>
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--color-muted-foreground)' }}>Subtotal</span>
                <span style={{ color: 'var(--color-foreground)' }}>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>GST (5%)</span>
                <span>+₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <p className="mb-3 text-red-500 text-xs font-semibold text-center">{error}</p>
            )}

            {!user ? (
              <div className="p-4 rounded-2xl text-center"
                style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)' }}>
                <p className="text-xs font-semibold mb-2.5" style={{ color: '#92400e' }}>
                  🔒 Sign in to place your order
                </p>
                <Link
                  href="/auth/login"
                  onClick={handleClose}
                  className="inline-block px-6 py-2.5 rounded-full text-xs font-bold shadow-md transition-opacity hover:opacity-90"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  Sign In / Register
                </Link>
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-bold shadow-md transition-all disabled:opacity-50 hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--color-primary)', color: 'white' }}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Processing...</>
                ) : (
                  `Place Order • ₹${total.toFixed(2)}`
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
