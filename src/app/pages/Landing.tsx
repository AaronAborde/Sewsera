import { useNavigate } from 'react-router';
import { Scissors, Star, Users, Package, ArrowRight, CheckCircle } from 'lucide-react';
import { usePublicStats } from '../useStats';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', gold: '#C89558', bg: '#F5F0E8' };

const HERO_IMG = 'https://images.unsplash.com/photo-1552358155-515e264cb8b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080';
const FABRIC_IMG = 'https://images.unsplash.com/photo-1771098206750-6be5aef4f503?w=600&q=80';
const TAILOR_IMG = 'https://images.unsplash.com/photo-1580880783096-cee2daa9c67f?w=600&q=80';

export default function Landing() {
  const navigate = useNavigate();
  const stats = usePublicStats();

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: '#fff' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.primary }}>
              <Scissors size={16} className="text-white" />
            </div>
            <span className="text-xl" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>SewsEra</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">How It Works</a>
            <a href="#about" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/auth/login')} className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors" style={{ color: C.dark }}>
              Sign In
            </button>
            <button onClick={() => navigate('/onboarding')} className="text-sm px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90" style={{ background: C.primary }}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(26,43,60,0.92) 0%, rgba(196,98,63,0.75) 100%)' }} />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm mb-6">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs text-white/90">Philippines #1 Tailoring Marketplace</span>
            </div>
            <h1 className="text-4xl md:text-6xl text-white mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>
              Crafted with<br />
              <span style={{ color: '#F4A07A' }}>Precision,</span><br />
              Made for You.
            </h1>
            <p className="text-base md:text-lg text-white/75 mb-10 max-w-xl leading-relaxed">
              Connect with skilled Filipino tailors, source premium fabrics, and bring your wardrobe vision to life — all in one elegant platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/onboarding')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white text-sm transition-all hover:opacity-90"
                style={{ background: C.primary }}
              >
                Start Your Journey <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/auth/login')}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm bg-white/15 backdrop-blur-sm text-white border border-white/25 hover:bg-white/25 transition-all"
              >
                Sign In to Account
              </button>
            </div>
            {/* Stats */}
            <div className="flex flex-wrap gap-6 mt-12">
              {[
                { v: stats.tailors.toLocaleString(), l: 'Expert Tailors' },
                { v: stats.customers.toLocaleString(), l: 'Happy Clients' },
                { v: stats.sellers.toLocaleString(), l: 'Fabric Sellers' },
                { v: '4.9★', l: 'Avg. Rating' },
              ].map(s => (
                <div key={s.l} className="text-center">
                  <p className="text-2xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{s.v}</p>
                  <p className="text-xs text-white/60 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6" style={{ background: C.bg }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: C.primary }}>Why SewsEra</p>
            <h2 className="text-3xl md:text-4xl" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>A Platform Built for Everyone</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">Whether you're a customer, artisan tailor, or fabric merchant — SewsEra empowers your craft.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Users size={24} className="text-white" />,
                color: C.teal,
                title: 'For Customers',
                desc: 'Discover skilled tailors near you, browse premium fabrics, book fittings, and track your orders — all with secure online payment.',
                features: ['Find verified tailors', 'Real-time project tracking', 'Secure GCash & card payment'],
              },
              {
                icon: <Scissors size={24} className="text-white" />,
                color: C.primary,
                title: 'For Tailors',
                desc: 'Manage your bookings, showcase your portfolio, source fabrics from top suppliers, and grow your tailoring business.',
                features: ['Booking management', 'Portfolio showcase', 'Earnings dashboard'],
              },
              {
                icon: <Package size={24} className="text-white" />,
                color: C.dark,
                title: 'For Fabric Sellers',
                desc: 'List your fabric inventory, process orders efficiently, and connect with hundreds of tailors across Metro Manila.',
                features: ['Inventory management', 'Order tracking system', 'Sales analytics'],
              },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: f.color }}>
                  {f.icon}
                </div>
                <h3 className="mb-2" style={{ color: C.dark }}>{f.title}</h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{f.desc}</p>
                <ul className="space-y-2">
                  {f.features.map(feat => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle size={14} style={{ color: f.color }} />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: C.primary }}>Process</p>
            <h2 className="text-3xl md:text-4xl" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>How SewsEra Works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up as a customer, tailor, or fabric seller in minutes.' },
              { step: '02', title: 'Browse & Discover', desc: 'Find verified tailors or premium fabrics near you on the map.' },
              { step: '03', title: 'Book & Order', desc: 'Schedule fittings or order fabrics with just a few taps.' },
              { step: '04', title: 'Pay Securely', desc: 'Pay via GCash, Maya, credit card, or bank transfer.' },
            ].map((s, i) => (
              <div key={s.step} className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-sm mx-auto" style={{ background: C.primary }}>
                    {s.step}
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block absolute top-7 left-full w-full h-px" style={{ background: `linear-gradient(to right, ${C.primary}, transparent)` }} />
                  )}
                </div>
                <h4 className="mb-2" style={{ color: C.dark }}>{s.title}</h4>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="py-20 px-6" style={{ background: C.bg }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: C.primary }}>Premium Fabrics</p>
            <h2 className="text-3xl md:text-4xl mb-4" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>
              Source the Finest Filipino Fabrics
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              From traditional Piña and Jusi to premium Italian silk blends — tailors can source fabrics from verified sellers across Metro Manila.
            </p>
            <button onClick={() => navigate('/onboarding')} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm hover:opacity-90 transition-opacity" style={{ background: C.teal }}>
              Join as a Tailor <ArrowRight size={16} />
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg h-72 md:h-80">
            <img src={FABRIC_IMG} alt="Fabric" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center text-white" style={{ background: C.dark }}>
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: C.primary }}>
            <Scissors size={28} className="text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to Experience SewsEra?
          </h2>
          <p className="text-white/60 text-sm mb-8">Join thousands of customers, tailors, and fabric sellers already on the platform.</p>
          <button
            onClick={() => navigate('/onboarding')}
            className="px-10 py-4 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
            style={{ background: C.primary }}
          >
            Get Started — It's Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: C.primary }}>
              <Scissors size={12} className="text-white" />
            </div>
            <span className="text-sm" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>SewsEra</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 SewsEra. All rights reserved. Made with ♥ in the Philippines.</p>
          <div className="flex gap-4 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600">Privacy</a>
            <a href="#" className="hover:text-gray-600">Terms</a>
            <a href="#" className="hover:text-gray-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
