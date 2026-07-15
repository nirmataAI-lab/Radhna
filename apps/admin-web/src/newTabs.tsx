import { useCallback, useEffect, useState } from 'react';
import {
  Package, AlertTriangle, Plus, Loader2, Trash2, Edit3, RefreshCcw,
  Star, MessageSquare, ScrollText, User as UserIcon, Search, Download,
} from 'lucide-react';
import {
  fetchInventory, fetchInventoryAlerts, createInventoryItem, updateInventoryItem, deleteInventoryItem,
  fetchAllFoodItems, fetchItemReviews, fetchAuditLog,
} from './api';
import type { InventoryItem, FoodItem, ItemReviews, AuditEntry } from './api';
import { exportRowsAsCSV } from './lib/csv';

// ─── Inventory Tab ──────────────────────────────────

export function InventoryTab() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<{ outOfStock: InventoryItem[]; lowStock: InventoryItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [inv, al] = await Promise.all([fetchInventory(search || undefined, 1, 100), fetchInventoryAlerts()]);
      setItems(inv.data);
      setAlerts(al);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this raw material?')) return;
    await deleteInventoryItem(id);
    load();
  };

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">Raw materials & stock levels</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--color-muted-foreground)]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
              className="text-sm pl-9 pr-3 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40" />
          </div>
          <button onClick={load} className="p-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)]">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 text-sm font-semibold gradient-button px-4 py-2 rounded-lg">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </header>

      {alerts && (alerts.outOfStock.length > 0 || alerts.lowStock.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {alerts.outOfStock.length > 0 && (
            <div className="premium-card p-4 border-red-200 dark:border-red-900/50">
              <div className="flex items-center gap-2 mb-2 text-red-600">
                <AlertTriangle className="w-4 h-4" /><span className="font-semibold text-sm">Out of Stock ({alerts.outOfStock.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {alerts.outOfStock.slice(0, 8).map(i => (
                  <span key={i.id} className="text-xs px-2 py-0.5 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 rounded-full">{i.name}</span>
                ))}
              </div>
            </div>
          )}
          {alerts.lowStock.length > 0 && (
            <div className="premium-card p-4 border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center gap-2 mb-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" /><span className="font-semibold text-sm">Low Stock ({alerts.lowStock.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {alerts.lowStock.slice(0, 8).map(i => (
                  <span key={i.id} className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 rounded-full">
                    {i.name} · {Number(i.quantity)}{i.unit}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(showAdd || editing) && (
        <InventoryFormModal item={editing} onClose={() => { setShowAdd(false); setEditing(null); }} onSaved={() => { setShowAdd(false); setEditing(null); load(); }} />
      )}

      <div className="premium-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin text-[var(--color-primary)]" /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-muted-foreground)]">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No raw materials yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/50">
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Quantity</th>
                  <th className="text-left p-3 font-semibold">Low-stock threshold</th>
                  <th className="text-left p-3 font-semibold">Supplier ref</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-right p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => {
                  const q = Number(i.quantity);
                  const t = Number(i.lowStockThreshold);
                  const isOut = q <= 0;
                  const isLow = !isOut && q <= t;
                  return (
                    <tr key={i.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)]/40 transition-colors">
                      <td className="p-3 font-medium">{i.name}</td>
                      <td className="p-3 font-mono">{q} <span className="text-[var(--color-muted-foreground)]">{i.unit}</span></td>
                      <td className="p-3 font-mono text-[var(--color-muted-foreground)]">{t} {i.unit}</td>
                      <td className="p-3 text-[var(--color-muted-foreground)]">{i.supplierReference || '—'}</td>
                      <td className="p-3">
                        {isOut ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">OUT</span>
                          : isLow ? <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">LOW</span>
                          : <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300">OK</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setEditing(i)} className="p-1.5 rounded-md hover:bg-[var(--color-muted)]" title="Edit">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryFormModal({ item, onClose, onSaved }: { item: InventoryItem | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(item?.name || '');
  const [unit, setUnit] = useState(item?.unit || 'kg');
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 0));
  const [threshold, setThreshold] = useState(String(item?.lowStockThreshold ?? 5));
  const [supplier, setSupplier] = useState(item?.supplierReference || '');
  const [saving, setSaving] = useState(false);

  const inputClass = "w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40";

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: name.trim(), unit: unit.trim(),
        quantity: Number(quantity) || 0,
        lowStockThreshold: Number(threshold) || 0,
        supplierReference: supplier.trim() || undefined,
      };
      if (item) await updateInventoryItem(item.id, data);
      else await createInventoryItem(data);
      onSaved();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="premium-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">{item ? 'Edit' : 'Add'} raw material</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="text-xs font-medium mb-1 block">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} /></div>
          <div><label className="text-xs font-medium mb-1 block">Unit</label>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg / l / pcs" className={inputClass} /></div>
          <div><label className="text-xs font-medium mb-1 block">Quantity</label>
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" step="0.01" className={inputClass} /></div>
          <div><label className="text-xs font-medium mb-1 block">Low-stock threshold</label>
            <input value={threshold} onChange={(e) => setThreshold(e.target.value)} type="number" step="0.01" className={inputClass} /></div>
          <div><label className="text-xs font-medium mb-1 block">Supplier ref</label>
            <input value={supplier} onChange={(e) => setSupplier(e.target.value)} className={inputClass} /></div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)]">Cancel</button>
          <button onClick={save} disabled={saving || !name.trim()}
            className="flex-1 gradient-button px-4 py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} {item ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reviews Tab ────────────────────────────────────

export function ReviewsTab() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [reviews, setReviews] = useState<Record<string, ItemReviews>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const fi = await fetchAllFoodItems();
        setItems(fi);
        // Fetch review summaries in parallel (limit to avoid huge load)
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
    <div>
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Reviews</h2>
        <p className="text-[var(--color-muted-foreground)] text-sm mt-1">Customer ratings per food item</p>
      </header>

      {selected && <ReviewsModal item={selected} onClose={() => setSelected(null)} />}

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin text-[var(--color-primary)]" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(i => {
            const r = reviews[i.id];
            const stars = r?.averageRating || 0;
            return (
              <button key={i.id} onClick={() => setSelected(i)}
                className="premium-card p-4 text-left group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{i.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] truncate">{i.category?.name || '—'}</p>
                  </div>
                  {i.imageUrl && <img src={i.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`w-4 h-4 ${n <= Math.round(stars) ? 'fill-amber-400 text-amber-400' : 'text-[var(--color-border)]'}`} />
                    ))}
                    <span className="text-xs font-mono ml-1">{stars.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-[var(--color-muted-foreground)] flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {r?.totalReviews || 0}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewsModal({ item, onClose }: { item: FoodItem; onClose: () => void }) {
  const [data, setData] = useState<ItemReviews | null>(null);
  useEffect(() => { fetchItemReviews(item.id).then(setData).catch(console.error); }, [item.id]);
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="premium-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-[var(--color-border)]">
          <h3 className="font-bold text-lg">{item.name}</h3>
          {data && (
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} className={`w-4 h-4 ${n <= Math.round(data.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-[var(--color-border)]'}`} />
                ))}
              </div>
              <span className="text-sm font-mono">{data.averageRating.toFixed(1)}</span>
              <span className="text-sm text-[var(--color-muted-foreground)]">· {data.totalReviews} reviews</span>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!data ? <Loader2 className="w-6 h-6 mx-auto animate-spin" />
            : data.reviews.length === 0 ? <p className="text-center text-[var(--color-muted-foreground)] py-8">No reviews yet</p>
            : data.reviews.map(r => (
              <div key={r.id} className="border-b border-[var(--color-border)] pb-3 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[var(--color-muted)] flex items-center justify-center">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium">{r.customer?.name || 'Guest'}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`w-3 h-3 ${n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--color-border)]'}`} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-sm text-[var(--color-muted-foreground)]">{r.comment}</p>}
                <p className="text-xs text-[var(--color-muted-foreground)] mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
        </div>
        <div className="p-4 border-t border-[var(--color-border)]">
          <button onClick={onClose} className="w-full px-4 py-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)]">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Audit Log Tab ──────────────────────────────────

export function AuditTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await fetchAuditLog(p, 50);
      setEntries(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(page); }, [page, load]);

  return (
    <div>
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Log</h2>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">Admin actions & sensitive changes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportRowsAsCSV(`audit-log-${new Date().toISOString().slice(0,10)}`, entries, [
              { key: 'timestamp', label: 'When', format: (v) => new Date(v).toISOString() },
              { key: 'admin', label: 'Admin', format: (_v, r) => r.admin?.name || r.admin?.email || '' },
              { key: 'action', label: 'Action' },
              { key: 'entity', label: 'Entity' },
              { key: 'entityId', label: 'Entity ID' },
              { key: 'reason', label: 'Reason' },
            ])}
            disabled={entries.length === 0}
            className="flex items-center gap-2 text-sm border border-[var(--color-border)] px-3 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => load(page)} className="p-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-muted)]">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="premium-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin text-[var(--color-primary)]" /></div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-muted-foreground)]">
            <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No audit entries</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/50">
                  <th className="text-left p-3 font-semibold">When</th>
                  <th className="text-left p-3 font-semibold">Admin</th>
                  <th className="text-left p-3 font-semibold">Action</th>
                  <th className="text-left p-3 font-semibold">Entity</th>
                  <th className="text-left p-3 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)]/40 transition-colors">
                    <td className="p-3 text-[var(--color-muted-foreground)] whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</td>
                    <td className="p-3">{e.admin?.name || <span className="text-[var(--color-muted-foreground)]">—</span>}</td>
                    <td className="p-3"><span className="text-xs font-bold px-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] uppercase">{e.action}</span></td>
                    <td className="p-3 font-mono text-xs">{e.entity} <span className="text-[var(--color-muted-foreground)]">{e.entityId.slice(0, 8)}…</span></td>
                    <td className="p-3 text-[var(--color-muted-foreground)]">{e.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-muted)]">Prev</button>
          <span className="text-sm text-[var(--color-muted-foreground)]">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-muted)]">Next</button>
        </div>
      )}
    </div>
  );
}
