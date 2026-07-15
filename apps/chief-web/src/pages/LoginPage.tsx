import { ChefHat } from 'lucide-react';
import { useState } from 'react';
import { loginApi } from '../api';
import { useAuthStore } from '../authStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="premium-card p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <ChefHat className="w-12 h-12 text-[var(--color-primary)] mb-4" />
          <h1 className="text-2xl font-bold text-center">Chief Login</h1>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Kitchen Display System</p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-200">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chief@restaurant.com"
              required
              className="w-full p-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 bg-[var(--color-background)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
              required
              className="w-full p-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 bg-[var(--color-background)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white font-bold py-2.5 rounded-lg mt-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
