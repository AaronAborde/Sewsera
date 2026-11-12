// src/app/pages/tailor/Portfolio.tsx
import { useState, useEffect } from 'react';
import { Plus, Trash2, Image, X } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, getDoc, addDoc, deleteDoc, doc } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

interface PortfolioItem {
  id: string;
  url: string;
  caption: string;
}

export default function Portfolio() {
  const { currentUser } = useApp();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [rating, setRating] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const fetchPortfolio = async () => {
      try {
        const [portfolioSnap, tailorSnap, bookingsSnap] = await Promise.all([
          getDocs(query(collection(db, 'portfolio'), where('tailorId', '==', currentUser.uid))),
          getDoc(doc(db, 'tailors', currentUser.uid)),
          getDocs(query(collection(db, 'bookings'), where('tailorId', '==', currentUser.uid))),
        ]);
        setItems(portfolioSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem)));
        setRating(Number(tailorSnap.data()?.rating) || 0);
        setCompletedJobs(bookingsSnap.docs.filter(d => d.data().status === 'completed').length);
      } catch (error) {
        console.error("Error fetching portfolio:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [currentUser]);

  const addItem = async () => {
    if (!newUrl || !newCaption) return;
    setAdding(true);
    try {
      const docRef = await addDoc(collection(db, 'portfolio'), {
        tailorId: currentUser?.uid,
        url: newUrl,
        caption: newCaption,
        createdAt: new Date(),
      });
      setItems(prev => [...prev, { id: docRef.id, url: newUrl, caption: newCaption }]);
      setNewUrl('');
      setNewCaption('');
      setShowModal(false);
    } catch (error) {
      console.error("Error adding portfolio item:", error);
    } finally {
      setAdding(false);
    }
  };

  const removeItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'portfolio', id));
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error("Error removing portfolio item:", error);
    }
  };

  if (loading) {
    return (
      <Layout title="Portfolio">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Portfolio">
      <div className="max-w-xl mx-auto md:max-w-3xl px-4 md:px-8 py-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl" style={{ color: C.dark }}>My Portfolio</h2>
            <p className="text-xs text-gray-400">{items.length} work{items.length === 1 ? '' : 's'} displayed</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
            style={{ background: C.primary }}
          >
            <Plus size={16} /> Add Work
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Portfolio Items', value: items.length },
            { label: 'Completed Jobs', value: completedJobs },
            { label: 'Avg. Rating', value: rating > 0 ? `${rating.toFixed(1)}★` : '—' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-xl" style={{ color: C.dark }}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Gallery Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {items.map(item => (
              <div key={item.id} className="relative group rounded-2xl overflow-hidden shadow-sm aspect-square">
                <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-3">
                  <p className="text-white text-xs text-center mb-2 leading-tight">{item.caption}</p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500 text-white text-xs"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={() => setShowModal(true)}
              className="rounded-2xl border-2 border-dashed border-gray-300 aspect-square flex flex-col items-center justify-center gap-2 hover:border-current transition-colors"
              style={{ '--tw-border-opacity': 1 } as React.CSSProperties}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#D1D5DB')}
            >
              <Plus size={24} className="text-gray-400" />
              <span className="text-xs text-gray-400">Add Photo</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm text-center text-gray-400">
            <Image size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No portfolio items yet.</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-sm hover:underline" style={{ color: C.primary }}>
              Upload your first work
            </button>
          </div>
        )}

        {/* Add Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg" style={{ color: C.dark }}>Add Portfolio Item</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <input
                type="url"
                placeholder="Image URL"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-3 text-sm"
              />
              <input
                type="text"
                placeholder="Caption (e.g., Barong Tagalog Collection)"
                value={newCaption}
                onChange={e => setNewCaption(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4 text-sm"
              />
              <button
                onClick={addItem}
                disabled={adding || !newUrl || !newCaption}
                className="w-full py-3 rounded-xl text-white text-sm disabled:opacity-50"
                style={{ background: C.primary }}
              >
                {adding ? 'Adding...' : 'Add to Portfolio'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}