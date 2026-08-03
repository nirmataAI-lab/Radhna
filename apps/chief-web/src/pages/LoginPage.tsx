import { ChefHat, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { loginApi } from '../api';
import { useAuthStore } from '../authStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="premium-card p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-[var(--shadow-glow)]"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-center">Kitchen Staff Login</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Kitchen Display System</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 p-3 rounded-lg mb-4 text-sm font-medium border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chief@restaurant.com"
              required
              autoComplete="email"
              autoFocus
              className="w-full p-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 bg-[var(--color-background)] transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full p-2.5 pr-10 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 bg-[var(--color-background)] transition"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-0 px-3 grid place-items-center text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold py-2.5 rounded-lg mt-2 hover:opacity-90 transition-opacity disabled:opacity-50 gradient-button"
          >
            {loading ? 'Signing in…' : 'Login to Kitchen'}
          </button>

          <button
            type="button"
            onClick={fillDemo}
            className="w-full text-sm font-medium py-2 rounded-lg border border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition text-[var(--color-muted-foreground)]"
          >
            Fill demo credentials
          </button>
        </form>
      </div>
    </div>
  );
}
