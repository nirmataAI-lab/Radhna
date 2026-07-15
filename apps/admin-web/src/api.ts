import { useAuthStore } from './authStore';

// ─── Types ──────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  user: { id: string; email: string; name: string; role: string };
}

export interface DashboardStats {
  revenue: number;
  totalOrders: number;
  activeTables: number;
}

export interface Category {
  id: string;
  name: string;
  image?: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  foodItems?: FoodItem[];
  _count?: { foodItems: number };
}

export interface ProductionStock {
  id: string;
  foodItemId: string;
  availableQty: number;
}

export interface FoodItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isVeg: boolean;
  isEnabled: boolean;
  isPopular: boolean;
  isTodaysSpecial: boolean;
  createdAt: string;
  category?: Category;
  productionStock?: ProductionStock | null;
  _lowStock?: boolean;
}

export interface Order {
  id: string;
  orderType: string;
  status: string;
  total: string;
  subtotal: string;
  tax: string;
  discount: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  customerId?: string | null;
  cancelReason?: string | null;
  table?: { tableNumber: string } | null;
  orderItems?: {
    id: string;
    quantity: number;
    unitPrice: string;
    specialInstructions?: string;
    foodItem?: { name: string };
  }[];
}

export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  qrCode?: string | null;
  _count?: { orders: number };
}

// ─── Config ─────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function authHeaders(): HeadersInit {
  const token = useAuthStore.getState().token;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function handleResponse(res: Response) {
  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error('Session expired. Please login again.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message?.[0] || err?.message || 'Request failed');
  }
  return res.json();
}

// ─── Auth ───────────────────────────────────────────

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

// ─── Dashboard ──────────────────────────────────────

export async function fetchOverviewStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_URL}/orders/overview`, { headers: authHeaders() });
  return handleResponse(res);
}

// ─── Orders ─────────────────────────────────────────

export async function fetchAllOrders(status?: string, table?: string): Promise<Order[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (table) params.set('table', table);
  const query = params.toString();
  const res = await fetch(`${API_URL}/orders${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function cancelOrder(orderId: string, reason?: string): Promise<Order> {
  const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ reason: reason || 'Cancelled by admin' }),
  });
  return handleResponse(res);
}

// ─── Menu / Categories ──────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/menu/categories/all`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createCategory(data: { name: string; displayOrder?: number; image?: string }): Promise<Category> {
  const res = await fetch(`${API_URL}/menu/categories`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<Category> {
  const res = await fetch(`${API_URL}/menu/categories/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/menu/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── Menu / Food Items ──────────────────────────────

export async function fetchAllFoodItems(categoryId?: string): Promise<FoodItem[]> {
  const query = categoryId ? `?categoryId=${categoryId}` : '';
  const res = await fetch(`${API_URL}/menu/items/all${query}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createFoodItem(data: {
  categoryId: string; name: string; price: number; description?: string;
  imageUrl?: string; isVeg?: boolean; isEnabled?: boolean; isPopular?: boolean;
  isTodaysSpecial?: boolean; stock?: number;
}): Promise<FoodItem> {
  const res = await fetch(`${API_URL}/menu/items`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateFoodItem(id: string, data: Partial<FoodItem> & { stock?: number }): Promise<FoodItem> {
  const res = await fetch(`${API_URL}/menu/items/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteFoodItem(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/menu/items/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── Tables ─────────────────────────────────────────

export async function fetchTables(): Promise<Table[]> {
  const res = await fetch(`${API_URL}/tables`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createTable(data: { tableNumber: string; capacity: number }): Promise<Table> {
  const res = await fetch(`${API_URL}/tables`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteTable(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/tables/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── Analytics ─────────────────────────────────────

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  period: { days: number; since: string };
  revenueTrend: { date: string; revenue: number }[];
  popularItems: { name: string; count: number; revenue: number }[];
  peakHours: { hour: number; label: string; orders: number }[];
  paymentBreakdown: { status: string; count: number }[];
  discountStats: {
    totalDiscountGiven: number;
    discountOrderCount: number;
    discountPercentage: number;
    averageDiscountPerOrder: number;
  };
}

export async function fetchAnalytics(days: number = 30): Promise<AnalyticsData> {
  const res = await fetch(`${API_URL}/orders/analytics?days=${days}`, { headers: authHeaders() });
  return handleResponse(res);
}

// ─── Coupons ────────────────────────────────────────

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  value: number;
  validFrom: string;
  validTo: string;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const res = await fetch(`${API_URL}/coupons`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function createCoupon(data: {
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  value: number;
  validFrom: string;
  validTo: string;
  usageLimit?: number;
}): Promise<Coupon> {
  const res = await fetch(`${API_URL}/coupons`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteCoupon(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/coupons/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── Public (no auth) ───────────────────────────────

export async function trackOrder(orderId: string): Promise<Order | null> {
  const res = await fetch(`${API_URL}/orders/track/${orderId}`);
  if (!res.ok) return null;
  return res.json();
}
