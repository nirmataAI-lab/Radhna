import { useState, useCallback, useEffect } from 'react';
import { Plus, Edit3, Trash2, Loader2, UtensilsCrossed, Eye, EyeOff, PackageX, PackageCheck } from 'lucide-react';
import {
  fetchCategories, createCategory, updateCategory, deleteCategory,
  fetchAllFoodItems, createFoodItem, updateFoodItem, deleteFoodItem
} from '../api';
import type { Category, FoodItem } from '../api';
import { AdminImageUpload } from '../components/AdminImageUpload';
import { Button, Dialog, Input } from 'ui-components';

export function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | null>(null);
  const [editCat, setEditCat] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [c, f] = await Promise.all([fetchCategories(), fetchAllFoodItems()]); setCategories(c); setFoodItems(f); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Delete this food item?')) return;
    await deleteFoodItem(id);
    load();
  };

  const handleToggleAvailability = async (item: FoodItem) => {
    setFoodItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isEnabled: !i.isEnabled } : i)));
    try { await updateFoodItem(item.id, { isEnabled: !item.isEnabled }); }
    catch (e: any) { alert(e.message); load(); }
  };

  const handleToggleOutOfStock = async (item: FoodItem) => {
    setFoodItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isOutOfStock: !i.isOutOfStock } : i)));
    try { await updateFoodItem(item.id, { isOutOfStock: !item.isOutOfStock }); }
    catch (e: any) { alert(e.message); load(); }
  };

  const handleDeleteCat = async (id: string) => {
    if (!window.confirm('Delete this category? Items must be removed first.')) return;
    try { await deleteCategory(id); load(); }
    catch (e: any) { alert(e.message); }
  };

  const filteredItems = selectedCatId
    ? foodItems.filter((i) => i.categoryId === selectedCatId)
    : foodItems;

  return (
    <div className="animate-fade-in p-2">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>Menu Management</h2>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--muted-foreground)' }}>Add, edit, and manage menu items</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowAddCat(true); setEditCat(null); }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all hover:opacity-90 shadow-sm"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
            <Plus className="w-4 h-4" /> Category
          </button>
          <button onClick={() => { setShowAddItem(true); setEditItem(null); }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-bold transition-all hover:opacity-90 shadow-sm text-white"
            style={{ background: 'var(--primary)' }}>
            <Plus className="w-4 h-4" /> Food Item
          </button>
        </div>
      </header>
      
      <CategoryFormModal 
        open={showAddCat || editCat !== null} 
        category={editCat} 
        onClose={() => { setShowAddCat(false); setEditCat(null); }}
        onSaved={() => { setShowAddCat(false); setEditCat(null); load(); }} 
      />
      
      <FoodItemFormModal 
        open={showAddItem || editItem !== null} 
        item={editItem} 
        categories={categories} 
        onClose={() => { setShowAddItem(false); setEditItem(null); }}
        onSaved={() => { setShowAddItem(false); setEditItem(null); load(); }} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-1 h-fit card-premium">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <h3 className="font-bold text-lg" style={{ color: 'var(--foreground)' }}>Categories</h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
              {categories.length}
            </span>
          </div>
          <div className="p-3">
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setSelectedCatId(null)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                  selectedCatId === null
                    ? 'font-bold'
                    : 'font-medium hover:bg-[var(--muted)]'
                }`}
                style={{
                  background: selectedCatId === null ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
                  color: selectedCatId === null ? 'var(--primary)' : 'var(--muted-foreground)'
                }}
              >
                <span>All Categories</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: selectedCatId === null ? 'white' : 'var(--muted)' }}>
                  {foodItems.length}
                </span>
              </button>
              {categories.map((cat) => {
                const count = foodItems.filter((i) => i.categoryId === cat.id).length;
                const isSelected = selectedCatId === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCatId(cat.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${
                      isSelected ? 'font-bold' : 'font-medium hover:bg-[var(--muted)]'
                    }`}
                    style={{
                      background: isSelected ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--foreground)'
                    }}
                  >
                    <span className="text-sm truncate flex-1">{cat.name}</span>
                    <span className="text-xs font-bold mr-2 opacity-60">({count})</span>
                    <div className="hidden group-hover:flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditCat(cat); }}
                        className="p-1.5 rounded-lg transition-colors hover:bg-white/50 text-blue-500 hover:text-blue-600"
                        title="Edit Category"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCat(cat.id); }}
                        className="p-1.5 rounded-lg transition-colors hover:bg-white/50 text-red-500 hover:text-red-600"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {categories.length === 0 && <p className="text-sm text-center py-4 opacity-50" style={{ color: 'var(--foreground)' }}>No categories.</p>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          {loading ? (
            <div className="text-center py-24 flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: 'var(--primary)' }} />
              <p className="font-semibold" style={{ color: 'var(--muted-foreground)' }}>Loading items...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className={`card-premium flex flex-col overflow-hidden transition-all hover:-translate-y-1 ${!item.isEnabled ? 'opacity-60 grayscale-[30%]' : ''}`}>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-lg leading-tight truncate" style={{ color: 'var(--foreground)' }}>{item.name}</h4>
                        <p className="text-xs font-semibold mt-1" style={{ color: 'var(--muted-foreground)' }}>{item.category?.name}</p>
                      </div>
                      <span className="font-black text-lg shrink-0" style={{ color: 'var(--primary)' }}>₹{Number(item.price).toFixed(2)}</span>
                    </div>
                    {item.description && <p className="text-sm line-clamp-2 my-2 flex-1 font-medium" style={{ color: 'var(--muted-foreground)' }}>{item.description}</p>}
                    
                    <div className="flex flex-wrap gap-1.5 mb-5 mt-auto pt-3">
                      {item.isVeg ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Veg</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Non-Veg</span>
                      )}
                      {item.isPopular && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Popular</span>}
                      {item.isTodaysSpecial && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Special</span>}
                      {!item.isEnabled && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border border-dashed border-gray-300 text-gray-500">Unavailable</span>}
                      {item.isOutOfStock && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-red-800 text-white">Out of Stock</span>}
                      {item.productionStock && <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700">Stock: {item.productionStock.availableQty}</span>}
                    </div>

                    <div className="flex gap-2 mt-auto pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                      <button 
                        className={`flex items-center justify-center p-2 rounded-lg transition-colors shadow-sm ${
                          !item.isEnabled 
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                            : 'bg-[var(--muted)] text-[var(--foreground)] hover:brightness-95'
                        }`}
                        onClick={() => handleToggleAvailability(item)}
                        title={item.isEnabled ? 'Mark unavailable' : 'Mark available'}
                      >
                        {item.isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button 
                        className={`flex items-center justify-center p-2 rounded-lg transition-colors shadow-sm ${
                          item.isOutOfStock 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-[var(--muted)] text-[var(--foreground)] hover:brightness-95'
                        }`}
                        onClick={() => handleToggleOutOfStock(item)}
                        title={item.isOutOfStock ? 'Mark in stock' : 'Mark out of stock'}
                      >
                        {item.isOutOfStock ? <PackageX className="w-4 h-4" /> : <PackageCheck className="w-4 h-4" />}
                      </button>
                      <button 
                        className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg font-bold text-sm transition-colors shadow-sm bg-[var(--muted)] hover:brightness-95"
                        style={{ color: 'var(--foreground)' }}
                        onClick={() => setEditItem(item)}
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button 
                        className="flex items-center justify-center p-2 rounded-lg transition-colors shadow-sm bg-red-50 text-red-600 hover:bg-red-100"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {foodItems.length === 0 && (
                <div className="col-span-full card-premium p-16 flex flex-col items-center text-center border-dashed border-2">
                  <div className="w-20 h-20 rounded-full grid place-items-center mb-5 opacity-40"
                    style={{ background: 'var(--muted)' }}>
                    <UtensilsCrossed className="w-10 h-10" style={{ color: 'var(--muted-foreground)' }} />
                  </div>
                  <p className="text-xl font-bold mb-1" style={{ color: 'var(--foreground)' }}>No menu items yet.</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Add your first item to get started!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryFormModal({ open, category, onClose, onSaved }: { open: boolean, category: Category | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [order, setOrder] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(category?.name || '');
      setOrder(category?.displayOrder?.toString() || '0');
    }
  }, [open, category]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (category) await updateCategory(category.id, { name: name.trim(), displayOrder: parseInt(order) || 0 });
      else await createCategory({ name: name.trim(), displayOrder: parseInt(order) || 0 });
      onSaved();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} title={category ? 'Edit Category' : 'Add Category'}>
      <div className="flex flex-col gap-4 mt-2">
        <div>
          <label className="text-xs font-medium mb-1.5 block">Category Name</label>
          <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="e.g. Starters" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Display Order</label>
          <Input value={order} onChange={(e: any) => setOrder(e.target.value)} placeholder="0" type="number" />
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving || !name.trim()} isLoading={saving}>
            {category ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function FoodItemFormModal({ open, item, categories, onClose, onSaved }: {
  open: boolean; item: FoodItem | null; categories: Category[]; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState('0');
  const [isVeg, setIsVeg] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isOutOfStock, setIsOutOfStock] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(item?.name || '');
      setPrice(item?.price?.toString() || '');
      setDescription(item?.description || '');
      setCategoryId(item?.categoryId || categories[0]?.id || '');
      setImageUrl(item?.imageUrl || '');
      setStock(item?.productionStock?.availableQty?.toString() || '0');
      setIsVeg(item?.isVeg ?? true);
      setIsPopular(item?.isPopular ?? false);
      setIsSpecial(item?.isTodaysSpecial ?? false);
      setIsEnabled(item?.isEnabled ?? true);
      setIsOutOfStock(item?.isOutOfStock ?? false);
    }
  }, [open, item, categories]);

  const handleSave = async () => {
    if (!name.trim() || !price || !categoryId) return;
    setSaving(true);
    try {
      const data = { name: name.trim(), price: parseFloat(price), categoryId, description: description || undefined, imageUrl: imageUrl || undefined, isVeg, isPopular, isTodaysSpecial: isSpecial, isEnabled, isOutOfStock, stock: parseInt(stock) || 0 };
      if (item) await updateFoodItem(item.id, data); else await createFoodItem(data);
      onSaved();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} title={item ? 'Edit Food Item' : 'Add Food Item'}>
      <div className="grid grid-cols-2 gap-4 mt-2 max-h-[70vh] overflow-y-auto px-1">
        <div className="col-span-2">
          <label className="text-xs font-medium mb-1.5 block">Name *</label>
          <Input value={name} onChange={(e: any) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Price *</label>
          <Input value={price} onChange={(e: any) => setPrice(e.target.value)} type="number" step="0.01" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Category *</label>
          <select 
            value={categoryId} 
            onChange={(e: any) => setCategoryId(e.target.value)} 
            className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium mb-1.5 block">Description</label>
          <textarea 
            value={description} 
            onChange={(e: any) => setDescription(e.target.value)} 
            rows={2} 
            className="flex w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]" 
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium mb-1.5 block">Image</label>
          <AdminImageUpload value={imageUrl} onChange={setImageUrl} />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium mb-1.5 block">Initial Stock</label>
          <Input value={stock} onChange={(e: any) => setStock(e.target.value)} type="number" />
        </div>
        <div className="col-span-2 flex flex-col gap-2.5 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/30">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={isVeg} onChange={(e: any) => setIsVeg(e.target.checked)} className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" /> Veg / Vegetarian</label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={isPopular} onChange={(e: any) => setIsPopular(e.target.checked)} className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" /> Popular Item</label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={isSpecial} onChange={(e: any) => setIsSpecial(e.target.checked)} className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" /> Today's Special</label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={isEnabled} onChange={(e: any) => setIsEnabled(e.target.checked)} className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" /> Available to customers</label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={isOutOfStock} onChange={(e: any) => setIsOutOfStock(e.target.checked)} className="rounded border-gray-300 text-red-600 focus:ring-red-600" /> Out of Stock</label>
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" onClick={handleSave} disabled={saving || !name.trim() || !price || !categoryId} isLoading={saving}>
          {item ? 'Update' : 'Create'}
        </Button>
      </div>
    </Dialog>
  );
}
