'use client';

import Link from 'next/link';
import { ShoppingBag, User, LogOut, Package, ChevronDown } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function Navbar() {
  const { getTotalItems, setIsOpen } = useCartStore();
  const { token, user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    ...(mounted && token ? [{ href: '/orders', label: 'My Orders' }] : []),
  ];

  const cartCount = mounted ? getTotalItems() : 0;

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      scrolled ? 'glass-effect shadow-sm' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between max-w-7xl">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl grid place-items-center transition-transform group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
            <span className="text-white text-sm font-black">R</span>
          </div>
          <span className="font-display font-bold text-lg leading-none" style={{ color: 'var(--foreground)' }}>
            Radhna<span style={{ color: 'var(--primary)' }}> ·</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                }`}>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* User menu */}
          {mounted && token ? (
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border transition-all hover:bg-[var(--muted)]"
                style={{ borderColor: 'var(--border)' }}>
                <div className="w-7 h-7 rounded-full grid place-items-center text-xs font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold hidden sm:block max-w-[80px] truncate" style={{ color: 'var(--foreground)' }}>
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--muted-foreground)' }} />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl z-50 py-1.5 animate-scale-in overflow-hidden"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-xl)',
                    }}>
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>{user?.name}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{user?.email}</p>
                    </div>
                    {[
                      { href: '/profile', icon: User,    label: 'My Profile' },
                      { href: '/orders',  icon: Package, label: 'My Orders'  },
                    ].map(({ href, icon: Icon, label }) => (
                      <Link key={href} href={href}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--muted)]"
                        style={{ color: 'var(--foreground)' }}>
                        <Icon className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                        {label}
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' }}>
                      <button onClick={handleLogout}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium w-full text-left transition-colors hover:bg-red-50 dark:hover:bg-red-950/20"
                        style={{ color: 'var(--destructive)' }}>
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/auth/login"
              className="text-sm font-semibold px-4 py-2 rounded-full transition-all hover:bg-[var(--muted)]"
              style={{ color: 'var(--foreground)', border: '1.5px solid var(--border)' }}>
              Sign In
            </Link>
          )}

          {/* Cart */}
          <button onClick={() => setIsOpen(true)}
            className="relative p-2.5 rounded-full transition-all hover:scale-105 active:scale-95"
            style={{ background: cartCount > 0 ? 'var(--primary)' : 'var(--muted)', border: '1.5px solid var(--border)' }}
            aria-label={`Cart (${cartCount} items)`}>
            <ShoppingBag className="w-5 h-5" style={{ color: cartCount > 0 ? 'white' : 'var(--foreground)' }} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black text-white"
                style={{ background: '#ef4444', boxShadow: '0 2px 8px rgba(239,68,68,.4)' }}>
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav bottom bar */}
      <nav className="md:hidden flex items-center justify-around px-4 py-2"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}>
        {navLinks.map(({ href, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)]'
              }`}>
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
