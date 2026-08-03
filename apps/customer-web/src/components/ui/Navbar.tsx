'use client';

import Link from 'next/link';
import { ShoppingBag, User, LogOut, Package } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { getTotalItems, setIsOpen } = useCartStore();
  const { token, user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-effect">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-primary">
            Radhna <span className="text-foreground">Cuisine</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <Link href="/menu" className="hover:text-primary transition-colors">Our Menu</Link>
          {mounted && token && (
            <Link href="/orders" className="hover:text-primary transition-colors">My Orders</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {/* User Menu */}
          {mounted && token ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 hover:bg-muted rounded-full transition-colors"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                {user?.name && (
                  <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">
                    {user.name}
                  </span>
                )}
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 py-2 animate-fade-in">
                    <div className="px-4 py-2 border-b border-border">
                      <p className="font-semibold text-sm truncate">{user?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <Link href="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <Link href="/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                      <Package className="w-4 h-4" /> My Orders
                    </Link>
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/auth/login"
              className="text-sm font-medium px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              Sign In
            </Link>
          )}

          {/* Cart Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2 hover:bg-muted rounded-full transition-colors flex items-center justify-center"
          >
            <ShoppingBag className="w-6 h-6" />
            {mounted && getTotalItems() > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                {getTotalItems()}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
