// src/app/pages/admin/AdminUsers.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Users, Trash2, FileText, Check, X } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { AdminGuard } from './AdminGuard';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, writeBatch } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', gold: '#C89558', bg: '#F5F0E8' };

const ROLES = ['customer', 'tailor', 'seller', 'admin'] as const;

const ROLE_BADGE: Record<string, { color: string; bg: string }> = {
  admin: { color: C.dark, bg: C.dark + '1A' },
  customer: { color: C.teal, bg: C.teal + '1A' },
  tailor: { color: C.gold, bg: C.gold + '1A' },
  seller: { color: C.primary, bg: C.primary + '1A' },
};

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#B45309', bg: '#FFFBEB' },
  approved: { label: 'Approved', color: '#047857', bg: '#ECFDF5' },
  rejected: { label: 'Rejected', color: '#B91C1C', bg: '#FEF2F2' },
};

interface AdminUser {
  id: string;
  uid?: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  role?: string;
  status?: string;
  documentsSubmitted?: boolean;
  createdAt?: unknown;
}

interface UserDocument {
  id: string;
  label?: string;
  fileName?: string;
  dataUrl?: string;
}

const joined = (v: unknown) => {
  const d = v as { toDate?: () => Date };
  const date = typeof d?.toDate === 'function' ? d.toDate() : v instanceof Date ? v : null;
  return date ? date.toLocaleDateString() : 'date unknown';
};

const TAILOR_IMAGE = 'https://images.unsplash.com/photo-1581242693425-36ca662d99f4?w=400&q=80';

const isVendor = (u: AdminUser) => u.role === 'tailor' || u.role === 'seller';

// Live data has no status on older customer docs; only tailors/sellers need review.
const statusOf = (u: AdminUser) => u.status || (isVendor(u) ? 'pending' : 'approved');

