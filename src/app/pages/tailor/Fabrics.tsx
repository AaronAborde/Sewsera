// src/app/pages/tailor/Fabrics.tsx
// Tailors source fabric from the fabric sellers; customers no longer shop fabrics.
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Package } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F' };

interface Fabric {
  id: string;
  name: string;
  seller: string;
  price: number;
  unit: string;
  image: string;
  category: string;
  stock: number;
}

export default function Fabrics() {
  const navigate = useNavigate();
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFabrics = async () => {
      try {
        const [inventorySnap, fabricsSnap, shopsSnap] = await Promise.all([
          getDocs(collection(db, 'inventory')),
          getDocs(collection(db, 'fabrics')),
          getDocs(collection(db, 'shops')),
        ]);
        const shopNames = new Map(shopsSnap.docs.map(d => [d.id, d.data().shopName as string]));
        // Sellers list fabrics in "inventory"; "fabrics" only holds a few legacy docs.
        setFabrics([...inventorySnap.docs, ...fabricsSnap.docs].map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || 'Fabric',
            seller: d.seller || shopNames.get(d.sellerId) || 'Fabric Seller',
            price: Number(d.price) || 0,
            unit: d.unit || 'm',
            image: d.imageUrl || d.image || '',
            category: d.category || 'Fabric',
            stock: Number(d.stock) || 0,
          } as Fabric;
        }));
      } catch (error) {
        console.error('Error fetching fabrics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFabrics();
  }, []);

  const categories = ['All', ...Array.from(new Set(fabrics.map(f => f.category).filter(Boolean)))];
  const filtered = fabrics.filter(f => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.seller.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || f.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <Layout title="Fabrics">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Fabrics">
      <div className="max-w-2xl mx-auto md:max-w-4xl px-4 md:px-8 py-5">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search fabrics, sellers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white border border-gray-100 text-sm shadow-sm focus:outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === 'All' ? '' : category)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs border transition-all"
              style={{
                background: (selectedCategory === category || (category === 'All' && !selectedCategory)) ? C.primary : 'white',
                color: (selectedCategory === category || (category === 'All' && !selectedCategory)) ? 'white' : '#6B7280',
                borderColor: (selectedCategory === category || (category === 'All' && !selectedCategory)) ? C.primary : '#E5E7EB',
              }}
            >
              {category}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-3">{filtered.length} fabrics found</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map(f => (
            <button
              key={f.id}
              onClick={() => navigate(`/tailor/fabric/${f.id}`)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left"
            >
              <div className="h-36 overflow-hidden">
                {f.image ? (
                  <img src={f.image} alt={f.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Package size={28} className="text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-medium" style={{ color: C.dark }}>{f.name}</p>
                  <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-xs bg-gray-50 text-gray-500">{f.category}</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{f.seller}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm" style={{ color: C.primary }}>₱{f.price}<span className="text-xs text-gray-400">/{f.unit}</span></p>
                  <span className="text-xs" style={{ color: f.stock > 0 ? C.teal : '#EF4444' }}>
                    {f.stock > 0 ? `${f.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 md:col-span-3 text-center py-12 text-gray-400">
              <Package size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No fabrics found.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
