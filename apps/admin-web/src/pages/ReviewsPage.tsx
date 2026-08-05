import { useEffect, useState, useMemo } from 'react';
import { Loader2, Star, MessageSquare, User as UserIcon, Utensils } from 'lucide-react';
import { fetchAllFoodItems, fetchItemReviews } from '../api';
import type { FoodItem, ItemReviews } from '../api';
import { Card, CardContent, Dialog, Button } from 'ui-components';

export function ReviewsPage() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [reviews, setReviews] = useState<Record<string, ItemReviews>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const fi = await fetchAllFoodItems().catch(() => []);
        setItems(fi);
        const results = await Promise.all(
          fi.slice(0, 100).map(async (i) => [i.id, await fetchItemReviews(i.id).catch(() => ({ reviews: [], averageRating: 0, totalReviews: 0 }))] as const)
        );
        setReviews(Object.fromEntries(results));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  // Group items by category
  const groupedCategories = useMemo(() => {
    const map = new Map<string, { categoryName: string; items: FoodItem[] }>();
    
    for (const item of items) {
      const catName = item.category?.name || 'Uncategorized';
      if (!map.has(catName)) {
        map.set(catName, { categoryName: catName, items: [] });
      }
      map.get(catName)!.items.push(item);
    }

    // Sort items within each category by number of reviews
    return Array.from(map.values()).map(group => ({
      ...group,
      items: group.items.sort((a, b) => (reviews[b.id]?.totalReviews || 0) - (reviews[a.id]?.totalReviews || 0))
    }));
  }, [items, reviews]);

  return (
    <div className="animate-in fade-in duration-300">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Reviews</h2>
        <p className="text-[var(--color-muted-foreground)] text-sm mt-1">Customer ratings organized by category</p>
      </header>

      <ReviewsModal 
        open={selected !== null} 
        item={selected} 
        onClose={() => setSelected(null)} 
      />

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--color-muted-foreground)]" /></div>
      ) : groupedCategories.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-muted-foreground)] border border-dashed rounded-xl">
          <Utensils className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No menu items found</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedCategories.map((group) => (
            <div key={group.categoryName} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-2">
                <h3 className="text-xl font-bold text-[var(--color-primary)]">{group.categoryName}</h3>
                <span className="text-xs bg-[var(--color-muted)] px-2.5 py-0.5 rounded-full font-medium text-[var(--color-muted-foreground)]">
                  {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((i) => {
                  const r = reviews[i.id];
                  const stars = r?.averageRating || 0;
                  return (
                    <Card 
                      key={i.id} 
                      className="cursor-pointer transition-all hover:shadow-md hover:border-[var(--color-primary)]/50 group"
                      onClick={() => setSelected(i)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <p className="font-semibold text-base group-hover:text-[var(--color-primary)] transition-colors truncate">{i.name}</p>
                          <span className="text-xs font-bold text-[var(--color-primary)] shrink-0">₹{Number(i.price).toFixed(2)}</span>
                        </div>

                        <div className="flex items-center justify-between bg-[var(--color-muted)]/30 p-2.5 rounded-lg border border-[var(--color-border)]">
                          <div className="flex items-center gap-1.5">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star key={n} className={`w-4 h-4 ${n <= Math.round(stars) ? 'fill-amber-400 text-amber-400' : 'text-[var(--color-muted-foreground)]/30'}`} />
                              ))}
                            </div>
                            <span className="text-sm font-bold ml-1">{stars.toFixed(1)}</span>
                          </div>
                          <span className="text-xs font-medium text-[var(--color-muted-foreground)] flex items-center gap-1.5 bg-[var(--color-background)] px-2 py-1 rounded-md shadow-sm border border-[var(--color-border)]/50">
                            <MessageSquare className="w-3.5 h-3.5" /> {r?.totalReviews || 0}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewsModal({ open, item, onClose }: { open: boolean; item: FoodItem | null; onClose: () => void }) {
  const [data, setData] = useState<ItemReviews | null>(null);
  
  useEffect(() => { 
    if (open && item) {
      setData(null);
      fetchItemReviews(item.id).then(setData).catch(console.error); 
    }
  }, [open, item]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose} title={item.name}>
      <div className="-mx-6 px-6 pb-2 border-b border-[var(--color-border)]">
        {data && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`w-4 h-4 ${n <= Math.round(data.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-[var(--color-muted-foreground)]/30'}`} />
              ))}
            </div>
            <span className="text-sm font-bold">{data.averageRating.toFixed(1)}</span>
            <span className="text-sm text-[var(--color-muted-foreground)] font-medium">· {data.totalReviews} reviews</span>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto mt-4 max-h-[60vh] space-y-4 pr-2">
        {!data ? <div className="py-8"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--color-muted-foreground)]" /></div>
          : data.reviews.length === 0 ? <p className="text-center text-[var(--color-muted-foreground)] py-12">No reviews yet</p>
          : data.reviews.map((r) => (
            <div key={r.id} className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-muted)]/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center font-bold text-xs">
                    {r.customer?.name?.[0]?.toUpperCase() || <UserIcon className="w-4 h-4" />}
                  </div>
                  <span className="text-sm font-bold text-[var(--color-foreground)]">{r.customer?.name || 'Guest'}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--color-muted-foreground)]/30'}`} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-[var(--color-foreground)] mt-2">{r.comment}</p>}
              <p className="text-xs font-medium text-[var(--color-muted-foreground)] mt-3 pt-3 border-t border-[var(--color-border)]/50">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
      </div>
      <div className="mt-6">
        <Button variant="outline" className="w-full" onClick={onClose}>Close</Button>
      </div>
    </Dialog>
  );
}
