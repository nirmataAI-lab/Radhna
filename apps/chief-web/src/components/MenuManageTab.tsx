import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Plus, Edit3, Trash2, UtensilsCrossed, Upload, Eye, EyeOff } from 'lucide-react';
import {
  fetchCategories, createCategory, updateCategory, deleteCategory,
  fetchAllFoodItems, createFoodItem, updateFoodItem, deleteFoodItem,
  type Category, type FoodItem,
} from '../menuApi';


export function MenuManageTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, i] = await Promise.all([fetchCategories(), fetchAllFoodItems()]);
      setCategories(c);
      setItems(i);
    } catch (e: any) {
      setError(e?.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this menu item? This cannot be undone.')) return;
    try { await deleteFoodItem(id); load(); } catch (e: any) { alert(e.message); }
  };
  const handleDeleteCat = async (id: string) => {
    if (!confirm('Delete this category? All items must be moved or removed first.')) return;
    try { await deleteCategory(id); load(); } catch (e: any) { alert(e.message); }
  };
  const handleToggleAvailability = async (item: FoodItem) => {
    // optimistic
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isEnabled: !i.isEnabled } : i)));
    try {
      await updateFoodItem(item.id, { isEnabled: !item.isEnabled });
    } catch (e: any) {
      alert(e.message);
      load();
    }
  };


  const visible = filterCat === 'all' ? items : items.filter((i) => i.categoryId === filterCat);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--color-muted-foreground)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 px-4 py-3 text-sm text-[var(--color-destructive)]">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">Category</label>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          >
            <option value="all">All ({items.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => { setEditCat(null); setShowCatModal(true); }}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold hover:bg-[var(--color-muted)]"
          >
            <Plus className="h-4 w-4" /> Category
          </button>
          <button
            onClick={() => { setEditItem(null); setShowItemModal(true); }}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New Menu Item
          </button>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Categories rail */}
        <div className="premium-card h-fit p-4 lg:col-span-1">
          <h3 className="mb-3 border-b border-[var(--color-border)] pb-2 text-sm font-bold uppercase tracking-wider text-[var(--color-muted-foreground)]">
            Categories
          </h3>
          {categories.length === 0 && (
            <p className="py-4 text-center text-xs text-[var(--color-muted-foreground)]">No categories yet.</p>
          )}
          <div className="flex flex-col gap-1">
            {categories.map((cat) => (
              <div key={cat.id} className="group flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-[var(--color-muted)]">
                <span className="font-medium">{cat.name}</span>
                <div className="hidden gap-1 group-hover:flex">
                  <button onClick={() => { setEditCat(cat); setShowCatModal(true); }} className="rounded p-1 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDeleteCat(cat.id)} className="rounded p-1 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items grid */}
        <div className="lg:col-span-4">
          {visible.length === 0 ? (
            <div className="premium-card flex flex-col items-center justify-center py-16 text-[var(--color-muted-foreground)]">
              <UtensilsCrossed className="mb-3 h-12 w-12 opacity-20" />
              <p className="font-medium">No items in this view</p>
              <p className="text-xs">Add your first menu item to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((item) => (
                <div key={item.id} className={`premium-card p-4 ${!item.isEnabled ? 'opacity-60' : ''}`}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate font-semibold">{item.name}</h4>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{item.category?.name}</p>
                    </div>
                    <span className="font-mono font-bold text-[var(--color-primary)]">₹{Number(item.price).toFixed(0)}</span>
                  </div>
                  {item.description && (
                    <p className="mb-2 line-clamp-2 text-xs text-[var(--color-muted-foreground)]">{item.description}</p>
                  )}
                  <div className="mb-3 flex flex-wrap gap-1">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${item.isVeg ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-red-500/15 text-red-700 dark:text-red-400'}`}>
                      {item.isVeg ? 'Veg' : 'Non-Veg'}
                    </span>
                    {item.isPopular && <span className="rounded bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:text-orange-400">Popular</span>}
                    {item.isTodaysSpecial && <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:text-purple-400">Special</span>}
                    {!item.isEnabled && <span className="rounded bg-gray-500/15 px-1.5 py-0.5 text-[10px] font-semibold">Unavailable</span>}
                    {item.productionStock && (
                      <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-400">
                        Stock: {item.productionStock.availableQty}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      title={item.isEnabled ? 'Mark unavailable' : 'Mark available'}
                      className={`flex items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${item.isEnabled ? 'border-[var(--color-border)] hover:bg-[var(--color-muted)]' : 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20'}`}
                    >
                      {item.isEnabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => { setEditItem(item); setShowItemModal(true); }}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--color-muted)]"
                    >
                      <Edit3 className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="rounded-lg border border-[var(--color-destructive)]/30 px-3 py-1.5 text-xs font-semibold text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>
      </div>

      {showCatModal && (
        <CategoryModal
          category={editCat}
          onClose={() => { setShowCatModal(false); setEditCat(null); }}
          onSaved={() => { setShowCatModal(false); setEditCat(null); load(); }}
        />
      )}
      {showItemModal && (
        <FoodItemModal
          item={editItem}
          categories={categories}
          onClose={() => { setShowItemModal(false); setEditItem(null); }}
          onSaved={() => { setShowItemModal(false); setEditItem(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Modals ────────────────────────────────────────

function CategoryModal({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(category?.name || '');
  const [order, setOrder] = useState(String(category?.displayOrder ?? 0));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (category) await updateCategory(category.id, { name: name.trim(), displayOrder: parseInt(order) || 0 });
      else await createCategory({ name: name.trim(), displayOrder: parseInt(order) || 0 });
      onSaved();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };

  return (
    <ModalShell title={category ? 'Edit Category' : 'Add Category'} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus />
        </Field>
        <Field label="Display order">
          <input value={order} onChange={(e) => setOrder(e.target.value)} type="number" className={inputClass} />
        </Field>
        <ModalActions onCancel={onClose} onSave={save} saving={saving} disabled={!name.trim()} label={category ? 'Update' : 'Create'} />
      </div>
    </ModalShell>
  );
}

function FoodItemModal({ item, categories, onClose, onSaved }: {
  item: FoodItem | null; categories: Category[]; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [price, setPrice] = useState(item?.price ? String(item.price) : '');
  const [description, setDescription] = useState(item?.description || '');
  const [categoryId, setCategoryId] = useState(item?.categoryId || categories[0]?.id || '');
  const [stock, setStock] = useState(String(item?.productionStock?.availableQty ?? 0));
  const [isVeg, setIsVeg] = useState(item?.isVeg ?? true);
  const [isPopular, setIsPopular] = useState(item?.isPopular ?? false);
  const [isSpecial, setIsSpecial] = useState(item?.isTodaysSpecial ?? false);
  const [isEnabled, setIsEnabled] = useState(item?.isEnabled ?? true);
  const [saving, setSaving] = useState(false);

  const canSave = name.trim() && price && categoryId;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        price: parseFloat(price),
        categoryId,
        description: description || undefined,
        isVeg, isPopular, isTodaysSpecial: isSpecial, isEnabled,
        stock: parseInt(stock) || 0,
      };
      if (item) await updateFoodItem(item.id, data);
      else await createFoodItem(data);
      onSaved();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };

  return (
    <ModalShell title={item ? 'Edit Menu Item' : 'Add Menu Item'} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Field label="Name *"><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus /></Field></div>
        <Field label="Price *"><input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" className={inputClass} /></Field>
        <Field label="Category *">
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            {categories.length === 0 && <option value="">— Add a category first —</option>}
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <div className="col-span-2"><Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} /></Field></div>
        <Field label="Today's stock"><input value={stock} onChange={(e) => setStock(e.target.value)} type="number" className={inputClass} /></Field>
        <div className="flex flex-col justify-end gap-2 pb-1 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={isVeg} onChange={(e) => setIsVeg(e.target.checked)} /> Veg</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} /> Popular</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={isSpecial} onChange={(e) => setIsSpecial(e.target.checked)} /> Today's Special</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} /> Available to customers</label>
        </div>

      </div>
      <ModalActions onCancel={onClose} onSave={save} saving={saving} disabled={!canSave} label={item ? 'Update' : 'Create'} />
    </ModalShell>
  );
}

// ─── Modal primitives ──────────────────────────────

const inputClass = 'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">{label}</span>
      {children}
    </label>
  );
}

function ModalShell({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className={`w-full rounded-2xl bg-[var(--color-card)] p-6 shadow-2xl ${wide ? 'max-w-xl' : 'max-w-sm'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onSave, saving, disabled, label }: { onCancel: () => void; onSave: () => void; saving: boolean; disabled: boolean; label: string }) {
  return (
    <div className="mt-5 flex gap-2">
      <button onClick={onCancel} className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold hover:bg-[var(--color-muted)]">Cancel</button>
      <button
        onClick={onSave}
        disabled={saving || disabled}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {label}
      </button>
    </div>
  );
}


