import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Category {
  id: string;
  name: string;
  displayOrder: number;
  image?: string | null;
}

export interface ProductionStock {
  availableQty: number;
}

export interface FoodItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number | string;
  imageUrl?: string | null;
  isVeg: boolean;
  isEnabled: boolean;
  isPopular: boolean;
  isTodaysSpecial: boolean;
  category?: Category;
  productionStock?: ProductionStock | null;
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    useAuthStore.getState().logout();
    throw new Error('Session expired. Please login again.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const msg = Array.isArray(err?.message) ? err.message.join(', ') : err?.message;
    throw new Error(msg || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Categories ────────────────────────────────────
export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/menu/categories/all`, { headers: authHeaders() });
  return handle(res);
}
export async function createCategory(data: { name: string; displayOrder?: number }): Promise<Category> {
  const res = await fetch(`${API_URL}/menu/categories`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handle(res);
}
export async function updateCategory(id: string, data: Partial<Category>): Promise<Category> {
  const res = await fetch(`${API_URL}/menu/categories/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) });
  return handle(res);
}
export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/menu/categories/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handle(res);
}

// ─── Food Items ────────────────────────────────────
export async function fetchAllFoodItems(): Promise<FoodItem[]> {
  const res = await fetch(`${API_URL}/menu/items/all`, { headers: authHeaders() });
  return handle(res);
}
export async function createFoodItem(data: {
  categoryId: string; name: string; price: number; description?: string;
  imageUrl?: string; isVeg?: boolean; isEnabled?: boolean; isPopular?: boolean;
  isTodaysSpecial?: boolean; stock?: number;
}): Promise<FoodItem> {
  const res = await fetch(`${API_URL}/menu/items`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handle(res);
}
export async function updateFoodItem(id: string, data: Partial<FoodItem> & { stock?: number }): Promise<FoodItem> {
  const res = await fetch(`${API_URL}/menu/items/${id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) });
  return handle(res);
}
export async function deleteFoodItem(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/menu/items/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handle(res);
}
