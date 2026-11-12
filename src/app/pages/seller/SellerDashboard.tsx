// src/app/pages/seller/SellerDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { TrendingUp, ShoppingBag, Package, AlertTriangle, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Layout } from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F' };

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB' },
  processing: { label: 'Processing', color: C.teal, bg: '#E8F8F6' },
  shipped: { label: 'Shipped', color: '#3B82F6', bg: '#EFF6FF' },
  delivered: { label: 'Delivered', color: '#10B981', bg: '#ECFDF5' },
};

interface FabricOrder {
  id: string;
  fabricName?: string;
  customerName?: string;
  quantity?: number;
  total?: number;
  status?: string;
  createdAt?: Timestamp;
}

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  status: string;
}

const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

export default function SellerDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [orders, setOrders] = useState<FabricOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) return;
    const fetchSellerData = async () => {
      try {
        const [ordersSnap, inventorySnap] = await Promise.all([
          getDocs(query(collection(db, 'fabricOrders'), where('sellerId', '==', currentUser.uid))),
          getDocs(query(collection(db, 'inventory'), where('sellerId', '==', currentUser.uid))),
        ]);
        setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as FabricOrder)));
        setInventory(inventorySnap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem)));
      } catch (e) {
        console.error('Error fetching seller data:', e);
        setError('Could not load your dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchSellerData();
  }, [currentUser]);

  const sorted = [...orders].sort(
    (a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
  );
  const totalSales = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const lowStock = inventory.filter(i => i.status === 'low_stock').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // Last six months of real order revenue.
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return { month: d.toLocaleString('en', { month: 'short' }), key: monthKey(d), sales: 0 };
  });
  orders.forEach(o => {
    const date = o.createdAt?.toDate?.();
    if (!date) return;
    const bucket = monthly.find(m => m.key === monthKey(date));
    if (bucket) bucket.sales += Number(o.total) || 0;
  });
  const thisMonth = monthly[5]?.sales || 0;
  const lastMonth = monthly[4]?.sales || 0;
  const growth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="max-w-2xl mx-auto md:max-w-4xl px-4 md:px-8 py-5">
        <div className="mb-5">
          <p className="text-sm text-gray-500">Good day,</p>
          <h2 className="text-xl" style={{ color: C.dark }}>Welcome, {currentUser?.name?.split(' ')[0]}!</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3.5 mb-5 text-xs text-red-600">{error}</div>
        )}

        {(lowStock > 0 || pendingOrders > 0) && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-5">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              {lowStock > 0 && `${lowStock} item(s) low in stock. `}
              {pendingOrders > 0 && `${pendingOrders} order(s) awaiting confirmation.`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Revenue', value: `₱${totalSales.toLocaleString()}`, icon: <TrendingUp size={18} />, color: C.primary, bg: '#FDF5F2' },
            { label: 'Orders', value: orders.length, icon: <ShoppingBag size={18} />, color: C.teal, bg: '#E8F8F6' },
            { label: 'Products', value: inventory.length, icon: <Package size={18} />, color: C.dark, bg: '#F5F0E8' },
            { label: 'Low Stock', value: lowStock, icon: <AlertTriangle size={18} />, color: '#F59E0B', bg: '#FFFBEB' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <p className="text-xl" style={{ color: C.dark }}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ color: C.dark }}>Revenue Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months · ₱{totalSales.toLocaleString()} total</p>
            </div>
            {growth !== null && (
              <div
                className="px-2 py-1 rounded-lg text-xs flex items-center gap-1"
                style={{ background: growth >= 0 ? '#ECFDF5' : '#FEF2F2', color: growth >= 0 ? '#10B981' : '#EF4444' }}
              >
                <TrendingUp size={11} /> {growth >= 0 ? '+' : ''}{growth}%
              </div>
            )}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.primary} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={C.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => [`₱${v.toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="sales" stroke={C.primary} strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: C.dark }}>Recent Orders</h3>
            <button onClick={() => navigate('/seller/orders')} className="flex items-center gap-1 text-sm" style={{ color: C.primary }}>
              View All <ChevronRight size={14} />
            </button>
          </div>
          {sorted.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-sm text-gray-400 shadow-sm">
              No orders yet. Orders from customers will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.slice(0, 3).map(o => {
                const cfg = STATUS_CONFIG[o.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                return (
                  <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm truncate" style={{ color: C.dark }}>{o.fabricName || 'Fabric order'}</p>
                        <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {o.customerName || 'Customer'} · {o.quantity ?? 0}m
                      </p>
                      <p className="text-xs mt-1" style={{ color: C.primary }}>₱{(Number(o.total) || 0).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
