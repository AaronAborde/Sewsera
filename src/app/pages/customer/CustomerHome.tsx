// src/app/pages/customer/CustomerHome.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Search, Star, MapPin, ChevronRight, Scissors } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

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
}

export default function CustomerHome() {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);

  const firstName = currentUser?.name?.split(' ')[0] || 'Customer';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured tailors (limit 3)
        const tailorsQuery = query(collection(db, 'tailors'), limit(3));
        const tailorsSnap = await getDocs(tailorsQuery);
        const tailorsList = tailorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tailor));
        setTailors(tailorsList);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout title="Home">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Home">
      <div className="max-w-2xl mx-auto md:max-w-4xl px-4 md:px-8 py-5">
        {/* Greeting */}
        <div className="mb-5">
          <p className="text-sm text-gray-500">Good day,</p>
          <h2 className="text-xl" style={{ color: C.dark }}>Welcome back, {firstName}! 👋</h2>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tailors, services..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => navigate('/customer/discover')}
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white border border-gray-100 text-sm shadow-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': C.primary + '40' } as React.CSSProperties}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-7">
          {[
            { label: 'Find Tailors', icon: <Scissors size={20} />, color: C.primary, path: '/customer/discover' },
            { label: 'View Map', icon: <MapPin size={20} />, color: C.dark, path: '/customer/map' },
          ].map(a => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: a.color }}>
                {a.icon}
              </div>
              <span className="text-xs text-center" style={{ color: C.dark }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Promotions Banner */}
        <div className="rounded-2xl p-5 mb-7 flex items-center justify-between overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${C.dark} 0%, #2D4A6A 100%)` }}>
          <div className="relative z-10">
            <p className="text-xs text-white/60 mb-1">Limited Offer</p>
            <h3 className="text-white mb-1">First Booking Free Fitting</h3>
            <p className="text-xs text-white/60 mb-3">Book any tailor and get your first fitting consultation at no cost.</p>
            <button onClick={() => navigate('/customer/discover')} className="px-4 py-2 rounded-lg text-xs text-white" style={{ background: C.primary }}>
              Book Now
            </button>
          </div>
          <div className="absolute right-4 opacity-10">
            <Scissors size={100} className="text-white" />
          </div>
        </div>

        {/* Featured Tailors */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: C.dark }}>Featured Tailors</h3>
            <button onClick={() => navigate('/customer/discover')} className="flex items-center gap-1 text-sm" style={{ color: C.primary }}>
              See All <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {tailors.map(t => (
              <button
                key={t.id}
                onClick={() => navigate(`/customer/tailor/${t.id}`)}
                className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: C.dark }}>{t.name}</p>
                  <p className="text-xs text-gray-400 truncate">{t.specialty}</p>
                  <div className="flex items-center gap-3 mt-1.5">
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
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs" style={{ color: C.primary }}>{t.price}</p>
                  <div className={`mt-1 px-2 py-0.5 rounded-full text-xs ${t.available ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {t.available ? 'Available' : 'Busy'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}