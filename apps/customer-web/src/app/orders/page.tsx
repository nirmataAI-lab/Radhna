'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore, fetchMyOrders } from '@/lib/store/authStore';
import { Navbar } from '@/components/ui/Navbar';
import { Package, Clock, AlertCircle, ArrowRight } from 'lucide-react';

interface OrderSummary {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  orderType: string;
  table?: { tableNumber: string } | null;
  orderItems?: { quantity: number; foodItem?: { name: string } | null }[];
}

const STATUS_BADGES: Record<string, string> = {
  PLACED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ACCEPTED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PREPARING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  READY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  CANCELLED: 'bg-red-50 text-red-500 line-through dark:bg-red-900/10',
};

export default function OrdersPage() {
  const { token, user } = useAuthStore();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchMyOrders(token)
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (!token) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-sm premium-card p-8">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h2 className="text-xl font-bold mb-2">Sign in to view orders</h2>
            <p className="text-sm text-muted-foreground mb-6">Log in to see your order history and track active orders.</p>
            <Link href="/auth/login"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold shadow-md hover:opacity-90 transition-opacity">
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      <div className="container mx-auto px-4 py-12 flex-grow">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold">My Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome, {user?.name} — View your order history
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="premium-card p-8 text-center border-red-200">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
            <p className="font-bold text-lg">Failed to load orders</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 premium-card">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-lg font-medium">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Place your first order from our menu!</p>
            <Link href="/menu"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold shadow-md hover:opacity-90 transition-opacity">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/order/${order.id}`}
                className="premium-card p-5 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGES[order.status] || ''}`}>
                    {order.status}
                  </span>
                  <span className="font-bold text-primary">₹{Number(order.total).toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Clock className="w-3 h-3" />
                  {new Date(order.createdAt).toLocaleString()}
                </div>

                <p className="text-xs text-muted-foreground mb-1">
                  {order.table?.tableNumber ? `Table ${order.table.tableNumber}` : order.orderType}
                </p>

                <p className="text-sm truncate mb-3">
                  {order.orderItems?.map((oi) => `${oi.quantity}x ${oi.foodItem?.name || 'Item'}`).join(', ')}
                </p>

                <div className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View Details <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