const ROLE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'customer', label: 'Customers' },
  { value: 'tailor', label: 'Tailors' },
  { value: 'seller', label: 'Sellers' },
  { value: 'admin', label: 'Admins' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'Any status' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminUsers() {
  const { currentUser, userRole } = useApp();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);
  const [docsFor, setDocsFor] = useState<AdminUser | null>(null);
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');
  const docsRequestRef = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AdminUser)));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userRole === 'admin') load();
  }, [load, userRole]);

  const changeRole = async (uid: string, role: string) => {
    setActionError('');
    setBusyId(uid);
    // Approval status always follows the role: vendors must be reviewed again.
    const status = role === 'tailor' || role === 'seller' ? 'pending' : 'approved';
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', uid), { role, status });
      // A demoted vendor must disappear from Discover.
      if (role !== 'tailor') batch.delete(doc(db, 'tailors', uid));
      if (role !== 'seller') batch.delete(doc(db, 'sellers', uid));
      await batch.commit();
      setUsers(prev => prev.map(u => ((u.uid || u.id) === uid ? { ...u, role, status } : u)));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update role.');
    } finally {
      setBusyId('');
    }
  };

  const review = async (u: AdminUser, status: 'approved' | 'rejected') => {
    const uid = u.uid || u.id;
    setActionError('');
    setBusyId(uid);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', uid), {
        status,
        reviewedBy: currentUser?.uid ?? null,
        reviewedAt: serverTimestamp(),
      });
      // Approved vendors need a public listing or they never appear in Discover.
      if (status === 'approved') {
        const listingRef = doc(db, u.role === 'tailor' ? 'tailors' : 'sellers', uid);
        const existing = await getDoc(listingRef);
        // Only seed defaults for a new listing; re-approval must not reset ratings.
        const listing =
          existing.exists()
            ? { approvedAt: serverTimestamp() }
            : u.role === 'tailor'
              ? {
                  name: u.name || u.email || 'Tailor',
                  owner: u.name || '',
                  specialty: 'Tailoring & Alterations',
                  about: '',
                  tags: [],
                  experience: '-',
                  responseTime: '-',
                  image: TAILOR_IMAGE,
                  price: 'Contact for quote',
                  location: u.location || '',
                  available: true,
                  rating: 0,
                  reviews: 0,
                  completedOrders: 0,
                  portfolio: [],
                  approvedAt: serverTimestamp(),
                }
              : { name: u.name || u.email || 'Seller', specialty: 'Fabric Seller', rating: 0, approvedAt: serverTimestamp() };
        batch.set(listingRef, listing, { merge: true });
      }
      await batch.commit();
      setUsers(prev => prev.map(x => ((x.uid || x.id) === uid ? { ...x, status } : x)));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to update approval status.');
    } finally {
      setBusyId('');
    }
  };

  const openDocuments = async (u: AdminUser) => {
    const requestId = ++docsRequestRef.current;
    setDocsFor(u);
    setDocs([]);
    setDocsError('');
    setDocsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users', u.uid || u.id, 'documents'));
      if (docsRequestRef.current !== requestId) return;
      setDocs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserDocument)));
    } catch (e) {
      if (docsRequestRef.current !== requestId) return;
      setDocsError(e instanceof Error ? e.message : 'Failed to load documents.');
    } finally {
      if (docsRequestRef.current === requestId) setDocsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const uid = pendingDelete.uid || pendingDelete.id;
    setPendingDelete(null);
    setActionError('');
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(prev => prev.filter(u => (u.uid || u.id) !== uid));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to remove profile.');
    }
  };

  const term = search.trim().toLowerCase();
  const filtered = users.filter(u => {
    const matchesRole = filter === 'all' || u.role === filter;
    const matchesStatus = statusFilter === 'all' || statusOf(u) === statusFilter;
    const matchesSearch = !term || (u.name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term);
    return matchesRole && matchesStatus && matchesSearch;
  });
  const pendingCount = users.filter(u => isVendor(u) && statusOf(u) === 'pending').length;

  const chip = (value: string, label: string, active: boolean, onClick: () => void) => (
    <button
      key={value}
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs border border-gray-200 bg-white"
      style={active ? { background: C.dark, color: 'white', borderColor: C.dark } : { color: C.dark }}
    >
      {label}
    </button>
  );

  return (
    <Layout title="Users">
      <AdminGuard>
        <div className="max-w-xl mx-auto md:max-w-3xl px-4 md:px-8 py-5">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email"
            aria-label="Search users"
            className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm mb-3"
          />

          <div className="flex flex-wrap gap-2 mb-2">
            {ROLE_FILTERS.map(f => chip(f.value, f.label, filter === f.value, () => setFilter(f.value)))}
          </div>
          <div className="flex flex-wrap gap-2 mb-5">
            {STATUS_FILTERS.map(f =>
              chip(
                f.value,
                f.value === 'pending' && pendingCount > 0 ? `Pending (${pendingCount})` : f.label,
                statusFilter === f.value,
                () => setStatusFilter(f.value),
              ),
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : loadError ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-500 mb-3">{loadError}</p>
              <button onClick={load} className="px-4 py-2.5 rounded-xl text-white text-sm" style={{ background: C.primary }}>
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {actionError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{actionError}</p>}
              <p className="text-sm text-gray-500">{filtered.length} users</p>
              {filtered.map(u => {
                const uid = u.uid || u.id;
                const isSelf = uid === currentUser?.uid;
                const vendor = isVendor(u);
                const status = statusOf(u);
                const badge = ROLE_BADGE[u.role ?? ''] ?? { color: '#6B7280', bg: '#F3F4F6' };
                const statusBadge = STATUS_BADGE[status] ?? STATUS_BADGE.pending;
                return (
                  <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0" style={{ background: C.primary }}>
                      {(u.name || u.email || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-sm truncate" style={{ color: C.dark }}>{u.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email || 'No email'}</p>
                      <p className="text-xs text-gray-400">Joined {joined(u.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-auto">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                          {(u.role || 'unknown').charAt(0).toUpperCase() + (u.role || 'unknown').slice(1)}
                        </span>
                        {vendor && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: statusBadge.bg, color: statusBadge.color }}>
                            {statusBadge.label}
                          </span>
                        )}
                      </div>

                      {vendor && (
                        <div className="flex items-center gap-1">
                          {status !== 'approved' && (
                            <button
                              onClick={() => review(u, 'approved')}
                              disabled={!!busyId}
                              aria-label={`Approve ${u.name || u.email || 'user'}`}
                              className="flex items-center gap-1 px-2.5 min-h-9 rounded-lg text-xs bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50"
                            >
                              <Check size={13} /> Approve
                            </button>
                          )}
                          {status !== 'rejected' && (
                            <button
                              onClick={() => review(u, 'rejected')}
                              disabled={!!busyId}
                              aria-label={`Reject ${u.name || u.email || 'user'}`}
                              className="flex items-center gap-1 px-2.5 min-h-9 rounded-lg text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                            >
                              <X size={13} /> Reject
                            </button>
                          )}
                          <button
                            onClick={() => openDocuments(u)}
                            aria-label={`View documents for ${u.name || u.email || 'user'}`}
                            className="flex items-center gap-1 px-2.5 min-h-9 rounded-lg text-xs border border-gray-200 hover:bg-gray-50"
                            style={{ color: C.dark }}
                          >
                            <FileText size={13} /> Docs
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <select
                          value={u.role ?? 'customer'}
                          onChange={e => changeRole(uid, e.target.value)}
                          disabled={isSelf || !!busyId}
                          aria-label={`Change role for ${u.name || u.email || 'user'}`}
                          title={isSelf ? "You can't change your own role" : undefined}
                          className="w-32 h-9 rounded-lg border border-gray-200 text-xs bg-white disabled:opacity-50"
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setPendingDelete(u)}
                          disabled={isSelf || !!busyId}
                          aria-label={`Remove ${u.name || u.email || 'user'}`}
                          title={isSelf ? "You can't remove your own profile" : undefined}
                          className="p-2.5 min-w-11 min-h-11 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users size={32} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No users found.</p>
                </div>
              )}
            </div>
          )}

          <Dialog open={!!docsFor} onOpenChange={open => !open && setDocsFor(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Documents — {docsFor?.name || docsFor?.email || 'User'}</DialogTitle>
              </DialogHeader>
              {docsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : docsError ? (
                <p className="text-sm text-red-500">{docsError}</p>
              ) : docs.length === 0 ? (
                <p className="text-sm text-gray-500">No documents uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {docs.map(d => (
                    <figure key={d.id} className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                      {d.dataUrl && /^data:image\//i.test(d.dataUrl) ? (
                        <img src={d.dataUrl} alt={d.label || d.fileName || 'Uploaded document'} className="w-full h-48 object-cover" />
                      ) : (
                        <div className="h-48 flex items-center justify-center text-xs text-gray-400">No preview</div>
                      )}
                      <figcaption className="px-3 py-2 text-xs text-gray-600 truncate">
                        {d.label || d.fileName || d.id}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={!!pendingDelete} onOpenChange={open => !open && setPendingDelete(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove profile?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-500">
                This removes the SewsEra profile for {pendingDelete?.name || pendingDelete?.email || 'this user'}. Their sign-in account
                stays active; a new profile will be created as a customer the next time they sign in.
              </p>
              <DialogFooter>
                <button
                  onClick={() => setPendingDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                  style={{ color: C.dark }}
                >
                  Cancel
                </button>
                <button onClick={confirmDelete} className="px-4 py-2.5 rounded-xl text-white text-sm bg-red-500 hover:bg-red-600">
                  Remove profile
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AdminGuard>
    </Layout>
  );
}
