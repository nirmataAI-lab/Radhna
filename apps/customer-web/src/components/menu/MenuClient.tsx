'use client';

import { useState, useMemo } from 'react';
import { Category, FoodItem } from '@/lib/api/menu';
import { FoodItemCard } from './FoodItemCard';
import { useCartStore } from '@/lib/store/cartStore';
import { Search, Sparkles, ShoppingBag, ArrowRight, Filter } from 'lucide-react';
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

  const { items: cartItems, getTotalItems, getTotalPrice, setIsOpen } = useCartStore();
  const totalCartItems = getTotalItems();
  const totalCartPrice = getTotalPrice();

  // Filter and Sort Items
  const filteredItems = useMemo(() => {
    let result = [...foodItems];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((item) => item.categoryId === selectedCategory);
    }

    // Dietary filter
    if (dietaryFilter === 'veg') {
      result = result.filter((item) => item.isVeg);
    } else if (dietaryFilter === 'nonveg') {
      result = result.filter((item) => !item.isVeg);
    }

    // Sort
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
    <div className="pb-24">
      {/* Search & Filter Header Bar */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border-b border-border/60 py-4 mb-8 shadow-sm">
        <div className="container mx-auto px-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Dosa, Maggi, Lassi, Coffee..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted/60 hover:bg-muted border border-border/60 rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* Controls: Veg/Non-Veg & Sort */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Dietary Tabs */}
            <div className="flex items-center bg-muted/80 p-1 rounded-full border border-border/40 text-xs font-semibold">
              <button
                onClick={() => setDietaryFilter('all')}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  dietaryFilter === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDietaryFilter('veg')}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                  dietaryFilter === 'veg'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                🟢 Veg
              </button>
              <button
                onClick={() => setDietaryFilter('nonveg')}
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                  dietaryFilter === 'nonveg'
                    ? 'bg-red-600 text-white font-bold shadow-sm'
                    : 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                }`}
              >
                🔴 Non-Veg
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-muted/80 px-3 py-1.5 rounded-full border border-border/40 text-xs font-semibold text-muted-foreground">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-foreground focus:outline-none cursor-pointer"
              >
                <option value="default">Default Sort</option>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

        </div>

        {/* Category Horizontal Pill Tabs */}
        <div className="container mx-auto px-4 mt-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              All Items ({foodItems.length})
            </button>

            {categories.map((cat) => {
              const count = foodItems.filter((i) => i.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4">
        {/* Today's Specials Showcase */}
        {hasSpecials && !error && selectedCategory === 'all' && !searchQuery && (
          <div className="mb-10 rounded-3xl p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/20 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
              <h2 className="text-xl font-black tracking-tight">Today&apos;s Specials</h2>
              <span className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Fresh & Hot
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {specials.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-card/80 backdrop-blur-md p-3 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                    {item.imageUrl && (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-grow">
                    <p className="font-bold text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-emerald-600 font-extrabold text-xs mt-0.5">
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
          <div className="text-center py-16 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-3xl border border-red-200 dark:border-red-900">
            <p className="font-bold text-xl mb-1">Unable to load menu</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border">
            <p className="text-xl font-bold text-foreground">No items match your search</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search query or dietary filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setDietaryFilter('all');
              }}
              className="mt-5 px-6 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-bold shadow-md hover:bg-emerald-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Grid View */
          <div className="space-y-12">
            {selectedCategory === 'all' && !searchQuery ? (
              categories.map((cat) => {
                const categoryItems = filteredItems.filter((i) => i.categoryId === cat.id);
                if (categoryItems.length === 0) return null;

                return (
                  <section key={cat.id} className="scroll-mt-36">
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="text-2xl font-black tracking-tight text-foreground">
                        {cat.name}
                      </h2>
                      <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
                        {categoryItems.length} items
                      </span>
                      <div className="h-px bg-border flex-grow ml-2" />
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
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg animate-slide-up">
          <div
            onClick={() => setIsOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between cursor-pointer border border-emerald-400/30 backdrop-blur-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black text-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm leading-tight">
                  {totalCartItems} {totalCartItems === 1 ? 'Item' : 'Items'} Added
                </p>
                <p className="text-xs text-emerald-100 font-semibold">
                  Subtotal: ₹{totalCartPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-black text-sm bg-white/20 px-4 py-2 rounded-xl">
              <span>View Cart & Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
