'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, updateProfileApi, fetchMyOrders } from '../../lib/store/authStore';
import { User, ShoppingBag, LogOut, Save, Shield, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout, setUser } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !user) {
      router.push('/auth/login');
      return;
    }
    setName(user.name || '');
    setPhone(user.phone || '');

    fetchMyOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [token, user, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const updated = await updateProfileApi({
        name,
        phone: phone || undefined,
        password: password || undefined,
      });
      setUser(updated);
      setMessage('Profile updated successfully');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition flex items-center gap-2 w-fit"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Edit Profile Form */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" /> Account Settings
            </h2>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 font-semibold text-slate-950 rounded-xl transition shadow-md shadow-amber-500/20 text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </form>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" /> Recent Orders
              </h2>
              <Link
                href="/menu"
                className="text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                + Order Food
              </Link>
            </div>

            {loadingOrders ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Loading order history...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No orders placed yet</p>
                <Link
                  href="/menu"
                  className="mt-4 inline-block px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-medium text-xs hover:bg-amber-600 transition"
                >
                  Explore Menu
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm font-semibold text-amber-400">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                            order.status === 'READY'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : order.status === 'COMPLETED'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-2">
                        {order.orderItems?.map((i: any) => `${i.quantity}x ${i.foodItem?.name || 'Item'}`).join(', ')}
                      </p>
                    </div>

                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                      <span className="text-base font-bold text-white">
                        ₹{parseFloat(order.total).toFixed(2)}
                      </span>
                      <Link
                        href={`/order/${order.id}`}
                        className="text-xs text-amber-400 hover:text-amber-300 font-medium underline mt-1"
                      >
                        Track Order →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
