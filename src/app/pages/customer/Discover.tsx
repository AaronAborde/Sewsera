// src/app/pages/customer/Discover.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Star, MapPin, Scissors, Package, SlidersHorizontal } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

type Tab = 'tailors' | 'fabrics';

interface Tailor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  location: string;
  price: string;
  available: boolean;
  image: string;
  experience: string;
  tags: string[];
}

interface Fabric {
  id: string;
  name: string;
  seller: string;
  price: number;
  unit: string;
  image: string;
  category: string;
  rating: number;
  stock: number;
}

export default function Discover() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('tailors');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [fabrics, setFabrics] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);

  const tailorTags = ['All', 'Barong Tagalog', 'Suits', 'Gowns', 'Bridal', 'Filipiniana'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tailorsSnap, fabricsSnap, inventorySnap, shopsSnap] = await Promise.all([
          getDocs(collection(db, 'tailors')),
          getDocs(collection(db, 'fabrics')),
          getDocs(collection(db, 'inventory')),
          getDocs(collection(db, 'shops')),
        ]);
        setTailors(tailorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tailor)));
        const shopNames = new Map(shopsSnap.docs.map(d => [d.id, d.data().shopName as string]));
        // Sellers list fabrics in "inventory"; "fabrics" only holds a few legacy docs.
        const fabricList = [...inventorySnap.docs, ...fabricsSnap.docs].map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || 'Fabric',
            seller: d.seller || shopNames.get(d.sellerId) || 'Fabric Seller',
            price: Number(d.price) || 0,
            unit: d.unit || 'm',
            image: d.imageUrl || d.image || '',
            category: d.category || 'Fabric',
            rating: Number(d.rating) || 0,
            stock: Number(d.stock) || 0,
          } as Fabric;
        });
        setFabrics(fabricList);
      } catch (error) {
        console.error("Error fetching discover data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fabricTags = ['All', ...Array.from(new Set(fabrics.map(f => f.category).filter(Boolean)))];

  const filteredTailors = tailors.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || (t.specialty || '').toLowerCase().includes(search.toLowerCase());
    const matchTag = !selectedTag || selectedTag === 'All' || t.tags?.includes(selectedTag);
    return matchSearch && matchTag;
  });

  const filteredFabrics = fabrics.filter(f => {
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.seller.toLowerCase().includes(search.toLowerCase());
    const matchTag = !selectedTag || selectedTag === 'All' || f.category === selectedTag;
    return matchSearch && matchTag;
  });

  const tags = tab === 'tailors' ? tailorTags : fabricTags;

  if (loading) {
    return (
      <Layout title="Discover">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Discover">
      <div className="max-w-2xl mx-auto md:max-w-4xl px-4 md:px-8 py-5">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={tab === 'tailors' ? 'Search tailors, specialties...' : 'Search fabrics, sellers...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-12 py-3.5 rounded-2xl bg-white border border-gray-100 text-sm shadow-sm focus:outline-none"
          />
          <button className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <SlidersHorizontal size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="flex gap-1 p-1 bg-white rounded-xl mb-4 shadow-sm w-fit">
          {(['tailors', 'fabrics'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSelectedTag(''); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all"
              style={{
                background: tab === t ? C.primary : 'transparent',
                color: tab === t ? 'white' : '#6B7280',
              }}
            >
              {t === 'tailors' ? <Scissors size={14} /> : <Package size={14} />}
              {t === 'tailors' ? 'Tailors' : 'Fabrics'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag === 'All' ? '' : tag)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs border transition-all"
              style={{
                background: (selectedTag === tag || (tag === 'All' && !selectedTag)) ? C.primary : 'white',
                color: (selectedTag === tag || (tag === 'All' && !selectedTag)) ? 'white' : '#6B7280',
                borderColor: (selectedTag === tag || (tag === 'All' && !selectedTag)) ? C.primary : '#E5E7EB',
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {tab === 'tailors' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{filteredTailors.length} tailors found</p>
            {filteredTailors.map(t => (
              <button
                key={t.id}
                onClick={() => navigate(`/customer/tailor/${t.id}`)}
                className="w-full bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="flex">
                  <div className="w-28 h-28 flex-shrink-0 overflow-hidden">
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm truncate" style={{ color: C.dark }}>{t.name}</p>
                        <p className="text-xs text-gray-400">{t.specialty}</p>
                      </div>
                      <div className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs ${t.available ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {t.available ? 'Open' : 'Busy'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-0.5">
                        <Star size={11} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">{t.rating}</span>
                        <span className="text-xs text-gray-400">({t.reviews})</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <MapPin size={10} className="text-gray-400" />
                        <span className="text-xs text-gray-400 truncate">{t.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs" style={{ color: C.primary }}>{t.price}</span>
                      <span className="text-xs text-gray-400">{t.experience} exp.</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {filteredTailors.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Scissors size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No tailors found.</p>
              </div>
            )}
          </div>
        )}

        {tab === 'fabrics' && (
          <div>
            <p className="text-sm text-gray-500 mb-3">{filteredFabrics.length} fabrics found</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredFabrics.map(f => (
                <button
                  key={f.id}
                  onClick={() => navigate(`/customer/fabric/${f.id}`)}
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
                      <div className="flex items-center gap-0.5">
                        <Star size={10} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-500">{f.rating}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {filteredFabrics.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-400">
                  <Package size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No fabrics found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}