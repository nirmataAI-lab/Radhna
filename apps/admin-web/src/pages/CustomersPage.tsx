import { useEffect, useState } from 'react';
import { Users, Package, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../authStore';
import { fetchCustomers } from '../api';

interface Customer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  orders: {
    id: string;
    total: number;
    status: string;
    createdAt: string;
    orderItems: {
      foodItem: { name: string } | null;
      quantity: number;
    }[];
  }[];
}

export function CustomersPage() {
  const { token } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchCustomers()
      .then(setCustomers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3" style={{ color: 'var(--color-foreground)' }}>
            <Users className="w-8 h-8 text-emerald-400" /> Customers
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>View customer profiles and their entire order history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {customers.map((c) => (
          <div key={c.id} className="rounded-2xl overflow-hidden transition-all" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
            <div 
              className="p-5 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
            >
              <div>
                <h3 className="font-bold" style={{ color: 'var(--color-foreground)' }}>{c.name || 'Anonymous User'}</h3>
                <p className="text-sm flex items-center gap-2 mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                  <span>{c.email}</span>
                  {c.phone && <><span className="w-1 h-1 rounded-full" style={{ background: 'var(--color-muted-foreground)' }} /> <span>{c.phone}</span></>}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm font-semibold text-emerald-400">{c.orders.length} Orders</div>
                  <div className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>₹{c.orders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)} Total Spent</div>
                </div>
                <button className="transition-colors hover:opacity-80" style={{ color: 'var(--color-muted-foreground)' }}>
                  {expandedId === c.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {expandedId === c.id && (
              <div className="p-5 border-t" style={{ borderTopColor: 'var(--color-border)', background: 'var(--color-muted)' }}>
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-foreground)' }}>
                  <Package className="w-4 h-4" /> Order History
                </h4>
                {c.orders.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No orders placed yet.</p>
                ) : (
                  <div className="space-y-3">
                    {c.orders.map(order => (
                      <div key={order.id} className="rounded-lg p-3 flex justify-between items-center text-sm" style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold" style={{ color: 'var(--color-foreground)' }}>₹{Number(order.total).toFixed(2)}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--color-muted)', color: 'var(--color-foreground)' }}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-xs truncate max-w-md" style={{ color: 'var(--color-muted-foreground)' }}>
                            {order.orderItems.map(oi => `${oi.quantity}x ${oi.foodItem?.name}`).join(', ')}
                          </div>
                        </div>
                        <div className="text-xs flex items-center gap-1" style={{ color: 'var(--color-muted-foreground)' }}>
                          <Clock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {customers.length === 0 && (
          <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-muted-foreground)' }} />
            <p style={{ color: 'var(--color-muted-foreground)' }}>No customers found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
