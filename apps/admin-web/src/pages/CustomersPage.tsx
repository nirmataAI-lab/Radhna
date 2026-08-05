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
          <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-400" /> Customers
          </h1>
          <p className="text-slate-400 text-sm mt-1">View customer profiles and their entire order history</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {customers.map((c) => (
          <div key={c.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden transition-all hover:border-slate-600/50">
            <div 
              className="p-5 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
            >
              <div>
                <h3 className="font-bold text-slate-100">{c.name || 'Anonymous User'}</h3>
                <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                  <span>{c.email}</span>
                  {c.phone && <><span className="w-1 h-1 bg-slate-600 rounded-full" /> <span>{c.phone}</span></>}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm font-semibold text-emerald-400">{c.orders.length} Orders</div>
                  <div className="text-xs text-slate-500">₹{c.orders.reduce((sum, o) => sum + Number(o.total), 0).toFixed(2)} Total Spent</div>
                </div>
                <button className="text-slate-400 hover:text-slate-200 transition-colors">
                  {expandedId === c.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {expandedId === c.id && (
              <div className="border-t border-slate-700/50 bg-slate-900/30 p-5">
                <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Order History
                </h4>
                {c.orders.length === 0 ? (
                  <p className="text-slate-500 text-sm">No orders placed yet.</p>
                ) : (
                  <div className="space-y-3">
                    {c.orders.map(order => (
                      <div key={order.id} className="bg-slate-800/80 rounded-lg p-3 flex justify-between items-center text-sm">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-200">₹{Number(order.total).toFixed(2)}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
                              {order.status}
                            </span>
                          </div>
                          <div className="text-slate-400 text-xs truncate max-w-md">
                            {order.orderItems.map(oi => `${oi.quantity}x ${oi.foodItem?.name}`).join(', ')}
                          </div>
                        </div>
                        <div className="text-slate-500 text-xs flex items-center gap-1">
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
          <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
            <Users className="w-12 h-12 mx-auto text-slate-500 mb-3" />
            <p className="text-slate-400">No customers found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
