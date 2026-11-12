// src/app/pages/tailor/Schedule.tsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

interface Appointment {
  id: string;
  date: string | number; // 'YYYY-MM-DD' for new appointments, day-of-month for legacy docs
  time: string;
  client: string;
  service: string;
  color: string;
  createdAt?: any;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function Schedule() {
  const { currentUser } = useApp();
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAppt, setNewAppt] = useState({ time: '', client: '', service: '', color: C.primary });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const fetchAppointments = async () => {
      try {
        const q = query(collection(db, 'appointments'), where('tailorId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const apptList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        setAppointments(apptList);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [currentUser]);

  const addAppointment = async () => {
    if (!newAppt.time || !newAppt.client || !newAppt.service) return;
    setAdding(true);
    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        tailorId: currentUser?.uid,
        date: toKey(selectedDate),
        ...newAppt,
        createdAt: new Date(),
      });
      setAppointments(prev => [...prev, { id: docRef.id, date: toKey(selectedDate), ...newAppt }]);
      setNewAppt({ time: '', client: '', service: '', color: C.primary });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding appointment:", error);
    } finally {
      setAdding(false);
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'appointments', id));
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error("Error deleting appointment:", error);
    }
  };

  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const leadingBlanks = monthStart.getDay();
  const todayKey = toKey(today);
  const selectedKey = toKey(selectedDate);

  // Legacy appointments only store a day number; anchor them to their creation month.
  const apptKey = (a: Appointment) => {
    if (typeof a.date === 'string') return a.date;
    const created = a.createdAt?.toDate ? a.createdAt.toDate() : viewMonth;
    return toKey(new Date(created.getFullYear(), created.getMonth(), a.date));
  };
  const eventKeys = new Set(appointments.map(apptKey));
  const daySchedule = appointments.filter(a => apptKey(a) === selectedKey);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1);
    const day = Math.min(selectedDate.getDate(), new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate());
    setViewMonth(next);
    setSelectedDate(new Date(next.getFullYear(), next.getMonth(), day));
  };

  if (loading) {
    return (
      <Layout title="Schedule">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Schedule">
      <div className="max-w-xl mx-auto md:max-w-3xl px-4 md:px-8 py-5">

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-5">
          <div className="flex items-center justify-between p-4 border-b border-gray-50">
            <button onClick={() => shiftMonth(-1)} aria-label="Previous month" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft size={18} style={{ color: C.dark }} />
            </button>
            <div className="text-center">
              <p className="text-sm" style={{ color: C.dark }}>{viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            <button onClick={() => shiftMonth(1)} aria-label="Next month" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight size={18} style={{ color: C.dark }} />
            </button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[...Array(leadingBlanks)].map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
                const dateKey = toKey(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
                const hasEvent = eventKeys.has(dateKey);
                const isSelected = dateKey === selectedKey;
                const isToday = dateKey === todayKey;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d))}
                    className="relative flex flex-col items-center py-1.5 rounded-xl transition-all text-xs"
                    style={{
                      background: isSelected ? C.primary : isToday ? '#FDF5F2' : 'transparent',
                      color: isSelected ? 'white' : isToday ? C.primary : C.dark,
                    }}
                  >
                    {d}
                    {hasEvent && !isSelected && (
                      <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: C.primary }} />
                    )}
                    {hasEvent && isSelected && (
                      <div className="w-1 h-1 rounded-full mt-0.5 bg-white/60" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Schedule for selected day */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ color: C.dark }}>{selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3>
              <p className="text-xs text-gray-400">{daySchedule.length} appointment{daySchedule.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs"
              style={{ background: C.primary }}
            >
              <Plus size={13} /> Add
            </button>
          </div>

          {daySchedule.length > 0 ? (
            <div className="space-y-3">
              {daySchedule.map(appt => (
                <div key={appt.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                  <div className="w-1 h-14 rounded-full flex-shrink-0" style={{ background: appt.color }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: C.dark }}>{appt.service}</p>
                    <p className="text-xs text-gray-400">{appt.client}</p>
                    <p className="text-xs mt-1" style={{ color: appt.color }}>{appt.time}</p>
                  </div>
                  <button
                    onClick={() => deleteAppointment(appt.id)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs hover:opacity-80 transition-opacity"
                    style={{ background: '#EF4444' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Plus size={20} className="opacity-40" />
              </div>
              <p className="text-sm">No appointments on this day.</p>
              <button onClick={() => setShowModal(true)} className="mt-2 text-sm hover:underline" style={{ color: C.primary }}>
                Add appointment
              </button>
            </div>
          )}
        </div>

        {/* Add Appointment Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg" style={{ color: C.dark }}>Add Appointment</h3>
                  <p className="text-xs text-gray-400">{selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Time (e.g., 10:00 AM)"
                value={newAppt.time}
                onChange={e => setNewAppt({ ...newAppt, time: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-3 text-sm"
              />
              <input
                type="text"
                placeholder="Client Name"
                value={newAppt.client}
                onChange={e => setNewAppt({ ...newAppt, client: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-3 text-sm"
              />
              <input
                type="text"
                placeholder="Service (e.g., Barong Fitting)"
                value={newAppt.service}
                onChange={e => setNewAppt({ ...newAppt, service: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-3 text-sm"
              />
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Color accent</p>
                <div className="flex gap-2">
                  {[C.primary, C.teal, '#C89558', C.dark].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewAppt({ ...newAppt, color })}
                      className={`w-8 h-8 rounded-full ${newAppt.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={addAppointment}
                disabled={adding || !newAppt.time || !newAppt.client || !newAppt.service}
                className="w-full py-3 rounded-xl text-white text-sm disabled:opacity-50"
                style={{ background: C.primary }}
              >
                {adding ? 'Adding...' : 'Add Appointment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}