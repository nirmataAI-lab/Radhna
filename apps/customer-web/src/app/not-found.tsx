import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          {/* Animated 404 */}
          <div className="relative mb-8">
            <div className="text-[10rem] font-black leading-none text-transparent bg-clip-text"
              style={{ backgroundImage: 'var(--gradient-primary, linear-gradient(135deg, #f97316, #ec4899))' }}>
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl animate-bounce" style={{ animationDuration: '2s' }}>🍽️</div>
            </div>
          </div>

          <h1 className="text-3xl font-black mb-3 tracking-tight">Page Not Found</h1>
          <p className="text-[var(--color-muted-foreground)] mb-8 text-lg leading-relaxed">
            Looks like this page took a detour to the kitchen and never came back.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-full font-bold shadow-[var(--shadow-glow)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Go Home
            </Link>
            <Link
              href="/menu"
              className="px-8 py-3 bg-[var(--color-card)] text-[var(--card-foreground)] border-2 border-[var(--color-border)] rounded-full font-bold hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
