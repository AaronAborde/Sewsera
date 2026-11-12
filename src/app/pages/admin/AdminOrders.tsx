// src/app/pages/admin/AdminOrders.tsx
import { useCallback, useEffect, useState } from 'react';
import { Package, ChevronRight } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { AdminGuard } from './AdminGuard';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', gold: '#C89558', bg: '#F5F0E8' };

const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered'];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB' },
  processing: { label: 'Processing', color: C.teal, bg: '#E8F8F6' },
  shipped: { label: 'Shipped', color: '#3B82F6', bg: '#EFF6FF' },
  delivered: { label: 'Delivered', color: '#10B981', bg: '#ECFDF5' },
};

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
];

interface Order {
  id: string;
  product?: string;
  customer?: string;
  quantity?: number;
  total?: number;
  status?: string;
  date?: string;
}

export default function AdminOrders() {
  const { userRole } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userRole === 'admin') load();
  }, [load, userRole]);

  const advanceStatus = async (id: string, currentStatus: string) => {
    const idx = STATUS_ORDER.indexOf(currentStatus);
    if (idx >= STATUS_ORDER.length - 1) return;
    const newStatus = STATUS_ORDER[idx + 1];
    setActionError('');
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      setOrders(prev => prev.map(o => (o.id === id ? { ...o, status: newStatus } : o)));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update order status.');
    }
  };

  const statusOf = (o: Order) => (o.status && STATUS_CONFIG[o.status] ? o.status : 'pending');
  const filtered = orders.filter(o => filter === 'all' || statusOf(o) === filter);

  return (
    <Layout title="Orders">
      <AdminGuard>
        <div className="max-w-xl mx-auto md:max-w-3xl px-4 md:px-8 py-5">
          <div className="flex flex-wrap gap-2 mb-5">
            {FILTERS.map(f => {
              const isActive = filter === f.value;
              const count = f.value === 'all' ? orders.length : orders.filter(o => statusOf(o) === f.value).length;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className="px-3 py-1.5 rounded-full text-xs border border-gray-200 bg-white"
                  style={isActive ? { background: C.dark, color: 'white', borderColor: C.dark } : { color: C.dark }}
                >
                  {f.label} {count}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : loadError ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-500 mb-3">{loadError}</p>
              <button onClick={load} className="px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: C.primary }}>
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {actionError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{actionError}</p>}
              <p className="text-sm text-gray-500">{filtered.length} orders</p>
              {filtered.map(o => {
                const status = statusOf(o);
                const cfg = STATUS_CONFIG[status];
                const idx = STATUS_ORDER.indexOf(status);
                const nextLabel =
                  idx < STATUS_ORDER.length - 1
                    ? `Mark as ${STATUS_ORDER[idx + 1].charAt(0).toUpperCase() + STATUS_ORDER[idx + 1].slice(1)}`
                    : null;

                return (
                  <div key={o.id} className="bg-white rounded-2xl shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs text-gray-400 truncate">{o.id}</p>
                          <span className="text-xs text-gray-300">·</span>
                          <p className="text-xs text-gray-400">{o.date || 'No date'}</p>
                        </div>
                        <p className="text-sm truncate" style={{ color: C.dark }}>{o.product || 'Order'}</p>
                        <p className="text-xs text-gray-400">
                          {o.customer || 'Unknown customer'}
                          {o.quantity ? ` · ${o.quantity}` : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm" style={{ color: C.primary }}>₱{(o.total ?? 0).toLocaleString()}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    {nextLabel && (
                      <button
                        onClick={() => advanceStatus(o.id, status)}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl text-white hover:opacity-90 transition-opacity"
                        style={{ background: cfg.color }}
                      >
                        {nextLabel} <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Package size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No orders found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </AdminGuard>
    </Layout>
  );
}
