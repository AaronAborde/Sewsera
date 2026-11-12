import React, { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F' };

const PIPELINE = [
  { status: 'pending', label: 'Pending', color: '#F59E0B', bg: '#FFFBEB' },
  { status: 'processing', label: 'Processing', color: C.teal, bg: '#E8F8F6' },
  { status: 'shipped', label: 'Shipped', color: '#3B82F6', bg: '#EFF6FF' },
  { status: 'delivered', label: 'Delivered', color: '#10B981', bg: '#ECFDF5' },
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={10} />,
  processing: <Package size={10} />,
  shipped: <Truck size={10} />,
  delivered: <CheckCircle size={10} />,
};

const STATUS_ORDER = ['pending', 'processing', 'shipped', 'delivered'];

interface FabricOrder {
  id: string;
  fabricName?: string;
  customerName?: string;
  quantity?: number;
  total?: number;
  color?: string;
  status?: string;
  createdAt?: Timestamp;
}

const formatDate = (order: FabricOrder) => {
  const date = order.createdAt?.toDate?.();
  return date ? date.toLocaleDateString() : '';
};

export default function Orders() {
  const { currentUser } = useApp();
  const [orders, setOrders] = useState<FabricOrder[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) return;
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, 'fabricOrders'), where('sellerId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FabricOrder));
        ordersList.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setOrders(ordersList);
      } catch (e) {
        console.error('Error fetching orders:', e);
        setError('Could not load your orders. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser]);

  const advanceStatus = async (id: string, currentStatus: string) => {
    const idx = STATUS_ORDER.indexOf(currentStatus);
    if (idx >= STATUS_ORDER.length - 1) return;
    const newStatus = STATUS_ORDER[idx + 1];
    try {
      await updateDoc(doc(db, 'fabricOrders', id), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (e) {
      console.error('Error updating order status:', e);
      setError('Could not update the order. Please try again.');
    }
  };

  const filtered = orders.filter(o => filter === 'all' || o.status === filter);
  const counts = {
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  if (loading) {
    return (
      <Layout title="Orders">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Orders">
      <div className="max-w-xl mx-auto md:max-w-3xl px-4 md:px-8 py-5">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3.5 mb-5 text-xs text-red-600">{error}</div>
        )}

        <div className="grid grid-cols-4 gap-2 mb-5">
          {PIPELINE.map(p => (
            <button
              key={p.status}
              onClick={() => setFilter(filter === p.status ? 'all' : p.status)}
              className="flex flex-col items-center p-3 rounded-2xl bg-white shadow-sm transition-all"
              style={{
                outline: filter === p.status ? `2px solid ${p.color}40` : undefined,
                background: filter === p.status ? p.bg : 'white',
              }}
            >
              <div className="mb-1" style={{ color: p.color }}>{STATUS_ICONS[p.status]}</div>
              <p className="text-base" style={{ color: p.color }}>{counts[p.status as keyof typeof counts]}</p>
              <p className="text-xs text-gray-400 text-center leading-tight">{p.label}</p>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-500">{filtered.length} orders</p>
          {filtered.map(o => {
            const cfg = PIPELINE.find(p => p.status === o.status) || PIPELINE[0];
            const idx = STATUS_ORDER.indexOf(o.status || 'pending');
            const nextLabel = idx < STATUS_ORDER.length - 1
              ? `Mark as ${STATUS_ORDER[idx + 1].charAt(0).toUpperCase() + STATUS_ORDER[idx + 1].slice(1)}`
              : null;

            return (
              <div key={o.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs text-gray-300">#{o.id.slice(0, 8)}</p>
                      <span className="text-xs text-gray-300">·</span>
                      <p className="text-xs text-gray-400">{formatDate(o)}</p>
                    </div>
                    <p className="text-sm" style={{ color: C.dark }}>{o.fabricName || 'Fabric order'}</p>
                    <p className="text-xs text-gray-400">
                      {o.customerName || 'Customer'} · {o.quantity ?? 0}m
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm" style={{ color: C.primary }}>₱{(Number(o.total) || 0).toLocaleString()}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {PIPELINE.map((p, i) => {
                    const isReached = STATUS_ORDER.indexOf(o.status || 'pending') >= i;
                    return (
                      <div key={p.status} className="flex items-center flex-1">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                          style={{ background: isReached ? p.color : '#E5E7EB' }}
                        >
                          {STATUS_ICONS[p.status]}
                        </div>
                        {i < PIPELINE.length - 1 && (
                          <div className="flex-1 h-0.5 mx-0.5" style={{ background: STATUS_ORDER.indexOf(o.status || 'pending') > i ? p.color : '#E5E7EB' }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {o.color && (
                  <p className="text-xs text-gray-400 mb-3">
                    <span className="text-gray-500">Color:</span> {o.color}
                  </p>
                )}

                {nextLabel && (
                  <button
                    onClick={() => advanceStatus(o.id, o.status || 'pending')}
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
      </div>
    </Layout>
  );
}
