'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'customer-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);

/** Login with email & password */
export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Login failed');
  }
  return res.json();
}

/** Register a new customer account */
export async function registerApi(data: { name: string; email: string; password: string; phone?: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Registration failed');
  }
  return res.json();
}

/** Fetch the logged-in customer's orders */
export async function fetchMyOrders(token: string) {
  const res = await fetch(`${API_BASE_URL}/orders/my-orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

