import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { InstallPWA } from "@/components/InstallPWA";
import { getTodaysSpecials } from "@/lib/api/menu";
import type { FoodItem } from "@/lib/api/menu";
import Image from "next/image";

export default async function Home() {
  let specials: FoodItem[] = [];
  try {
    specials = await getTodaysSpecials();
  } catch {
    // Backend may not be running
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--primary)] opacity-10 blur-[150px] animate-pulse-slow rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500 opacity-10 blur-[150px] animate-pulse-slow rounded-full" style={{ animationDelay: '1.5s' }} />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="flex-grow flex items-center justify-center px-4 py-32 relative">
        <div className="max-w-5xl mx-auto text-center z-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-semibold mb-8 ring-1 ring-[var(--primary)]/20 shadow-[var(--shadow-glow)] animate-fade-in">
            <span className="animate-pulse">✨</span> Experience Radhna Cuisine
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[1.1]">
            Taste the <span className="text-gradient animate-pulse-slow inline-block">Extraordinary</span>
          </h1>
          <p className="text-xl md:text-2xl text-[var(--muted-foreground)] mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Elevate your dining experience with world-class chefs, premium ingredients, and lightning-fast service.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/menu"
              className="group relative w-full sm:w-auto px-10 py-5 bg-[var(--primary)] text-white rounded-full font-bold shadow-[var(--shadow-glow)] hover:shadow-[0_0_30px_rgba(249,115,22,0.6)] hover:-translate-y-1 transition-all duration-300 text-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" />
              <span className="relative z-10 flex items-center gap-2">
                Order Now
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </Link>
            <Link
              href="/menu"
              className="group w-full sm:w-auto px-10 py-5 bg-[var(--card)] text-[var(--card-foreground)] border-2 border-[var(--border)] rounded-full font-bold shadow-sm hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-1 transition-all duration-300 text-lg flex items-center justify-center gap-2"
            >
              View Menu
            </Link>
            <InstallPWA 
              variant="inline" 
              className="group w-full sm:w-auto px-10 py-5 bg-[var(--card)] text-[var(--card-foreground)] border-2 border-[var(--border)] rounded-full font-bold shadow-sm hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-1 transition-all duration-300 text-lg flex items-center justify-center gap-2"
            />
          </div>
        </div>
        
        {/* Floating elements for visual interest */}
        <div className="absolute top-[20%] left-[10%] text-4xl animate-float opacity-50 blur-[1px]">🍕</div>
        <div className="absolute bottom-[20%] right-[15%] text-5xl animate-float opacity-50 blur-[1px]" style={{ animationDelay: '2s' }}>🥗</div>
        <div className="absolute top-[30%] right-[10%] text-3xl animate-float opacity-50 blur-[2px]" style={{ animationDelay: '1s' }}>🍣</div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-24 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { emoji: "⚡", title: "Lightning Fast", desc: "Our cloud kitchens are optimized for speed without compromising quality." },
              { emoji: "👨‍🍳", title: "Master Chefs", desc: "Every dish is meticulously prepared by culinary experts." },
              { emoji: "🌟", title: "Premium Quality", desc: "We source only the finest, freshest ingredients globally." },
            ].map((feature, idx) => (
              <div key={idx} className="glass-card p-8 text-center animate-slide-up group" style={{ animationDelay: `${idx * 0.15}s` }}>
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[var(--primary)] to-pink-500 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  {feature.emoji}
                </div>
                <h3 className="font-[family-name:var(--font-display)] font-bold text-2xl mb-3">{feature.title}</h3>
                <p className="text-[var(--muted-foreground)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Today's Specials Section */}
      {specials.length > 0 && (
        <section className="px-4 py-32 bg-[var(--muted)]/30 relative">
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-16 animate-slide-up">
              <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-black tracking-tight mb-4">
                Signature <span className="text-gradient">Creations</span>
              </h2>
              <p className="text-[var(--muted-foreground)] text-lg max-w-2xl mx-auto">
                Handpicked specialties available for a limited time.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {specials.slice(0, 3).map((item, idx) => (
                <Link
                  key={item.id}
                  href={`/menu`}
                  className="premium-card group animate-slide-up"
                  style={{ animationDelay: `${idx * 0.15}s` }}
                >
                  <div className="relative h-64 bg-[var(--muted)] overflow-hidden">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] font-medium">
                        No image available
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                    
                    <div className="absolute top-4 right-4">
                      <span className="bg-white/90 backdrop-blur-sm text-black text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                        Special
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <h3 className="font-[family-name:var(--font-display)] font-bold text-2xl text-white drop-shadow-md">{item.name}</h3>
                      <span className="font-bold text-[var(--primary)] bg-white px-3 py-1 rounded-lg shadow-lg text-lg">
                        ₹{Number(item.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-[var(--muted-foreground)] line-clamp-2 leading-relaxed">
                      {item.description || "A delicious signature dish prepared with care."}
                    </p>
                    <div className="mt-6 flex items-center text-[var(--primary)] font-semibold gap-2 group-hover:gap-3 transition-all">
                      Order Now
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
