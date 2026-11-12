// src/app/pages/admin/AdminOverview.tsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Users, Scissors, Store, ShoppingBag, ChevronRight } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { AdminGuard } from './AdminGuard';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', gold: '#C89558', bg: '#F5F0E8' };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB' },
  processing: { label: 'Processing', color: C.teal, bg: '#E8F8F6' },
  shipped: { label: 'Shipped', color: '#3B82F6', bg: '#EFF6FF' },
  delivered: { label: 'Delivered', color: '#10B981', bg: '#ECFDF5' },
};

interface AdminUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  createdAt?: unknown;
}

interface Order {
  id: string;
  product?: string;
  customer?: string;
  total?: number;
  status?: string;
  date?: string;
}

const millis = (v: unknown) => {
  const d = v as { toDate?: () => Date };
  return typeof d?.toDate === 'function' ? d.toDate().getTime() : 0;
};

export default function AdminOverview() {
  const navigate = useNavigate();
  const { userRole } = useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [activeJobs, setActiveJobs] = useState(0);
  const [bookings, setBookings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersSnap, ordersSnap, jobsSnap, bookingsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'jobs')),
        getDocs(collection(db, 'bookings')),
      ]);
      const ordersList = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as AdminUser)));
      setOrders(ordersList);
      setPendingOrders(ordersList.filter(o => o.status === 'pending').length);
      setActiveJobs(jobsSnap.docs.filter(d => d.data().status !== 'completed').length);
      setBookings(bookingsSnap.size);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userRole === 'admin') load();
  }, [load, userRole]);

  const pendingApprovals = users.filter(
    u => (u.role === 'tailor' || u.role === 'seller') && (u.status || 'pending') === 'pending',
  ).length;
  const recentUsers = [...users].sort((a, b) => millis(b.createdAt) - millis(a.createdAt)).slice(0, 5);
  const recentOrders = [...orders]
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
    .slice(0, 5);

  return (
    <Layout title="Admin Overview">
      <AdminGuard>
        <div className="max-w-2xl mx-auto md:max-w-4xl px-4 md:px-8 py-5">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <button
                onClick={load}
                className="px-4 py-2.5 rounded-xl text-white text-sm"
                style={{ background: C.primary }}
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Total Users', value: users.length, icon: <Users size={18} />, color: C.primary, bg: '#FDF5F2' },
                  { label: 'Tailors', value: users.filter(u => u.role === 'tailor').length, icon: <Scissors size={18} />, color: C.teal, bg: '#E8F8F6' },
                  { label: 'Sellers', value: users.filter(u => u.role === 'seller').length, icon: <Store size={18} />, color: C.gold, bg: '#FBF5EC' },
                  { label: 'Orders', value: orders.length, icon: <ShoppingBag size={18} />, color: C.dark, bg: C.bg },
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

              {/* Platform Health */}
              <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
                <h3 className="text-sm mb-3" style={{ color: C.dark }}>Platform Health</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Pending approvals', value: pendingApprovals, color: C.primary },
                    { label: 'Pending orders', value: pendingOrders, color: '#F59E0B' },
                    { label: 'Active jobs', value: activeJobs, color: C.teal },
                    { label: 'Bookings', value: bookings, color: C.gold },
                  ].map(h => (
                    <div key={h.label}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: h.color }} />
                        <span className="text-xs text-gray-400 leading-tight">{h.label}</span>
                      </div>
                      <p className="text-lg" style={{ color: C.dark }}>{h.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Lists */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm" style={{ color: C.dark }}>Recent Users</h3>
                    <button onClick={() => navigate('/admin/users')} className="flex items-center gap-1 text-xs" style={{ color: C.primary }}>
                      View All <ChevronRight size={13} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentUsers.map(u => (
                      <div key={u.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0" style={{ background: C.primary }}>
                          {(u.name || u.email || '?').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm truncate" style={{ color: C.dark }}>{u.name || 'Unnamed'}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email || 'No email'}</p>
                        </div>
                      </div>
                    ))}
                    {recentUsers.length === 0 && (
                      <p className="text-center py-8 text-sm text-gray-400">No users yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm" style={{ color: C.dark }}>Recent Orders</h3>
                    <button onClick={() => navigate('/admin/orders')} className="flex items-center gap-1 text-xs" style={{ color: C.primary }}>
                      View All <ChevronRight size={13} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recentOrders.map(o => {
                      const cfg = STATUS_CONFIG[o.status ?? ''] ?? { label: o.status || 'Unknown', color: '#6B7280', bg: '#F3F4F6' };
                      return (
                        <div key={o.id} className="bg-white rounded-2xl p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className="text-sm truncate" style={{ color: C.dark }}>{o.product || 'Order'}</p>
                            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-gray-400 truncate">{o.customer || 'Unknown customer'}</p>
                            <p className="text-xs flex-shrink-0" style={{ color: C.primary }}>₱{(o.total ?? 0).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    {recentOrders.length === 0 && (
                      <p className="text-center py-8 text-sm text-gray-400">No orders yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </AdminGuard>
    </Layout>
  );
}
