import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Star, MapPin, Clock, CheckCircle, Scissors, MessageSquare, Calendar } from 'lucide-react';
import { TAILORS } from '../../data/mockData';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', gold: '#C89558', bg: '#F5F0E8' };

const REVIEWS = [
  { name: 'Maria S.', rating: 5, date: 'March 2026', comment: 'Absolutely stunning Barong! Perfect fit and impeccable craftsmanship. Will definitely order again.' },
  { name: 'Carlo M.', rating: 5, date: 'February 2026', comment: 'Professional and punctual. Delivered my suit ahead of schedule. Highly recommended!' },
  { name: 'Sofia R.', rating: 4, date: 'January 2026', comment: 'Beautiful work. Just needed minor adjustments but overall very pleased.' },
];

export default function TailorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tailor = TAILORS.find(t => t.id === id) || TAILORS[0];
  const [activeTab, setActiveTab] = useState<'about' | 'portfolio' | 'reviews'>('about');

  return (
    <div className="min-h-screen" style={{ background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <div className="relative">
        <div className="h-64 md:h-80 overflow-hidden">
          <img src={tailor.image} alt={tailor.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(26,43,60,0.85) 100%)' }} />
        </div>
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
          <ArrowLeft size={18} />
        </button>
        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mb-2 ${tailor.available ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                {tailor.available ? 'Available Now' : 'Currently Busy'}
              </div>
              <h1 className="text-2xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{tailor.name}</h1>
              <p className="text-white/70 text-sm">{tailor.specialty}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                <Star size={13} className="fill-yellow-400 text-yellow-400" />
                <span className="text-white text-sm">{tailor.rating}</span>
                <span className="text-white/60 text-xs">({tailor.reviews})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto md:max-w-3xl px-4 md:px-8">
        {/* Stats Row */}
        <div className="bg-white rounded-2xl shadow-sm -mt-4 mb-5 p-4 grid grid-cols-3 divide-x divide-gray-100">
          {[
            { label: 'Experience', value: tailor.experience },
            { label: 'Completed', value: tailor.completedOrders + '+' },
            { label: 'Response', value: tailor.responseTime },
          ].map(s => (
            <div key={s.label} className="text-center px-2">
              <p className="text-base" style={{ color: C.dark }}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl shadow-sm text-sm text-gray-500">
            <MapPin size={14} style={{ color: C.primary }} /> {tailor.location}
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl shadow-sm text-sm text-gray-500">
            <Clock size={14} style={{ color: C.teal }} /> Responds {tailor.responseTime}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-xl mb-5 shadow-sm w-fit">
          {(['about', 'portfolio', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-1.5 rounded-lg text-sm capitalize transition-all"
              style={{
                background: activeTab === tab ? C.dark : 'transparent',
                color: activeTab === tab ? 'white' : '#6B7280',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="mb-2" style={{ color: C.dark }}>About</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{tailor.about}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="mb-3" style={{ color: C.dark }}>Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {tailor.tags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-full text-xs text-white" style={{ background: C.primary }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="mb-3" style={{ color: C.dark }}>Starting Price</h3>
              <p className="text-xl" style={{ color: C.primary }}>{tailor.price}</p>
              <p className="text-xs text-gray-400 mt-0.5">Prices vary based on garment complexity and fabric choice.</p>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-3 gap-2">
            {tailor.portfolio.map((img, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden">
                <img src={img} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>{tailor.rating}</p>
                <div className="flex gap-0.5 justify-center mt-1">
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} className="fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{tailor.reviews} reviews</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5,4,3,2,1].map(star => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-3">{star}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ background: C.gold, width: star === 5 ? '75%' : star === 4 ? '18%' : '5%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs" style={{ background: C.dark }}>
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: C.dark }}>{r.name}</p>
                      <p className="text-xs text-gray-400">{r.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(r.rating)].map((_, j) => <Star key={j} size={11} className="fill-yellow-400 text-yellow-400" />)}
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        )}

        <div className="h-28" />
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 p-4 flex gap-3 md:max-w-xl md:mx-auto">
        <button
          onClick={() => navigate(`/customer/messages?to=${tailor.id}&name=${encodeURIComponent(tailor.name)}&role=tailor`)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm transition-colors hover:bg-gray-50"
          style={{ color: C.dark }}
        >
          <MessageSquare size={16} /> Message
        </button>
        <button
          onClick={() => navigate(`/customer/booking?tailor=${tailor.id}`)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
          style={{ background: C.primary }}
        >
          <Calendar size={16} /> Book Appointment
        </button>
      </div>
    </div>
  );
}