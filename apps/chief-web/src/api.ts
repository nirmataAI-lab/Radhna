import { useAuthStore } from './authStore';

export type OrderStatus = 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

interface LoginResponse {
  access_token: string; refresh_token?: string;
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
  cancelReason?: string | null;
  orderItems?: OrderItem[];
}



const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ── Refresh-on-401 fetch wrapper (single-flight) ──────────────
const _fetch = globalThis.fetch.bind(globalThis);
let refreshInFlight: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const rt = useAuthStore.getState().refreshToken;
  if (!rt) return null;
  try {
    const res = await _fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; refresh_token: string };
    useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

function refreshOnce(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

async function fetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const hasAuthHeader = !!(init.headers && (init.headers as any).Authorization);
  let res = await _fetch(input, init);
  if (res.status === 401 && hasAuthHeader && useAuthStore.getState().refreshToken) {
    const newToken = await refreshOnce();
    if (newToken) {
      const nextInit: RequestInit = {
        ...init,
        headers: { ...(init.headers as any), Authorization: `Bearer ${newToken}` },
      };
      res = await _fetch(input, nextInit);
    }
  }
  return res;
}


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
  const body = await res.json();
  return Array.isArray(body) ? body : body.data ?? [];
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
