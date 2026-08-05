'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/store/authStore';
import { BellRing, X, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = API_BASE_URL.replace('/api', '');

interface OrderNotification {
  id: string;
  orderId: string;
  status: string;
  message: string;
}

export function SocketNotifications() {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!user || !token) return;

    let socket: Socket | null = null;
    try {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socket.on('orderStatusUpdate', (data: any) => {
        // We are particularly interested in READY status for the customer
        if (data.status === 'READY') {
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 880; // A5
            gain.gain.value = 0.2;
            osc.start(); osc.stop(ctx.currentTime + 0.3);
          } catch {}

          const newNotif: OrderNotification = {
            id: Math.random().toString(36).substring(7),
            orderId: data.id,
            status: data.status,
            message: `Order #${data.id.slice(0, 6).toUpperCase()} is ready for pickup!`,
          };

          setNotifications(prev => [newNotif, ...prev].slice(0, 3));
          
          // Auto-remove after 8 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
          }, 8000);
        }
      });
    } catch (err) {
      console.error('Socket init error:', err);
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user, token]);

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none animate-in slide-in-from-top-10 fade-in duration-300">
      {notifications.map((notif) => (
        <div key={notif.id} className="pointer-events-auto w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--primary)' }}>
          <div className="p-4 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5" />
            <div className="relative w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div className="relative flex-1 min-w-0">
              <h4 className="font-bold text-foreground">Order Ready!</h4>
              <p className="text-sm text-muted-foreground mt-0.5 font-medium">{notif.message}</p>
              <div className="mt-3 flex gap-2">
                <Link href={`/order/${notif.orderId}`} onClick={() => dismiss(notif.id)}
                  className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                  style={{ background: 'var(--primary)' }}>
                  View Order
                </Link>
              </div>
            </div>
            <button onClick={() => dismiss(notif.id)} className="relative p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
