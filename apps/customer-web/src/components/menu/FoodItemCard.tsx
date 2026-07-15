'use client';

import Image from 'next/image';
import { FoodItem } from '@/lib/api/menu';
import { useCartStore } from '@/lib/store/cartStore';

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'xs' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = rating >= star ? 'text-yellow-400' : rating >= star - 0.5 ? 'text-yellow-300' : 'text-gray-200';
        return (
          <svg key={star} className={`${sizeClass} ${fill}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
    </div>
  );
}

export function FoodItemCard({ item }: { item: FoodItem }) {
  const { addItem } = useCartStore();
  const isOutOfStock = item.productionStock !== null && item.productionStock !== undefined && item.productionStock.availableQty <= 0;
  const hasRating = item.averageRating && item.averageRating > 0;

  return (
    <div className={`premium-card group overflow-hidden flex flex-col h-full relative ${isOutOfStock ? 'opacity-60' : ''}`}>
      {/* Top-right badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        {item.isPopular && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            Popular
          </span>
        )}
        {item.isTodaysSpecial && (
          <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            Today&apos;s Special
          </span>
        )}
        {isOutOfStock && (
          <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            Out of Stock
          </span>
        )}
      </div>

      <div className="relative w-full h-48 overflow-hidden bg-muted">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image available
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-lg leading-tight line-clamp-1">{item.name}</h3>
          <span className="font-bold text-primary">₹{Number(item.price).toFixed(2)}</span>
        </div>

        {/* Star rating */}
        {hasRating && (
          <div className="flex items-center gap-1.5 mb-2">
            <StarRating rating={item.averageRating!} />
            <span className="text-xs font-medium text-muted-foreground">
              {item.averageRating!.toFixed(1)} ({item.totalReviews})
            </span>
          </div>
        )}

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-grow">
          {item.description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            item.isVeg
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
          </span>
          {isOutOfStock ? (
            <span className="text-xs text-gray-400 font-medium px-4 py-2">Unavailable</span>
          ) : (
            <button
              onClick={() => addItem(item)}
              className="bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-sm active:scale-95 transform"
            >
              Add to Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { StarRating };
