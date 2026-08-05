import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { InstallPWA } from "@/components/InstallPWA";
import { getTodaysSpecials } from "@/lib/api/menu";
import type { FoodItem } from "@/lib/api/menu";
import Image from "next/image";
import { ArrowRight, Star, Clock, Flame, Sparkles, ChefHat, Zap } from "lucide-react";

export default async function Home() {
  let specials: FoodItem[] = [];
  try {
    specials = await getTodaysSpecials();
  } catch {
    // Backend may not be running
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      {/* ─── Hero ──────────────────────────────────────────────────── */}
      <section className="relative flex-grow flex items-center justify-center overflow-hidden px-4 py-28 md:py-40">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full opacity-15 blur-[130px] animate-pulse-slow"
            style={{ background: 'radial-gradient(circle, var(--color-primary), transparent 70%)' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[140px] animate-pulse-slow"
            style={{ background: 'radial-gradient(circle, #ec4899, transparent 70%)', animationDelay: '1.5s' }} />
          <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full opacity-8 blur-[100px]"
            style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />
        </div>

        {/* Floating food emojis */}
        <div className="absolute top-[18%] left-[8%] text-5xl animate-float opacity-40 select-none" aria-hidden>🍛</div>
        <div className="absolute bottom-[22%] right-[12%] text-5xl animate-float opacity-35 select-none" aria-hidden style={{ animationDelay: '2s' }}>🥗</div>
        <div className="absolute top-[28%] right-[8%] text-4xl animate-float opacity-30 select-none" aria-hidden style={{ animationDelay: '1s' }}>🍱</div>
        <div className="absolute bottom-[30%] left-[12%] text-4xl animate-float opacity-25 select-none" aria-hidden style={{ animationDelay: '3s' }}>🍣</div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-semibold animate-fade-in"
            style={{
              background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-primary) 25%, transparent)',
              color: 'var(--color-primary)',
            }}>
            <Sparkles className="w-4 h-4" />
            <span>Experience Radhna Cuisine</span>
          </div>

          {/* Headline */}
          <h1 className="hero-title text-[3.5rem] sm:text-[5rem] md:text-[6.5rem] mb-6 animate-slide-up text-[var(--color-foreground)]">
            Taste the<br />
            <em className="text-gradient not-italic">Extraordinary</em>
          </h1>

          <p className="text-lg md:text-xl text-[var(--color-muted-foreground)] mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up font-medium"
            style={{ animationDelay: '0.1s' }}>
            World-class chefs. Premium ingredients. Lightning-fast delivery.
            Order fresh, eat extraordinary.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/menu" className="btn-primary text-base px-8 py-4 w-full sm:w-auto group">
              Order Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/menu" className="btn-outline text-base px-8 py-4 w-full sm:w-auto">
              View Menu
            </Link>
            <InstallPWA variant="inline"
              className="w-full sm:w-auto btn-outline text-base px-8 py-4" />
          </div>

          {/* Social proof pills */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: Star,    label: '4.9 Rating',    sub: '2k+ reviews' },
              { icon: Clock,   label: '15 min avg',    sub: 'Delivery time' },
              { icon: ChefHat, label: 'Expert Chefs',  sub: 'Culinary masters' },
            ].map((stat) => (
              <div key={stat.label}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
                style={{
                  background: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                <div className="w-8 h-8 rounded-xl grid place-items-center"
                  style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}>
                  <stat.icon className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold leading-tight" style={{ color: 'var(--color-foreground)' }}>{stat.label}</div>
                  <div className="text-[11px] font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{stat.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────────────────── */}
      <section className="px-4 py-20 relative z-10" style={{ background: 'var(--color-muted)' }}>
        <div className="w-full mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <div className="section-label mx-auto mb-4">
              <Zap className="w-3.5 h-3.5" /> Why Choose Us
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl" style={{ color: 'var(--color-foreground)' }}>
              The finest dining,{' '}
              <span className="text-gradient-gold">delivered fast</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {[
              {
                emoji: '⚡',
                title: 'Lightning Fast',
                desc: 'Our cloud kitchens are optimized for speed without compromising quality.',
                color: '#f59e0b',
              },
              {
                emoji: '👨‍🍳',
                title: 'Master Chefs',
                desc: 'Every dish is meticulously prepared by culinary experts with decades of experience.',
                color: '#f97316',
              },
              {
                emoji: '🌟',
                title: 'Premium Quality',
                desc: 'We source only the finest, freshest ingredients from trusted suppliers.',
                color: '#10b981',
              },
            ].map((feature) => (
              <div key={feature.title}
                className="glass-card p-8 text-center animate-slide-up group cursor-default"
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
                <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-md group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300"
                  style={{ background: `${feature.color}18`, border: `1.5px solid ${feature.color}28` }}>
                  {feature.emoji}
                </div>
                <h3 className="font-bold text-lg mb-2.5" style={{ color: 'var(--color-foreground)' }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted-foreground)' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Today's Specials ───────────────────────────────────────── */}
      {specials.length > 0 && (
        <section className="px-4 py-24 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-[40%] h-[60%] rounded-full opacity-6 blur-[120px]"
              style={{ background: 'radial-gradient(circle, var(--color-primary), transparent 70%)' }} />
          </div>

          <div className="w-full mx-auto max-w-6xl relative z-10">
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="section-label mb-3">
                  <Flame className="w-3.5 h-3.5" /> Today's Specials
                </div>
                <h2 className="font-display font-bold text-3xl md:text-4xl" style={{ color: 'var(--color-foreground)' }}>
                  Signature{' '}
                  <span className="text-gradient">Creations</span>
                </h2>
              </div>
              <Link href="/menu"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color: 'var(--color-primary)' }}>
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 stagger-children">
              {specials.slice(0, 3).map((item) => (
                <Link key={item.id} href="/menu" className="food-card group block animate-slide-up w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-sm">
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden" style={{ background: 'var(--color-muted)' }}>
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="food-img object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
                        🍽️
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                    {/* Special badge */}
                    <div className="absolute top-3 left-3">
                      <span className="badge-special"><Sparkles className="w-3 h-3" /> Special</span>
                    </div>

                    {/* Price + name at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-bold text-lg text-white drop-shadow-md leading-tight">{item.name}</h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm line-clamp-1" style={{ color: 'var(--color-muted-foreground)' }}>
                        {item.description || 'A delicious signature creation.'}
                      </p>
                      <span className="font-bold text-lg ml-3 shrink-0" style={{ color: 'var(--color-primary)' }}>
                        ₹{Number(item.price).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all"
                      style={{ color: 'var(--color-primary)' }}>
                      Order Now <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="sm:hidden text-center mt-8">
              <Link href="/menu" className="btn-primary px-8 py-3 text-sm">
                Browse Full Menu <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Footer CTA ─────────────────────────────────────────────── */}
      <section className="px-4 py-20 relative overflow-hidden" style={{ background: 'var(--color-muted)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-30"
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,.06) 0%, transparent 50%, rgba(236,72,153,.04) 100%)' }} />
        </div>
        <div className="w-full mx-auto max-w-3xl text-center relative z-10">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4" style={{ color: 'var(--color-foreground)' }}>
            Ready to eat something <span className="text-gradient">amazing?</span>
          </h2>
          <p className="text-[var(--color-muted-foreground)] text-lg mb-10 max-w-xl mx-auto">
            Explore our full menu and order your favorites in seconds.
          </p>
          <Link href="/menu" className="btn-primary text-base px-10 py-4 inline-flex">
            Explore Menu <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="w-full mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg grid place-items-center"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              <span className="text-white text-[10px] font-black">R</span>
            </div>
            <span className="font-bold text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Radhna Cuisine</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            © {new Date().getFullYear()} Radhna Cuisine. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            <Link href="/menu" className="hover:text-[var(--color-primary)] transition-colors">Menu</Link>
            <Link href="/orders" className="hover:text-[var(--color-primary)] transition-colors">Orders</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
