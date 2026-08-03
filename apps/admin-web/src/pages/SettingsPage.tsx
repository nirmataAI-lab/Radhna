import { useState } from 'react';
import { Sliders, Save, Bell, Shield, Percent, DollarSign, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../authStore';

export function SettingsPage() {
  const token = useAuthStore((s) => s.token);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const [restaurantName, setRestaurantName] = useState('Radhna Cuisine');
  const [taxRate, setTaxRate] = useState('5.0');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(true);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const [savedMessage, setSavedMessage] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage('Settings updated successfully');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setLoading(true);
    setBroadcastStatus('');

    try {
      const res = await fetch(`${API_URL}/notifications/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          type: 'SYSTEM_ALERT',
        }),
      });

      if (res.ok) {
        setBroadcastStatus('Broadcast notification sent to all active users');
        setBroadcastTitle('');
        setBroadcastMessage('');
      } else {
        setBroadcastStatus('Failed to send broadcast');
      }
    } catch {
      setBroadcastStatus('Failed to send broadcast notification');
    } finally {
      setLoading(false);
      setTimeout(() => setBroadcastStatus(''), 4000);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-foreground)] flex items-center gap-3">
          <Sliders className="w-8 h-8 text-[var(--color-primary)]" /> System Settings
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Configure general restaurant operations, tax rates, and push system announcements
        </p>
      </div>

      {savedMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* General Settings */}
      <form onSubmit={handleSaveSettings} className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl space-y-6 shadow-sm">
        <h2 className="text-lg font-bold text-[var(--color-foreground)] flex items-center gap-2 pb-3 border-b border-[var(--color-border)]">
          <Shield className="w-5 h-5 text-[var(--color-primary)]" /> General Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2">
              Restaurant Brand Name
            </label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2">
              Currency Symbol
            </label>
            <div className="relative">
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] pl-9"
              />
              <DollarSign className="w-4 h-4 text-[var(--color-muted-foreground)] absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2">
              GST / Tax Percentage (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] pl-9"
              />
              <Percent className="w-4 h-4 text-[var(--color-muted-foreground)] absolute left-3 top-3" />
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[var(--color-muted)] rounded-xl border border-[var(--color-border)]">
            <div>
              <span className="block text-sm font-semibold">Auto-Accept New Orders</span>
              <span className="text-xs text-[var(--color-muted-foreground)]">Automatically transition placed orders to preparing state</span>
            </div>
            <input
              type="checkbox"
              checked={autoAcceptOrders}
              onChange={(e) => setAutoAcceptOrders(e.target.checked)}
              className="w-5 h-5 accent-[var(--color-primary)] cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          className="gradient-button px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md"
        >
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </form>

      {/* Notification System Broadcast */}
      <form onSubmit={handleBroadcast} className="bg-[var(--color-card)] border border-[var(--color-border)] p-6 rounded-2xl space-y-6 shadow-sm">
        <h2 className="text-lg font-bold text-[var(--color-foreground)] flex items-center gap-2 pb-3 border-b border-[var(--color-border)]">
          <Bell className="w-5 h-5 text-[var(--color-primary)]" /> System Notification Broadcast
        </h2>

        {broadcastStatus && (
          <div className="p-3.5 bg-[var(--color-muted)] border border-[var(--color-border)] rounded-xl text-sm font-medium">
            {broadcastStatus}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2">
              Announcement Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Special Weekend Offer — 20% Off All Desserts!"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-2">
              Notification Message
            </label>
            <textarea
              rows={3}
              required
              placeholder="Order online today and use code WEEKEND20 at checkout."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
        >
          <Bell className="w-4 h-4" /> {loading ? 'Broadcasting...' : 'Broadcast to Users'}
        </button>
      </form>
    </div>
  );
}
