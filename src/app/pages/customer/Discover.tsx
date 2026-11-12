// src/app/pages/customer/Discover.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Star, MapPin, Scissors, SlidersHorizontal } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C' };

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

export default function Discover() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);

  const tailorTags = ['All', 'Barong Tagalog', 'Suits', 'Gowns', 'Bridal', 'Filipiniana'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tailorsSnap = await getDocs(collection(db, 'tailors'));
        setTailors(tailorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tailor)));
      } catch (error) {
        console.error("Error fetching discover data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTailors = tailors.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || (t.specialty || '').toLowerCase().includes(search.toLowerCase());
    const matchTag = !selectedTag || selectedTag === 'All' || t.tags?.includes(selectedTag);
    return matchSearch && matchTag;
  });

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
            placeholder="Search tailors, specialties..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-12 py-3.5 rounded-2xl bg-white border border-gray-100 text-sm shadow-sm focus:outline-none"
          />
          <button className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <SlidersHorizontal size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar">
          {tailorTags.map(tag => (
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
      </div>
    </Layout>
  );
}
