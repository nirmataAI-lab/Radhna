'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FoodItem } from '@/lib/api/menu';
import { useCartStore } from '@/lib/store/cartStore';
import { Plus, Minus, Flame, Sparkles, Star } from 'lucide-react';

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const half   = !filled && rating >= star - 0.5;
          return (
            <Star key={star}
              className="w-3.5 h-3.5 transition-transform"
              style={{
                color: filled || half ? '#f59e0b' : 'var(--color-border-strong)',
                fill: filled ? '#f59e0b' : half ? 'none' : 'none',
              }} />
          );
        })}
      </div>
      {rating > 0 && (
        <span className="text-xs font-semibold" style={{ color: 'var(--color-muted-foreground)' }}>
          {rating.toFixed(1)}{count ? ` (${count})` : ''}
        </span>
      )}
    </div>
  );
}

export function FoodItemCard({ item }: { item: FoodItem }) {
  const { items, addItem, updateQuantity } = useCartStore();
  const [justAdded, setJustAdded] = useState(false);
  const cartItem = items.find((i) => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    addItem(item);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1300);
  };

  const stockQty    = item.productionStock?.availableQty;
  const isOutOfStock = item.isOutOfStock || (stockQty !== undefined && stockQty !== null && stockQty <= 0);
  const isLowStock  = stockQty !== undefined && stockQty !== null && stockQty > 0 && stockQty <= 5;
  const hasRating   = item.averageRating && item.averageRating > 0;

  return (
    <article className={`food-card flex flex-col h-full group ${isOutOfStock ? 'opacity-60 grayscale-[20%]' : ''}`}>
      {/* ── Image ─────────────────────────── */}
      <div className="relative w-full h-44 sm:h-48 overflow-hidden" style={{ background: 'var(--color-muted)' }}>
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="food-img object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-20 select-none">
            🍽️
          </div>
        )}

        {/* Gradient for card bottom text overlay when needed */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          {/* Veg/Non-veg dot */}
          <span className="w-5 h-5 rounded-md flex items-center justify-center border text-[10px] font-bold bg-white shadow-sm"
            style={{ borderColor: item.isVeg ? '#16a34a' : '#dc2626', color: item.isVeg ? '#16a34a' : '#dc2626' }}>
            {item.isVeg ? '●' : '●'}
          </span>
          {item.isPopular && (
            <span className="badge-popular"><Flame className="w-3 h-3 fill-white" /> Popular</span>
          )}
          {item.isTodaysSpecial && (
            <span className="badge-special"><Sparkles className="w-3 h-3" /> Special</span>
          )}
        </div>

        {/* Top right — stock status */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md"
              style={{ background: 'rgba(15,15,15,.88)', color: 'rgba(255,255,255,.9)', backdropFilter: 'blur(4px)' }}>
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md"
              style={{ background: 'rgba(234,88,12,.88)', color: 'white', backdropFilter: 'blur(4px)' }}>
              Only {stockQty} left
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Content ───────────────────────── */}
      <div className="p-4 flex flex-col flex-1">
        {/* Name + price */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-base leading-tight line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors"
            style={{ color: 'var(--color-foreground)' }}>
            {item.name}
          </h3>
          <span className="font-black text-lg shrink-0" style={{ color: 'var(--color-primary)' }}>
            ₹{Number(item.price).toFixed(0)}
          </span>
        </div>

        {/* Rating */}
        {hasRating ? (
          <div className="mb-2.5">
            <StarRating rating={item.averageRating!} count={item.totalReviews} />
          </div>
        ) : (
          <div className="mb-2.5 h-5" />
        )}

        {/* Description */}
        <p className="text-sm line-clamp-2 flex-1 mb-4 leading-relaxed"
          style={{ color: 'var(--color-muted-foreground)' }}>
          {item.description || 'A freshly prepared dish made with quality ingredients.'}
        </p>

        {/* Action row */}
        <div className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid var(--color-border)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: item.isVeg ? '#16a34a' : '#dc2626' }}>
            {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
          </span>

          {isOutOfStock ? (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }}>
              Unavailable
            </span>
          ) : quantity > 0 ? (
            /* Qty stepper */
            <div className="qty-stepper">
              <button className="qty-btn qty-btn-minus" onClick={() => updateQuantity(item.id, quantity - 1)} aria-label="Remove one">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="qty-count">{quantity}</span>
              <button className="qty-btn qty-btn-plus" onClick={() => updateQuantity(item.id, quantity + 1)} aria-label="Add one">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Add button */
            <button
              onClick={handleAdd}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-90 ${
                justAdded
                  ? 'animate-add-pop'
                  : 'hover:shadow-md hover:-translate-y-0.5'
              }`}
              style={{
                background: justAdded ? '#16a34a' : 'var(--color-primary)',
                color: 'white',
                boxShadow: justAdded ? '0 4px 12px rgba(22,163,74,.4)' : '0 4px 12px rgba(249,115,22,.35)',
              }}>
              {justAdded ? (
                <span className="flex items-center gap-1">✓ Added!</span>
              ) : (
                <><Plus className="w-4 h-4" /> ADD</>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export { StarRating };
