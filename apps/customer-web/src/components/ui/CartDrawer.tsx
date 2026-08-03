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
    setError(null);
    setIsSubmitting(true);

    try {
      const customerInfo = user ? { id: user.id, email: user.email, phone: user.phone || undefined } : undefined;
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
          onClick={handleClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-border ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Your Order
          </h2>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {successOrderId ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Order Confirmed! 🎉</h3>
              <p className="text-muted-foreground mb-2">
                Your order has been sent to the kitchen.
              </p>
              {paymentSuccess && (
                <p className="text-green-600 font-semibold text-sm mb-4 flex items-center gap-1">
                  <CreditCard className="w-4 h-4" /> Payment successful
                </p>
              )}
              {discount > 0 && (
                <p className="text-green-600 text-sm mb-4">🎉 Coupon applied: saved ₹{discount.toFixed(2)}</p>
              )}
              <div className="bg-muted p-4 rounded-xl w-full max-w-xs break-all">
                <p className="text-sm font-semibold mb-1">Order ID:</p>
                <p className="text-xs font-mono">{successOrderId}</p>
              </div>
              <div className="flex gap-3 mt-6 w-full max-w-xs">
                <Link
                  href={`/order/${successOrderId}`}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-full font-bold shadow-md hover:bg-primary/90 transition-colors text-center text-sm"
                >
                  Track Order
                </Link>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-card text-card-foreground border border-border px-4 py-3 rounded-full font-bold hover:bg-muted transition-colors text-sm"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
              <p>Your cart is empty.</p>
              <p className="text-xs mt-2">Add items from the menu to get started.</p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 border border-border p-3 rounded-xl bg-card">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    {item.imageUrl && (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    )}
                  </div>

                  <div className="flex flex-col flex-grow justify-between min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-red-500 p-1 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {item.specialInstructions && (
                      <p className="text-xs text-amber-600 italic truncate mt-0.5">
                        📝 {item.specialInstructions}
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-primary">₹{(item.price * item.quantity).toFixed(2)}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setInstructionsOpen(instructionsOpen === item.id ? null : item.id)}
                          className={`p-1 rounded transition-colors ${
                            item.specialInstructions
                              ? 'text-amber-500 bg-amber-50'
                              : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-50'
                          }`}
                          title={item.specialInstructions ? 'Edit instructions' : 'Add instructions'}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-background rounded-full shadow-sm hover:text-primary"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-background rounded-full shadow-sm hover:text-primary"
                          >
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
                          className="w-full text-xs p-2 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Coupon Code Section */}
              <div className="border border-border rounded-xl p-3 bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Have a coupon?</span>
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
          <div className="p-4 border-t border-border bg-card shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
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
              <p className="mb-4 text-red-500 text-xs">{error}</p>
            )}

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-full font-bold shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-[0.98] transform"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Place Order • ₹${total.toFixed(2)}`
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
