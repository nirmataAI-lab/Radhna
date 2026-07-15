import { useAuthStore } from './authStore';

export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface OrderItem {
  id: string;
  foodItemId: string;
  quantity: number;
  unitPrice: string;
  specialInstructions?: string;
  foodItem?: { name: string };
}

// Backend paginates active orders in an envelope; unwrap if present.
export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: string;
  tax: string;
  total: string;
  customerId?: string;
  customer?: { id: string; email?: string; name?: string } | null;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
}


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Invalid credentials');
  }
  return res.json();
}

export async function fetchActiveOrders(): Promise<Order[]> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_URL}/orders?status=PLACED,ACCEPTED,PREPARING,READY`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error('Session expired. Please login again.');
  }

  if (!res.ok) {
    throw new Error('Failed to fetch active orders');
  }
  return res.json();
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error('Session expired. Please login again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message?.[0] || err?.message || 'Failed to update order status');
  }

  return res.json();
}
