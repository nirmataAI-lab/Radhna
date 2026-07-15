import { useEffect, useState } from 'react';
import { Loader2, Star, MessageSquare, User as UserIcon } from 'lucide-react';
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
        const fi = await fetchAllFoodItems();
        setItems(fi);
        const results = await Promise.all(
          fi.slice(0, 100).map(async (i) => [i.id, await fetchItemReviews(i.id).catch(() => ({ reviews: [], averageRating: 0, totalReviews: 0 }))] as const)
        );
        setReviews(Object.fromEntries(results));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const sorted = [...items].sort((a, b) => (reviews[b.id]?.totalReviews || 0) - (reviews[a.id]?.totalReviews || 0));

  return (
    <div className="animate-in fade-in duration-300">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Reviews</h2>
        <p className="text-[var(--color-muted-foreground)] text-sm mt-1">Customer ratings per food item</p>
      </header>

      <ReviewsModal 
        open={selected !== null} 
        item={selected} 
        onClose={() => setSelected(null)} 
      />

      {loading ? (
        <div className="p-16 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--color-muted-foreground)]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map(i => {
            const r = reviews[i.id];
            const stars = r?.averageRating || 0;
            return (
              <Card 
                key={i.id} 
                className="cursor-pointer transition-all hover:shadow-md hover:border-[var(--color-primary)]/50 group"
                onClick={() => setSelected(i)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-lg group-hover:text-[var(--color-primary)] transition-colors">{i.name}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">{i.category?.name || '—'}</p>
                    </div>
                    {i.imageUrl && (
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-[var(--color-border)]">
                        <img src={i.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-6 bg-[var(--color-muted)]/30 p-2.5 rounded-lg border border-[var(--color-border)]">
                    <div className="flex items-center gap-1.5">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(n => (
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
              {[1, 2, 3, 4, 5].map(n => (
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
          : data.reviews.map(r => (
            <div key={r.id} className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-muted)]/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">{r.customer?.name || 'Guest'}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(n => (
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
