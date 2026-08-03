import { useCallback, useEffect, useState } from 'react';
import {
  Package, AlertTriangle, Plus, Loader2, Trash2, Edit3, RefreshCcw, Search,
} from 'lucide-react';
import {
  fetchInventory, fetchInventoryAlerts, createInventoryItem, updateInventoryItem, deleteInventoryItem,
} from '../api';
import type { InventoryItem } from '../api';
import { Card, CardHeader, CardTitle, CardContent, Button, Dialog, Input, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from 'ui-components';

export function InventoryPage() {
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
    if (!window.confirm('Delete this raw material?')) return;
    await deleteInventoryItem(id);
    load();
  };

  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">Raw materials & stock levels</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--color-muted-foreground)]" />
            <Input 
              value={search} 
              onChange={(e: any) => setSearch(e.target.value)} 
              placeholder="Search…"
              className="pl-9 h-9" 
            />
          </div>
          <Button onClick={load} variant="outline" size="icon">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
      </header>

      {alerts && (alerts.outOfStock.length > 0 || alerts.lowStock.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {alerts.outOfStock.length > 0 && (
            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-red-600 flex items-center gap-2 text-base">
                  <AlertTriangle className="w-4 h-4" /> Out of Stock ({alerts.outOfStock.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {alerts.outOfStock.slice(0, 8).map(i => (
                    <Badge key={i.id} variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-400">
                      {i.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {alerts.lowStock.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-600 flex items-center gap-2 text-base">
                  <AlertTriangle className="w-4 h-4" /> Low Stock ({alerts.lowStock.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {alerts.lowStock.slice(0, 8).map(i => (
                    <Badge key={i.id} variant="warning" className="bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-400">
                      {i.name} · {Number(i.quantity)}{i.unit}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <InventoryFormModal 
        open={showAdd || editing !== null} 
        item={editing} 
        onClose={() => { setShowAdd(false); setEditing(null); }} 
        onSaved={() => { setShowAdd(false); setEditing(null); load(); }} 
      />

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-16 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--color-muted-foreground)]" /></div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-[var(--color-muted-foreground)]">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No raw materials yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Low-stock threshold</TableHead>
                <TableHead>Supplier ref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(i => {
                const q = Number(i.quantity);
                const t = Number(i.lowStockThreshold);
                const isOut = q <= 0;
                const isLow = !isOut && q <= t;
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell className="font-mono">{q} <span className="text-[var(--color-muted-foreground)]">{i.unit}</span></TableCell>
                    <TableCell className="font-mono text-[var(--color-muted-foreground)]">{t} {i.unit}</TableCell>
                    <TableCell className="text-[var(--color-muted-foreground)]">{i.supplierReference || '—'}</TableCell>
                    <TableCell>
                      {isOut ? <Badge variant="destructive">OUT</Badge>
                        : isLow ? <Badge variant="warning">LOW</Badge>
                        : <Badge variant="success">OK</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(i)} title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(i.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function InventoryFormModal({ open, item, onClose, onSaved }: { open: boolean; item: InventoryItem | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [quantity, setQuantity] = useState('0');
  const [threshold, setThreshold] = useState('5');
  const [supplier, setSupplier] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(item?.name || '');
      setUnit(item?.unit || 'kg');
      setQuantity(String(item?.quantity ?? 0));
      setThreshold(String(item?.lowStockThreshold ?? 5));
      setSupplier(item?.supplierReference || '');
    }
  }, [open, item]);

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
    <Dialog open={open} onOpenChange={onClose} title={item ? 'Edit Raw Material' : 'Add Raw Material'}>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="col-span-2">
          <label className="text-xs font-medium mb-1.5 block">Name</label>
          <Input value={name} onChange={(e: any) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Unit</label>
          <Input value={unit} onChange={(e: any) => setUnit(e.target.value)} placeholder="kg / l / pcs" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Quantity</label>
          <Input value={quantity} onChange={(e: any) => setQuantity(e.target.value)} type="number" step="0.01" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Low-stock threshold</label>
          <Input value={threshold} onChange={(e: any) => setThreshold(e.target.value)} type="number" step="0.01" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Supplier ref</label>
          <Input value={supplier} onChange={(e: any) => setSupplier(e.target.value)} />
        </div>
        <div className="col-span-2 flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={save} disabled={saving || !name.trim()} isLoading={saving}>
            {item ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
