import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface StockRow {
  id: string;
  name: string;
  imageUrl?: string | null;
  category: { id: string; name: string } | null;
  productionStock: { availableQty: number; updatedAt: string } | null;
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchStock(): Promise<StockRow[]> {
  const res = await fetch(`${API_URL}/menu/stock`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load stock');
  return res.json();
}

export async function setItemStock(id: string, availableQty: number) {
  const res = await fetch(`${API_URL}/menu/items/${id}/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ availableQty }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to update stock');
  }
  return res.json();
}
