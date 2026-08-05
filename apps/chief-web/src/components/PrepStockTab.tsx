import { useEffect, useMemo, useState, useCallback } from 'react';
import { Package, Save, RefreshCw, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { fetchStock, setItemStock, setBulkStock, type StockRow } from '../stockApi';

export function PrepStockTab() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStock();
      setRows(data);
      setDrafts({});
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll every 20s so decrements from placed orders show up
  useEffect(() => {
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  const save = async (id: string) => {
    const raw = drafts[id];
    if (raw === undefined) return;
    const qty = parseInt(raw, 10);
    if (Number.isNaN(qty) || qty < 0) return;
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      await setItemStock(id, qty);
      setRows((rs) =>
        rs.map((r) =>
          r.id === id
            ? { ...r, productionStock: { availableQty: qty, updatedAt: new Date().toISOString() } }
            : r,
        ),
      );
      setDrafts((d) => { const n = { ...d }; delete n[id]; return n; });
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    rows.forEach(r => {
      if (r.category?.name) cats.add(r.category.name);
    });
    return Array.from(cats).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (selectedCategory) {
      result = result.filter(r => r.category?.name === selectedCategory);
    }
    const q = query.trim().toLowerCase();
    if (!q) return result;
    return result.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category?.name?.toLowerCase().includes(q),
    );
  }, [rows, query, selectedCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, StockRow[]>();
    for (const r of filtered) {
      const key = r.category?.name || 'Uncategorised';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const outOfStockCount = rows.filter((r) => (r.productionStock?.availableQty ?? 0) <= 0).length;
  const lowStockCount = rows.filter((r) => {
    const q = r.productionStock?.availableQty ?? 0;
    return q > 0 && q <= 5;
  }).length;

  const refillAll = async (qty: number) => {
    if (!confirm(`Are you sure you want to refill ALL items to ${qty}?`)) return;
    setLoading(true);
    setError('');
    try {
      await setBulkStock(qty);
      await load();
    } catch (e: any) {
      setError(e.message || 'Failed to refill bulk stock');
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight">
            <Package className="h-7 w-7 text-[var(--color-primary)]" /> Prep Stock
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Set how many portions you've prepped. Auto-decrements as orders come in — hits 0 and it shows as sold out to customers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {outOfStockCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-destructive)]/15 px-3 py-1.5 text-xs font-bold text-[var(--color-destructive)]">
              <AlertTriangle className="h-3.5 w-3.5" /> {outOfStockCount} sold out
            </span>
          )}
          {lowStockCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5" /> {lowStockCount} low
            </span>
          )}
          
          <div className="flex items-center bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] overflow-hidden">
            <span className="px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] bg-[var(--color-muted)]/50 border-r border-[var(--color-border)]">
              Refill All:
            </span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  refillAll(Number(e.target.value));
                  e.target.value = '';
                }
              }}
              className="bg-transparent px-3 py-2 text-sm font-bold outline-none cursor-pointer hover:bg-[var(--color-muted)] appearance-none"
              defaultValue=""
            >
              <option value="" disabled>Select</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <button
            onClick={load}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </header>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 max-w-2xl">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items or categories…"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] py-2 pl-10 pr-3 text-sm outline-none focus:border-[var(--color-primary)] text-[var(--color-foreground)]"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)] text-[var(--color-foreground)] sm:w-48 appearance-none"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--color-destructive)]/40 bg-[var(--color-destructive)]/10 px-4 py-2.5 text-sm text-[var(--color-destructive)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-[var(--color-muted-foreground)]">Loading stock…</div>
      ) : grouped.length === 0 ? (
        <div className="py-20 text-center text-[var(--color-muted-foreground)]">
          <Package className="mx-auto mb-3 h-16 w-16 opacity-10" />
          No items found.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-muted-foreground)]">
                {category}
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => {
                  const current = item.productionStock?.availableQty ?? 0;
                  const draft = drafts[item.id];
                  const displayed = draft !== undefined ? draft : String(current);
                  const dirty = draft !== undefined && draft !== String(current);
                  const state =
                    current <= 0 ? 'out' : current <= 5 ? 'low' : 'ok';
                  return (
                    <div
                      key={item.id}
                      className={`premium-card p-4 transition ${
                        state === 'out'
                          ? 'border-[var(--color-destructive)]/40'
                          : state === 'low'
                          ? 'border-amber-500/40'
                          : ''
                      }`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold">{item.name}</div>
                          <div className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                            {item.category?.name}
                          </div>
                        </div>
                        {state === 'out' && (
                          <span className="rounded-full bg-[var(--color-destructive)] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                            Sold out
                          </span>
                        )}
                        {state === 'low' && (
                          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                            Low
                          </span>
                        )}
                        {state === 'ok' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--color-success)]">
                            <CheckCircle2 className="h-3 w-3" /> Stocked
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center overflow-hidden rounded-lg border border-[var(--color-border)]">
                          <button
                            onClick={() => {
                              const n = Math.max(0, parseInt(displayed || '0', 10) - 1);
                              setDrafts((d) => ({ ...d, [item.id]: String(n) }));
                            }}
                            className="px-3 py-2 text-lg font-bold hover:bg-[var(--color-muted)]"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={0}
                            inputMode="numeric"
                            value={displayed}
                            onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') save(item.id); }}
                            className="w-16 border-x border-[var(--color-border)] bg-[var(--color-card)] py-2 text-center font-mono text-lg font-bold outline-none"
                          />
                          <button
                            onClick={() => {
                              const n = parseInt(displayed || '0', 10) + 1;
                              setDrafts((d) => ({ ...d, [item.id]: String(n) }));
                            }}
                            className="px-3 py-2 text-lg font-bold hover:bg-[var(--color-muted)]"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-1 gap-1">
                          {[10, 25, 50].map((n) => (
                            <button
                              key={n}
                              onClick={() => setDrafts((d) => ({ ...d, [item.id]: String(n) }))}
                              className="flex-1 rounded-md border border-[var(--color-border)] py-1.5 text-xs font-medium text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => save(item.id)}
                          disabled={!dirty || saving[item.id]}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                            dirty
                              ? 'bg-[var(--color-primary)] text-white hover:opacity-90'
                              : 'cursor-not-allowed bg-[var(--color-muted)] text-[var(--color-muted-foreground)]'
                          }`}
                        >
                          <Save className="h-3.5 w-3.5" />
                          {saving[item.id] ? '…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
