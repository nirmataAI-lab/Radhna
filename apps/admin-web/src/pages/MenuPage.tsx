import { useState, useCallback, useEffect } from 'react';
import { Plus, Edit3, Trash2, Loader2, UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import {
  fetchCategories, createCategory, updateCategory, deleteCategory,
  fetchAllFoodItems, createFoodItem, updateFoodItem, deleteFoodItem
} from '../api';
import type { Category, FoodItem } from '../api';
import { AdminImageUpload } from '../components/AdminImageUpload';
import { Card, CardHeader, CardTitle, CardContent, Button, Dialog, Input, Badge } from 'ui-components';

export function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
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

  const handleDeleteCat = async (id: string) => {
    if (!window.confirm('Delete this category? Items must be removed first.')) return;
    try { await deleteCategory(id); load(); }
    catch (e: any) { alert(e.message); }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Menu Management</h2>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">Add, edit, and manage menu items</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setShowAddCat(true); setEditCat(null); }}>
            <Plus className="w-4 h-4 mr-2" /> Category
          </Button>
          <Button onClick={() => { setShowAddItem(true); setEditItem(null); }}>
            <Plus className="w-4 h-4 mr-2" /> Food Item
          </Button>
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
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-3 border-b border-[var(--color-border)]">
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent className="pt-3 px-2 pb-2">
            <div className="flex flex-col gap-1">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--color-muted)] group">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <div className="hidden group-hover:flex gap-1">
                    <button onClick={() => setEditCat(cat)} className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteCat(cat.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-[var(--color-muted-foreground)] px-3">No categories.</p>}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-4">
          {loading ? (
            <div className="text-center py-16 text-[var(--color-muted-foreground)]">
              <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
              Loading items...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {foodItems.map((item) => (
                <Card key={item.id} className={`flex flex-col overflow-hidden transition-all hover:shadow-md ${!item.isEnabled ? 'opacity-60 grayscale-[30%]' : ''}`}>
                  {item.imageUrl && (
                    <div className="aspect-video bg-[var(--color-muted)]">
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{item.category?.name}</p>
                      </div>
                      <span className="font-bold text-[var(--color-primary)]">₹{Number(item.price).toFixed(2)}</span>
                    </div>
                    {item.description && <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2 mb-3 flex-1">{item.description}</p>}
                    <div className="flex flex-wrap gap-1.5 mb-4 mt-auto pt-2">
                      {item.isVeg ? (
                        <Badge variant="success" className="px-1.5 py-0">Veg</Badge>
                      ) : (
                        <Badge variant="destructive" className="px-1.5 py-0 bg-red-600">Non-Veg</Badge>
                      )}
                      {item.isPopular && <Badge variant="warning" className="px-1.5 py-0 bg-orange-500">Popular</Badge>}
                      {item.isTodaysSpecial && <Badge variant="secondary" className="px-1.5 py-0 bg-purple-100 text-purple-700">Special</Badge>}
                      {!item.isEnabled && <Badge variant="outline" className="px-1.5 py-0 border-dashed">Unavailable</Badge>}
                      {item.productionStock && <Badge variant="secondary" className="px-1.5 py-0 bg-blue-50 text-blue-700">Stock: {item.productionStock.availableQty}</Badge>}
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className={`px-3 ${!item.isEnabled ? 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100' : ''}`}
                        onClick={() => handleToggleAvailability(item)}
                        title={item.isEnabled ? 'Mark unavailable' : 'Mark available'}
                      >
                        {item.isEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditItem(item)}>
                        <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit
                      </Button>
                      <Button size="sm" variant="danger" className="px-3" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {foodItems.length === 0 && (
                <div className="col-span-full text-center py-20 text-[var(--color-muted-foreground)] bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] border-dashed">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No menu items yet.</p>
                  <p className="text-sm mt-1">Add your first item to get started!</p>
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
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Starters" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Display Order</label>
          <Input value={order} onChange={(e) => setOrder(e.target.value)} placeholder="0" type="number" />
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
    }
  }, [open, item, categories]);

  const handleSave = async () => {
    if (!name.trim() || !price || !categoryId) return;
    setSaving(true);
    try {
      const data = { name: name.trim(), price: parseFloat(price), categoryId, description: description || undefined, imageUrl: imageUrl || undefined, isVeg, isPopular, isTodaysSpecial: isSpecial, isEnabled, stock: parseInt(stock) || 0 };
      if (item) await updateFoodItem(item.id, data); else await createFoodItem(data);
      onSaved();
    } catch (e: any) { alert(e.message); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} title={item ? 'Edit Food Item' : 'Add Food Item'}>
      <div className="grid grid-cols-2 gap-4 mt-2 max-h-[70vh] overflow-y-auto px-1">
        <div className="col-span-2">
          <label className="text-xs font-medium mb-1.5 block">Name *</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Price *</label>
          <Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Category *</label>
          <select 
            value={categoryId} 
            onChange={(e) => setCategoryId(e.target.value)} 
            className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium mb-1.5 block">Description</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
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
          <Input value={stock} onChange={(e) => setStock(e.target.value)} type="number" />
        </div>
        <div className="col-span-2 flex flex-col gap-2.5 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)]/30">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={isVeg} onChange={(e) => setIsVeg(e.target.checked)} className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" /> Veg / Vegetarian</label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" /> Popular Item</label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={isSpecial} onChange={(e) => setIsSpecial(e.target.checked)} className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" /> Today's Special</label>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" /> Available to customers</label>
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
