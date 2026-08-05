'use client';

import { ChefHat, Eye, EyeOff, Zap, ArrowRight, Moon, Sun, Wifi } from 'lucide-react';
import { useState } from 'react';
import { loginApi } from '../api';
import { useAuthStore } from '../authStore';
import { InstallPWA } from 'ui-components';

export function LoginPage({ dark, onToggleTheme }: { dark?: boolean; onToggleTheme?: () => void }) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      setAuth(data.access_token, data.user, data.refresh_token);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('chief@restaurant.com');
    setPassword('dev-password-123');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: 'var(--color-background)' }}>
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,.6), transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,.5), transparent 70%)' }} />

      {/* Theme toggle */}
      {onToggleTheme && (
        <button onClick={onToggleTheme}
          className="absolute top-5 right-5 p-2.5 rounded-xl text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition"
          style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
          {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      )}

      <div className="w-full max-w-[420px] animate-fade-in">
        {/* Logo block */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl grid place-items-center mb-4"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow-glow)' }}>
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-foreground)] leading-tight">
            Kitchen Staff Login
          </h1>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium"
            style={{ color: 'var(--color-muted-foreground)' }}>
            <Wifi className="w-3.5 h-3.5" />
            Kitchen Display System
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7" style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}>
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-sm font-medium"
              style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', color: '#f87171' }}>
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1.5 text-[var(--color-foreground)]">
                Email
              </label>
              <input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chief@restaurant.com"
                required autoComplete="email" autoFocus
                className="input-premium"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1.5 text-[var(--color-foreground)]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password" type={showPw ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required autoComplete="current-password"
                  className="input-premium pr-10"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 grid place-items-center text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition"
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="gradient-button w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm mt-1">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                : <>Login to Kitchen <ArrowRight className="w-4 h-4" /></>}
            </button>

            <InstallPWA variant="inline"
              className="w-full text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition border border-[var(--color-border)] bg-[var(--color-muted)] text-[var(--color-foreground)] hover:opacity-90" />

            <button type="button" onClick={fillDemo}
              className="w-full text-sm font-medium py-2 rounded-xl transition flex items-center justify-center gap-2"
              style={{
                border: '1px dashed var(--color-border)',
                color: 'var(--color-muted-foreground)',
              }}>
              <Zap className="w-3.5 h-3.5" /> Fill demo credentials
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
