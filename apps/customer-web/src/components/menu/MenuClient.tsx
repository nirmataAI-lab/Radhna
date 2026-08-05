'use client';

import { useState, useMemo } from 'react';
import { Category, FoodItem } from '@/lib/api/menu';
import { FoodItemCard } from './FoodItemCard';
import { useCartStore } from '@/lib/store/cartStore';
import { Search, Sparkles, ShoppingBag, ArrowRight, Filter, Flame } from 'lucide-react';
import Image from 'next/image';

interface MenuClientProps {
  categories: Category[];
  foodItems: FoodItem[];
  specials: FoodItem[];
  error?: string | null;
}

export function MenuClient({ categories, foodItems, specials, error }: MenuClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'popular'>('default');

  const { getTotalItems, getTotalPrice, setIsOpen } = useCartStore();
  const totalCartItems = getTotalItems();
  const totalCartPrice = getTotalPrice();

  // Filter and Sort Items
  const filteredItems = useMemo(() => {
    let result = [...foodItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.categoryId === selectedCategory);
    }

    if (dietaryFilter === 'veg') {
      result = result.filter((item) => item.isVeg);
    } else if (dietaryFilter === 'nonveg') {
      result = result.filter((item) => !item.isVeg);
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    }

    return result;
  }, [foodItems, searchQuery, selectedCategory, dietaryFilter, sortBy]);

  const hasSpecials = specials.length > 0;

  return (
    <div className="pb-28">
      {/* Search & Filter Header Bar */}
      <div className="sticky top-16 z-30 glass-effect py-3 shadow-sm"
        style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="container mx-auto px-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-9 pr-8 py-2 rounded-full text-sm outline-none transition-all focus:ring-2"
              style={{
                background: 'var(--color-muted)',
                border: '1.5px solid var(--color-border)',
                color: 'var(--color-foreground)',
                '--tw-ring-color': 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
              } as any}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 transition-colors">
                <span className="text-xs font-bold text-muted-foreground">✕</span>
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {/* Dietary Tabs */}
            <div className="flex items-center p-1 rounded-full shrink-0"
              style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
              <button onClick={() => setDietaryFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  dietaryFilter === 'all'
                    ? 'shadow-sm'
                    : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                style={{
                  background: dietaryFilter === 'all' ? 'var(--color-card)' : 'transparent',
                  color: dietaryFilter === 'all' ? 'var(--color-foreground)' : 'var(--color-muted-foreground)'
                }}>
                All
              </button>
              <button onClick={() => setDietaryFilter('veg')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                  dietaryFilter === 'veg' ? 'shadow-md' : 'hover:bg-[#16a34a]/10'
                }`}
                style={{
                  background: dietaryFilter === 'veg' ? '#16a34a' : 'transparent',
                  color: dietaryFilter === 'veg' ? 'white' : '#16a34a'
                }}>
                ● Veg
              </button>
              <button onClick={() => setDietaryFilter('nonveg')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                  dietaryFilter === 'nonveg' ? 'shadow-md' : 'hover:bg-[#dc2626]/10'
                }`}
                style={{
                  background: dietaryFilter === 'nonveg' ? '#dc2626' : 'transparent',
                  color: dietaryFilter === 'nonveg' ? 'white' : '#dc2626'
                }}>
                ● Non-Veg
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
              style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer outline-none"
                style={{ color: 'var(--color-foreground)' }}>
                <option value="default">Sort</option>
                <option value="popular">Popular</option>
                <option value="price-low">Low Price</option>
                <option value="price-high">High Price</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Horizontal Pill Tabs */}
        <div className="container mx-auto px-4 mt-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button onClick={() => setSelectedCategory('all')}
              className={`cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}>
              All Items ({foodItems.length})
            </button>
            {categories.map((cat) => {
              const count = foodItems.filter((i) => i.categoryId === cat.id).length;
              return (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className={`cat-pill ${selectedCategory === cat.id ? 'active' : ''}`}>
                  {cat.name} <span className="opacity-70 font-mono text-[10px] ml-0.5">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 mt-8">
        {/* Today's Specials Showcase */}
        {hasSpecials && !error && selectedCategory === 'all' && !searchQuery && (
          <div className="mb-12 rounded-3xl p-6 relative overflow-hidden shadow-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,.08), rgba(249,115,22,.08), rgba(225,29,72,.05))',
              border: '1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)'
            }}>
            <div className="flex items-center gap-2 mb-5">
              <Flame className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <h2 className="font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--color-foreground)' }}>Today's Specials</h2>
              <span className="badge-special ml-2 animate-pulse-slow">Fresh & Hot</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {specials.map((item) => (
                <div key={item.id}
                  className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--color-muted)' }}>
                    {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm truncate" style={{ color: 'var(--color-foreground)' }}>{item.name}</p>
                    <p className="font-black text-sm mt-0.5" style={{ color: 'var(--color-primary)' }}>
                      ₹{Number(item.price).toFixed(0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors / Empty State */}
        {error ? (
          <div className="text-center py-16 rounded-3xl"
            style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)' }}>
            <p className="font-bold text-xl mb-1 text-red-600">Unable to load menu</p>
            <p className="text-sm opacity-80 text-red-600">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 rounded-3xl"
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <p className="text-xl font-bold" style={{ color: 'var(--color-foreground)' }}>No items match your search</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
              Try adjusting your search query or dietary filters.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setDietaryFilter('all'); }}
              className="btn-primary mt-6 text-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Grid View */
          <div className="space-y-14">
            {selectedCategory === 'all' && !searchQuery ? (
              categories.map((cat) => {
                const categoryItems = filteredItems.filter((i) => i.categoryId === cat.id);
                if (categoryItems.length === 0) return null;

                return (
                  <section key={cat.id} className="scroll-mt-44">
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
                        {cat.name}
                      </h2>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)', border: '1px solid var(--color-border)' }}>
                        {categoryItems.length} items
                      </span>
                      <div className="h-px flex-grow ml-2" style={{ background: 'var(--color-border)' }} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {categoryItems.map((item) => (
                        <FoodItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </section>
                );
              })
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map((item) => (
                  <FoodItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-lg animate-slide-up">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full p-4 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              boxShadow: 'var(--shadow-glow)',
              border: '1px solid color-mix(in srgb, white 20%, transparent)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl grid place-items-center"
                style={{ background: 'rgba(0,0,0,.15)' }}>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm leading-tight">
                  {totalCartItems} {totalCartItems === 1 ? 'Item' : 'Items'} Added
                </p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,.8)' }}>
                  Subtotal: ₹{totalCartPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-bold text-sm px-4 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,.15)' }}>
              <span>Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
