import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: any | null;
  setAuth: (token: string, user: any, refreshToken?: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, user, refreshToken) =>
        set({ token, user, refreshToken: refreshToken ?? null }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    { name: 'admin-auth-storage' }
  )
);
