import { useState, useCallback, useEffect } from 'react';
import { Plus, Loader2, Tag, Percent, Calendar, Trash2 } from 'lucide-react';
import { fetchCoupons, createCoupon, deleteCoupon } from '../api';
import type { Coupon } from '../api';
import { Card, CardContent, Button, Dialog, Input, Badge } from 'ui-components';

export function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCoupons(await fetchCoupons()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    await deleteCoupon(id);
    load();
  };

  const now = new Date();

  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Coupons Management</h2>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">Create and manage discount coupons</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Coupon
        </Button>
      </header>

      <CouponFormModal open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />

      {loading ? (
        <div className="text-center py-16"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--color-muted-foreground)]" /></div>
      ) : coupons.length === 0 ? (
        <Card className="text-center py-20 bg-transparent border-dashed">
          <Tag className="w-12 h-12 mx-auto mb-4 opacity-30 text-[var(--color-muted-foreground)]" />
          <p className="text-lg font-medium">No coupons created yet</p>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Create your first coupon to offer discounts!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => {
            const validFrom = new Date(coupon.validFrom);
            const validTo = new Date(coupon.validTo);
            const isActive = now >= validFrom && now <= validTo;
            const isExpired = now > validTo;
            const usageLeft = coupon.usageLimit ? coupon.usageLimit - coupon.usageCount : null;

            return (
              <Card key={coupon.id} className={`flex flex-col transition-all hover:shadow-md ${isExpired ? 'opacity-60 grayscale-[20%]' : ''}`}>
                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-[var(--color-primary)]/10 p-2 rounded-lg text-[var(--color-primary)]">
                        <Percent className="w-5 h-5" />
                      </div>
                      <span className="font-bold tracking-wider text-xl uppercase">{coupon.code}</span>
                    </div>
                    <Badge variant={isActive ? 'success' : isExpired ? 'destructive' : 'secondary'}>
                      {isActive ? 'Active' : isExpired ? 'Expired' : 'Scheduled'}
                    </Badge>
                  </div>

                  <div className="text-3xl font-bold mb-4 tracking-tight">
                    {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}%` : `₹${Number(coupon.value).toFixed(2)}`}
                    <span className="text-sm font-medium text-[var(--color-muted-foreground)] ml-1">
                      OFF
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 text-xs font-medium text-[var(--color-muted-foreground)] mb-6 bg-[var(--color-muted)]/30 p-3 rounded-lg flex-1">
                    <div className="flex items-center gap-1.5 text-[var(--color-foreground)]">
                      <Calendar className="w-3.5 h-3.5" />
                      {validFrom.toLocaleDateString()} <span className="opacity-50 mx-0.5">→</span> {validTo.toLocaleDateString()}
                    </div>
                    <div className="mt-1">
                      Used: <span className="text-[var(--color-foreground)]">{coupon.usageCount}</span> {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' (unlimited)'}
                    </div>
                    {usageLeft !== null && usageLeft > 0 && (
                      <span className="text-green-600 dark:text-green-400 mt-0.5">{usageLeft} uses left</span>
                    )}
                    {usageLeft !== null && usageLeft <= 0 && (
                      <span className="text-red-500 dark:text-red-400 mt-0.5">Fully redeemed</span>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
                    onClick={() => handleDelete(coupon.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Coupon
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CouponFormModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FLAT'>('PERCENTAGE');
  const [value, setValue] = useState('10');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [usageLimit, setUsageLimit] = useState('100');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCode('');
      setDiscountType('PERCENTAGE');
      setValue('10');
      setValidFrom(new Date().toISOString().split('T')[0]);
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      setValidTo(d.toISOString().split('T')[0]);
      setUsageLimit('100');
    }
  }, [open]);

  const handleSave = async () => {
    if (!code.trim() || !value || !validFrom || !validTo) return;
    setSaving(true);
    try {
      await createCoupon({
        code: code.trim(),
        discountType,
        value: parseFloat(value),
        validFrom: new Date(validFrom).toISOString(),
        validTo: new Date(validTo).toISOString(),
        usageLimit: parseInt(usageLimit) || undefined,
      });
      onSaved();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose} title="Create Coupon" description="Add a new discount code for your customers.">
      <div className="flex flex-col gap-4 mt-4">
        <div>
          <label className="text-xs font-medium mb-1.5 block">Coupon Code *</label>
          <Input 
            value={code} 
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SAVE20" 
            className="uppercase tracking-widest font-mono"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Type *</label>
            <select 
              value={discountType} 
              onChange={(e) => setDiscountType(e.target.value as any)}
              className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FLAT">Flat (₹)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Value *</label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} type="number" step="0.01" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Valid From *</label>
            <Input value={validFrom} onChange={(e) => setValidFrom(e.target.value)} type="date" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Valid To *</label>
            <Input value={validTo} onChange={(e) => setValidTo(e.target.value)} type="date" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">Usage Limit (leave empty for unlimited)</label>
          <Input value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} type="number" placeholder="Unlimited" />
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving || !code.trim() || !value || !validFrom || !validTo} isLoading={saving}>
            Create
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
