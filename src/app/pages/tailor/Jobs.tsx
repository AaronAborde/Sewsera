// src/app/pages/tailor/Jobs.tsx
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Ruler, FileText, CheckCircle2 } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { toBooking, type Booking } from '../../bookings';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

const STATUS_CONFIG = {
  in_progress: { label: 'In Progress', color: C.teal, bg: '#E8F8F6' },
  pending: { label: 'Pending', color: '#F59E0B', bg: '#FFFBEB' },
  completed: { label: 'Completed', color: '#10B981', bg: '#ECFDF5' },
};

export default function Jobs() {
  const { currentUser } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const fetchJobs = async () => {
      try {
        const q = query(collection(db, 'bookings'), where('tailorId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        setJobs(snapshot.docs.map(d => toBooking(d.id, d.data())));
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [currentUser]);

  const updateJob = async (id: string, updates: Partial<Booking>) => {
    try {
      await updateDoc(doc(db, 'bookings', id), updates);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
    } catch (error) {
      console.error("Error updating job:", error);
    }
  };

  const markComplete = (id: string) => {
    updateJob(id, { status: 'completed', progress: 100 });
  };

  const updateProgress = (id: string, delta: number) => {
    const job = jobs.find(j => j.id === id);
    if (job) {
      const newProgress = Math.min(100, Math.max(0, job.progress + delta));
      updateJob(id, { progress: newProgress, status: newProgress === 100 ? 'completed' : 'in_progress' });
    }
  };

  const filtered = jobs.filter(j => filter === 'all' || j.status === filter);
  const counts = {
    pending: jobs.filter(j => j.status === 'pending').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  if (loading) {
    return (
      <Layout title="Jobs">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Jobs">
      <div className="max-w-xl mx-auto md:max-w-3xl px-4 md:px-8 py-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Pending', value: counts.pending, color: '#F59E0B' },
            { label: 'In Progress', value: counts.in_progress, color: C.teal },
            { label: 'Completed', value: counts.completed, color: '#10B981' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-2xl" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 no-scrollbar">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs border transition-all"
              style={{
                background: filter === f ? C.dark : 'white',
                color: filter === f ? 'white' : '#6B7280',
                borderColor: filter === f ? C.dark : '#E5E7EB',
              }}
            >
              {f === 'all' ? 'All Jobs' : f === 'in_progress' ? 'In Progress' : f === 'pending' ? 'Pending' : 'Completed'}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        <div className="space-y-3">
          {filtered.map(job => {
            const cfg = STATUS_CONFIG[job.status];
            const isExpanded = expanded === job.id;
            return (
              <div key={job.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpanded(isExpanded ? null : job.id)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm" style={{ color: C.dark }}>{job.service}</p>
                      <p className="text-xs text-gray-400">{job.client}{job.deadline ? ` · Due ${job.deadline}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: C.primary }}>{job.amount > 0 ? `₱${job.amount.toLocaleString()}` : 'To be quoted'}</span>
                    {job.status === 'in_progress' && (
                      <span className="text-xs text-gray-400">{job.progress}% done</span>
                    )}
                  </div>

                  {job.status === 'in_progress' && (
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${job.progress}%`, background: C.teal }} />
                    </div>
                  )}
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">
                    {job.measurements && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Ruler size={13} style={{ color: C.primary }} />
                          <span className="text-xs" style={{ color: C.dark }}>Measurements</span>
                        </div>
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">{job.measurements}</p>
                      </div>
                    )}
                    {job.notes && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <FileText size={13} style={{ color: C.primary }} />
                          <span className="text-xs" style={{ color: C.dark }}>Client Notes</span>
                        </div>
                        <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">{job.notes}</p>
                      </div>
                    )}
                    {job.status === 'in_progress' && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Update Progress</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateProgress(job.id, -10)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs hover:bg-gray-50">-10%</button>
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${job.progress}%`, background: C.teal }} />
                          </div>
                          <button onClick={() => updateProgress(job.id, 10)} className="px-3 py-1.5 rounded-lg text-white text-xs" style={{ background: C.teal }}>+10%</button>
                        </div>
                      </div>
                    )}
                    {job.status === 'pending' && (
                      <button
                        onClick={() => updateJob(job.id, { status: 'in_progress' })}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs hover:opacity-90 transition-opacity"
                        style={{ background: C.teal }}
                      >
                        <CheckCircle2 size={14} /> Start Work
                      </button>
                    )}
                    {job.status === 'in_progress' && (
                      <button
                        onClick={() => markComplete(job.id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs hover:opacity-90 transition-opacity"
                        style={{ background: '#10B981' }}
                      >
                        <CheckCircle2 size={14} /> Mark as Completed
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No jobs found.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}