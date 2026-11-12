import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle, Clock, Loader2, CreditCard, MessageSquare } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { PaymentModal } from '../../components/PaymentModal';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  in_progress: { label: 'In Progress', color: C.teal, bg: '#E8F8F6', icon: <Loader2 size={13} className="animate-spin" /> },
  pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB', icon: <Clock size={13} /> },
  completed: { label: 'Completed', color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle size={13} /> },
};

interface Order {
  id: string;
  service: string;
  tailor: string;
  status: string;
  progress: number;
  deadline: string;
  amount: number;
  paid: boolean;
}

// Live bookings exist in two shapes: newer docs use service/price,
// older ones use description/amount.
const toOrder = (id: string, d: any): Order => ({
  id,
  service: d.service || d.description || d.serviceType || 'Custom order',
  tailor: d.tailorName || d.tailor || 'Tailor',
  status: d.status || 'pending',
  progress: Number(d.progress) || 0,
  deadline: d.deadline?.toDate ? d.deadline.toDate().toLocaleDateString() : d.deadline || 'TBD',
  amount: Number(d.price ?? d.amount) || 0,
  paid: Number(d.downpayment) > 0 || d.paymentStatus === 'paid',
});

export default function CustomerOrders() {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'pending' | 'completed'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const fetchOrders = async () => {
      try {
        const bookingsQuery = query(collection(db, 'bookings'), where('customerId', '==', currentUser.uid));
        const bookingsSnap = await getDocs(bookingsQuery);
        setOrders(bookingsSnap.docs.map(doc => toOrder(doc.id, doc.data())));
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentUser]);

  const filtered = orders.filter(o => filter === 'all' || o.status === filter);

  if (loading) {
    return (
      <Layout title="My Orders">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Orders">
      <div className="max-w-xl mx-auto md:max-w-3xl px-4 md:px-8 py-5">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
          {(['all', 'in_progress', 'pending', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs border transition-all"
              style={{ background: filter === f ? C.dark : 'white', color: filter === f ? 'white' : '#6B7280', borderColor: filter === f ? C.dark : '#E5E7EB' }}>
              {f === 'all' ? 'All Orders' : f === 'in_progress' ? 'In Progress' : f === 'pending' ? 'Pending' : 'Completed'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map(p => {
            const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
            return (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm" style={{ color: C.dark }}>{p.service}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.tailor}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.icon} {cfg.label}
                    </div>
                  </div>

                  {p.status !== 'pending' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5"><span>Progress</span><span>{p.progress}%</span></div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: p.status === 'completed' ? '#10B981' : C.teal }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>Due: {p.deadline}</span>
                    <span className="text-sm" style={{ color: C.dark }}>{p.amount > 0 ? `₱${p.amount.toLocaleString()}` : 'To be quoted'}</span>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => navigate('/customer/messages')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs transition-colors hover:bg-gray-50" style={{ color: C.dark }}>
                      <MessageSquare size={13} /> Message Tailor
                    </button>
                    {!p.paid && p.status !== 'completed' && p.amount > 0 && (
                      <button onClick={() => setPaymentOrder(p)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs hover:opacity-90 transition-opacity" style={{ background: C.primary }}>
                        <CreditCard size={13} /> Pay Balance
                      </button>
                    )}
                    {p.paid && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 text-green-600 text-xs"><CheckCircle size={13} /> Paid</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400"><Clock size={36} className="mx-auto mb-3 opacity-40" /><p className="text-sm">No orders yet.</p><button onClick={() => navigate('/customer/discover')} className="mt-3 text-sm hover:underline" style={{ color: C.primary }}>Book a Tailor</button></div>
          )}
        </div>
      </div>

      {paymentOrder && (
        <PaymentModal isOpen={!!paymentOrder} onClose={() => setPaymentOrder(null)} amount={paymentOrder.amount} description={`Balance — ${paymentOrder.service}`} onSuccess={() => setPaymentOrder(null)} />
      )}
    </Layout>
  );
}
