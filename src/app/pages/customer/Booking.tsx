import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Star, MapPin } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { addDoc, collection, doc, getDoc, Timestamp } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

const SERVICES = ['Barong Tagalog', 'Suit', 'Gown', 'Bridal', 'Filipiniana', 'Alteration', 'Other'];
const today = new Date().toISOString().slice(0, 10);
const nextWeek = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

interface Tailor {
  id: string;
  name: string;
  specialty: string;
  image: string;
  rating: number;
  reviews: number;
  location: string;
}

export default function Booking() {
  const [params] = useSearchParams();
  const tailorId = params.get('tailor') || '';
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ service: '', measurements: '', notes: '', deadline: nextWeek });

  useEffect(() => {
    if (!tailorId) {
      setLoading(false);
      return;
    }
    getDoc(doc(db, 'tailors', tailorId))
      .then(snap => {
        if (snap.exists()) setTailor({ id: snap.id, ...snap.data() } as Tailor);
      })
      .catch(error => console.error('Error fetching tailor:', error))
      .finally(() => setLoading(false));
  }, [tailorId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please sign in to book.');
      return;
    }
    if (!form.service) {
      setError('Please choose a service.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await addDoc(collection(db, 'bookings'), {
        customerId: currentUser.uid,
        customerName: currentUser.name || '',
        tailorId,
        tailorName: tailor?.name || '',
        service: form.service,
        notes: form.notes.trim(),
        measurements: form.measurements.trim(),
        price: 0,
        downpayment: 0,
        progress: 0,
        status: 'pending',
        deadline: form.deadline,
        createdAt: Timestamp.now(),
      });
      navigate('/customer/orders');
    } catch (err) {
      console.error('Error creating booking:', err);
      setError('Could not send the booking. Please try again.');
      setSaving(false);
    }
  };

  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/customer/discover'));

  return (
    <Layout title="Book Appointment">
      <div className="max-w-xl mx-auto px-4 md:px-8 py-6">
        <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-500 mb-5 hover:text-gray-700 transition-colors">
          <ArrowLeft size={15} /> Back
        </button>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !tailor ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
            <p className="text-sm text-gray-500 mb-3">This tailor could not be found.</p>
            <button onClick={() => navigate('/customer/discover')} className="text-sm hover:underline" style={{ color: C.primary }}>
              Browse tailors
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex items-center gap-4">
              {tailor.image && <img src={tailor.image} alt={tailor.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />}
              <div className="min-w-0">
                <h1 className="text-lg truncate" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>{tailor.name}</h1>
                <p className="text-xs text-gray-400">{tailor.specialty}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Star size={11} className="fill-yellow-400 text-yellow-400" /> {tailor.rating} ({tailor.reviews})
                  </span>
                  {tailor.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin size={11} /> {tailor.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1.5">Service</label>
                <select
                  value={form.service}
                  onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                >
                  <option value="">Select a service</option>
                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1.5">Measurements</label>
                <textarea
                  rows={3}
                  placeholder="Chest, waist, hips, length…"
                  value={form.measurements}
                  onChange={e => setForm(f => ({ ...f, measurements: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1.5">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Design details, fabric, reference…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1.5">Deadline</label>
                <input
                  type="date"
                  min={today}
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                />
              </div>

              <p className="text-xs text-gray-400">The tailor will confirm the price after reviewing your request.</p>
              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl text-white text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: C.primary }}
              >
                {saving ? 'Sending…' : 'Send Booking Request'}
              </button>
            </form>
          </>
        )}
      </div>
    </Layout>
  );
}
