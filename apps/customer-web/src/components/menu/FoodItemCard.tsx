'use client';

import Image from 'next/image';
import { FoodItem } from '@/lib/api/menu';
import { useCartStore } from '@/lib/store/cartStore';
import { Plus, Minus, Flame, Sparkles } from 'lucide-react';

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'xs' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = rating >= star ? 'text-yellow-400 fill-yellow-400' : rating >= star - 0.5 ? 'text-yellow-400 fill-yellow-200' : 'text-gray-200';
        return (
          <svg key={star} className={`${sizeClass} ${fill}`} viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
    </div>
  );
}

export function FoodItemCard({ item }: { item: FoodItem }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const stockQty = item.productionStock?.availableQty;
  const isOutOfStock = item.isOutOfStock || (stockQty !== undefined && stockQty !== null && stockQty <= 0);
  const isLowStock = stockQty !== undefined && stockQty !== null && stockQty > 0 && stockQty <= 5;
  const hasRating = item.averageRating && item.averageRating > 0;

  return (
    <div className={`group bg-white/5 dark:bg-zinc-900/40 backdrop-blur-md hover:bg-white/10 dark:hover:bg-zinc-900/60 hover:shadow-2xl rounded-3xl border border-white/10 dark:border-zinc-800/50 overflow-hidden flex flex-col h-full relative transition-all duration-300 transform hover:-translate-y-1.5 ${isOutOfStock ? 'opacity-65 grayscale-[30%]' : ''}`}>
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
        <span className={`w-5 h-5 rounded-md flex items-center justify-center border text-[10px] font-bold shadow-md bg-white dark:bg-zinc-900 ${
          item.isVeg ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'
        }`}>
          {item.isVeg ? '🟢' : '🔴'}
        </span>
        {item.isPopular && (
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
            <Flame className="w-3 h-3 fill-white" /> Popular
          </span>
        )}
        {item.isTodaysSpecial && (
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Special
          </span>
        )}
      </div>

      {/* Stock warning */}
      <div className="absolute top-3 right-3 z-10">
        {isOutOfStock ? (
          <span className="bg-zinc-900/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md">
            Out of Stock
          </span>
        ) : isLowStock ? (
          <span className="bg-amber-500/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md">
            Only {stockQty} left!
          </span>
        ) : null}
      </div>

      {/* Image Container */}
      <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-muted/50">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-medium">
            Radhna Cuisine
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <h3 className="font-bold text-base sm:text-lg leading-tight text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          <span className="font-extrabold text-base sm:text-lg text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            ₹{Number(item.price).toFixed(0)}
          </span>
        </div>

        {/* Rating */}
        {hasRating ? (
          <div className="flex items-center gap-1.5 mb-2">
            <StarRating rating={item.averageRating!} />
            <span className="text-xs font-semibold text-muted-foreground">
              {item.averageRating!.toFixed(1)} ({item.totalReviews})
            </span>
          </div>
        ) : (
          <div className="h-4 mb-2" />
        )}

        <p className="text-xs sm:text-sm text-muted-foreground/80 line-clamp-2 mb-4 flex-grow leading-relaxed">
          {item.description}
        </p>

        {/* Action Button & Quantity Control */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40 mt-auto">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {item.isVeg ? 'Vegetarian' : 'Non-Veg'}
          </span>

          {isOutOfStock ? (
            <span className="text-xs text-muted-foreground font-semibold px-3 py-1.5 bg-muted rounded-full">
              Unavailable
            </span>
          ) : quantity > 0 ? (
            /* Inline Quantity Controller */
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-full p-1 shadow-sm animate-fade-in">
              <button
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="w-7 h-7 flex items-center justify-center bg-white dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
                title="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-extrabold w-5 text-center text-emerald-700 dark:text-emerald-300">
                {quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, quantity + 1)}
                className="w-7 h-7 flex items-center justify-center bg-emerald-600 text-white rounded-full shadow-sm hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all"
                title="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Add Button */
            <button
              onClick={() => addItem(item)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-md hover:shadow-emerald-500/20 active:scale-95 transform"
            >
              <Plus className="w-4 h-4" /> ADD
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { StarRating };
