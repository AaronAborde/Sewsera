// src/app/pages/shared/Profile.tsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Phone, MapPin, Bell, Shield, LogOut, ChevronRight, Edit2, Camera, X, Check, MapPinned } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

// Shrink the picked photo to a small JPEG data URL so it fits in the user document.
const toAvatarDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 160 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not available'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Could not read the image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, userRole, setIsAuthenticated, setUserRole, setCurrentUser } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', location: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) return;
      try {
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (userSnap.exists()) {
          const data = userSnap.data();
          setNotifications(data.notifications !== false);
          setCurrentUser(prev => (prev ? { ...prev, ...data } : null));
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [currentUser?.uid, setCurrentUser]);

  useEffect(() => {
    setForm({
      name: currentUser?.name || '',
      phone: currentUser?.phone || '',
      location: currentUser?.location || '',
    });
  }, [currentUser?.name, currentUser?.phone, currentUser?.location]);

  const flash = (text: string) => {
    setMessage(text);
    setError('');
    setTimeout(() => setMessage(''), 2500);
  };

  const startEdit = () => {
    setError('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError('');
    setForm({
      name: currentUser?.name || '',
      phone: currentUser?.phone || '',
      location: currentUser?.location || '',
    });
  };

  const saveInfo = async () => {
    if (!currentUser?.uid) return;
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updates = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
      };
      await updateDoc(doc(db, 'users', currentUser.uid), updates);
      setCurrentUser(prev => (prev ? { ...prev, ...updates } : null));
      setEditing(false);
      flash('Profile updated.');
    } catch (e) {
      console.error('Error saving profile:', e);
      setError('Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async (file: File | undefined) => {
    if (!file || !currentUser?.uid) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    setAvatarBusy(true);
    setError('');
    try {
      const avatarUrl = await toAvatarDataUrl(file);
      await updateDoc(doc(db, 'users', currentUser.uid), { avatarUrl });
      setCurrentUser(prev => (prev ? { ...prev, avatarUrl } : null));
      flash('Profile picture updated.');
    } catch (e) {
      console.error('Error updating avatar:', e);
      setError('Could not update your profile picture.');
    } finally {
      setAvatarBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const updatePreference = async (field: string, value: boolean) => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { [field]: value });
      setCurrentUser(prev => (prev ? { ...prev, [field]: value } : null));
    } catch (e) {
      console.error(`Error updating ${field}:`, e);
    }
  };

  const handleToggleNotifications = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    updatePreference('notifications', newValue);
  };

  const sendReset = async () => {
    if (!currentUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      setResetSent(true);
    } catch (e) {
      console.error('Error sending reset email:', e);
      setResetSent(false);
      setError('Could not send the reset email. Please try again later.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setUserRole(null);
      setCurrentUser(null);
      navigate('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const roleColor = userRole === 'customer' ? C.teal : userRole === 'tailor' ? C.primary : C.dark;
  const roleLabel = userRole === 'customer' ? 'Customer' : userRole === 'tailor' ? 'Professional Tailor' : userRole === 'admin' ? 'Administrator' : 'Fabric Seller';
  const hasMapPin = userRole === 'tailor' || userRole === 'seller';

  if (loading) {
    return (
      <Layout title="Profile">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Profile">
      <div className="max-w-xl mx-auto md:max-w-2xl px-4 md:px-8 py-5">
        {message && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-3.5 mb-4 text-xs text-green-700">{message}</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3.5 mb-4 text-xs text-red-600">{error}</div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${C.dark} 0%, ${roleColor} 100%)` }}>
            <button
              onClick={editing ? cancelEdit : startEdit}
              aria-label={editing ? 'Cancel editing' : 'Edit profile'}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              {editing ? <X size={14} /> : <Edit2 size={14} />}
            </button>
          </div>
          <div className="px-5 pb-5">
            <div className="flex items-end gap-4 -mt-8 mb-4">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-2xl border-4 border-white flex items-center justify-center text-white text-xl shadow-md overflow-hidden"
                  style={{ background: roleColor }}
                >
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => pickAvatar(e.target.files?.[0])}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarBusy}
                  aria-label="Change profile picture"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100 disabled:opacity-50"
                >
                  <Camera size={11} style={{ color: C.primary }} />
                </button>
              </div>
              <div className="mb-1">
                <h2 className="text-xl" style={{ color: C.dark }}>{currentUser?.name || 'User'}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: roleColor }}>
                  {roleLabel}
                </span>
              </div>
            </div>

            {editing ? (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="09xx xxx xxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="Barangay, Victoria, Oriental Mindoro"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:bg-white"
                  />
                  {hasMapPin && (
                    <button
                      onClick={() => navigate(`/${userRole}/location`)}
                      className="mt-2 flex items-center gap-1.5 text-xs hover:underline"
                      style={{ color: C.primary }}
                    >
                      <MapPinned size={13} /> Set your shop pin on the map
                    </button>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={saveInfo}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm disabled:opacity-50"
                    style={{ background: C.primary }}
                  >
                    <Check size={14} /> {saving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                    style={{ color: C.dark }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {[
                  { icon: <Mail size={15} />, label: 'Email', value: currentUser?.email },
                  { icon: <Phone size={15} />, label: 'Phone', value: currentUser?.phone || 'Not provided' },
                  { icon: <MapPin size={15} />, label: 'Location', value: currentUser?.location || 'Not set' },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.bg, color: roleColor }}>
                      {row.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">{row.label}</p>
                      <p className="text-sm truncate" style={{ color: C.dark }}>{row.value}</p>
                    </div>
                  </div>
                ))}
                {hasMapPin && (
                  <button
                    onClick={() => navigate(`/${userRole}/location`)}
                    className="mt-2 flex items-center gap-1.5 text-xs hover:underline"
                    style={{ color: C.primary }}
                  >
                    <MapPinned size={13} /> {currentUser?.location ? 'Update shop pin on the map' : 'Set your shop pin on the map'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-50">
            <h3 className="text-sm" style={{ color: C.dark }}>Preferences</h3>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
                <Bell size={15} className="text-blue-500" />
              </div>
              <div>
                <p className="text-sm" style={{ color: C.dark }}>Push Notifications</p>
                <p className="text-xs text-gray-400">Order updates & messages</p>
              </div>
            </div>
            <button
              onClick={handleToggleNotifications}
              aria-pressed={notifications}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ background: notifications ? C.primary : '#E5E7EB' }}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${notifications ? 'left-5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <button
            onClick={() => setSecurityOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50">
                <Shield size={15} className="text-indigo-500" />
              </div>
              <span className="text-sm" style={{ color: C.dark }}>Privacy & Security</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="text-center mb-4">
          <p className="text-xs text-gray-400">SewsEra v1.0.0 · Made in the Philippines 🇵🇭</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 text-sm transition-colors hover:bg-red-50"
          style={{ borderColor: '#FEE2E2', color: '#EF4444' }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      {/* Privacy & Security modal */}
      {securityOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSecurityOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg" style={{ color: C.dark }}>Privacy & Security</h3>
              <button onClick={() => setSecurityOpen(false)} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              We email a secure link to reset your password. Your documents and personal details are only visible to you and
              the SewsEra admin team.
            </p>
            {resetSent ? (
              <p className="text-sm text-green-600 mb-4">
                Reset link sent to {currentUser?.email}. Check your inbox (and spam folder).
              </p>
            ) : (
              <button
                onClick={sendReset}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
                style={{ background: C.primary }}
              >
                <Shield size={15} /> Send password reset email
              </button>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
