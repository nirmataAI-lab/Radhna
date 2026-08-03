import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { LoginPage } from './pages/LoginPage';
import { KitchenDashboardPage } from './pages/KitchenDashboardPage';
import { InstallPWA } from 'ui-components';

export default function App() {
  const token = useAuthStore((state) => state.token);
  if (!token) return (
    <>
      <InstallPWA />
      <LoginPage />
    </>
  );
  return (
    <>
      <InstallPWA />
      <Routes>
        <Route path="/*" element={<KitchenDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
