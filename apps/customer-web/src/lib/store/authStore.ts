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
  refreshToken: string | null;
  user: User | null;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    {
      name: 'customer-auth',
      partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken, user: state.user }),
    },
  ),
);

let refreshInFlight: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const rt = useAuthStore.getState().refreshToken;
  if (!rt) return null;
  try {
    const res = await globalThis.fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const user = useAuthStore.getState().user;
    if (user && data.access_token) {
      useAuthStore.getState().setAuth(data.access_token, data.refresh_token, user);
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let res = await globalThis.fetch(input, { ...init, headers });
  if (res.status === 401 && useAuthStore.getState().refreshToken) {
    if (!refreshInFlight) {
      refreshInFlight = doRefresh().finally(() => { refreshInFlight = null; });
    }
    const newToken = await refreshInFlight;
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await globalThis.fetch(input, { ...init, headers });
    } else {
      useAuthStore.getState().logout();
    }
  }
  return res;
}

/** Login with email & password */
export async function loginApi(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Invalid email or password');
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

/** Request Password Reset */
export async function forgotPasswordApi(email: string) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to send password reset email');
  }
  return res.json();
}

/** Reset Password */
export async function resetPasswordApi(token: string, newPassword: string) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password: newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Password reset failed');
  }
  return res.json();
}

/** Update Customer Profile */
export async function updateProfileApi(data: { name?: string; phone?: string; password?: string }) {
  const res = await authenticatedFetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Profile update failed');
  }
  return res.json();
}

/** Fetch the logged-in customer's orders */
export async function fetchMyOrders() {
  const res = await authenticatedFetch(`${API_BASE_URL}/orders/my-orders`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}
