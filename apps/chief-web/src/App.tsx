import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { LoginPage } from './pages/LoginPage';
import { KitchenDashboardPage } from './pages/KitchenDashboardPage';

export default function App() {
  const token = useAuthStore((state) => state.token);

  // KDS defaults to dark mode — always ideal for a kitchen display.
  // User can override via the theme toggle inside the app.
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('chief-theme');
    // Default to dark if no preference saved
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    // KDS uses `.light` class to indicate light mode; dark is the default (no class needed)
    if (dark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('chief-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggleTheme = () => setDark((prev) => !prev);

  if (!token) return <LoginPage dark={dark} onToggleTheme={toggleTheme} />;

  return (
    <Routes>
      <Route path="/*" element={<KitchenDashboardPage dark={dark} onToggleTheme={toggleTheme} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
