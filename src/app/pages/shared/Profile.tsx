// src/app/pages/shared/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { User, Mail, Phone, MapPin, Bell, Shield, LogOut, ChevronRight, Edit2, Camera } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

export default function Profile() {
  const navigate = useNavigate();
  const { currentUser, userRole, setIsAuthenticated, setUserRole, setCurrentUser } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser?.uid) return;
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setNotifications(data.notifications !== false);
          setEmailAlerts(data.emailAlerts !== false);
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, [currentUser]);

  const updatePreference = async (field: string, value: boolean) => {
    if (!currentUser?.uid) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { [field]: value });
      // Update local context
      setCurrentUser(prev => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  const handleToggleNotifications = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    updatePreference('notifications', newValue);
  };

  const handleToggleEmailAlerts = () => {
    const newValue = !emailAlerts;
    setEmailAlerts(newValue);
    updatePreference('emailAlerts', newValue);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setUserRole(null);
      setCurrentUser(null);
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const roleColor = userRole === 'customer' ? C.teal : userRole === 'tailor' ? C.primary : C.dark;
  const roleLabel = userRole === 'customer' ? 'Customer' : userRole === 'tailor' ? 'Professional Tailor' : userRole === 'admin' ? 'Administrator' : 'Fabric Seller';

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
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${C.dark} 0%, ${roleColor} 100%)` }}>
            <button className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors">
              <Edit2 size={14} />
            </button>
          </div>
          <div className="px-5 pb-5">
            <div className="flex items-end gap-4 -mt-8 mb-4">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-2xl border-4 border-white flex items-center justify-center text-white text-xl shadow-md"
                  style={{ background: roleColor }}
                >
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center border border-gray-100">
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

            {[
              { icon: <Mail size={15} />, label: 'Email', value: currentUser?.email },
              { icon: <Phone size={15} />, label: 'Phone', value: currentUser?.phone || 'Not provided' },
              { icon: <MapPin size={15} />, label: 'Location', value: currentUser?.location || 'Not set' }, // ✅ location exists now
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.bg, color: roleColor }}>
                  {row.icon}
                </div>
                <div>
                  <p className="text-xs text-gray-400">{row.label}</p>
                  <p className="text-sm" style={{ color: C.dark }}>{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="p-4 border-b border-gray-50">
            <h3 className="text-sm" style={{ color: C.dark }}>Preferences</h3>
          </div>
          <div className="divide-y divide-gray-50">
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
                className="relative w-11 h-6 rounded-full transition-all"
                style={{ background: notifications ? C.primary : '#E5E7EB' }}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${notifications ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50">
                  <Mail size={15} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm" style={{ color: C.dark }}>Email Alerts</p>
                  <p className="text-xs text-gray-400">Booking & order confirmations</p>
                </div>
              </div>
              <button
                onClick={handleToggleEmailAlerts}
                className="relative w-11 h-6 rounded-full transition-all"
                style={{ background: emailAlerts ? C.primary : '#E5E7EB' }}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${emailAlerts ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* More Options */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          {[
            { icon: <Shield size={15} className="text-indigo-500" />, label: 'Privacy & Security', bg: 'bg-indigo-50' },
            { icon: <User size={15} style={{ color: C.primary }} />, label: 'Edit Profile', bg: 'bg-red-50' },
          ].map(item => (
            <button key={item.label} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg}`}>{item.icon}</div>
                <span className="text-sm" style={{ color: C.dark }}>{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          ))}
        </div>

        {/* App Info */}
        <div className="text-center mb-4">
          <p className="text-xs text-gray-400">SewsEra v1.0.0 · Made in the Philippines 🇵🇭</p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 text-sm transition-colors hover:bg-red-50"
          style={{ borderColor: '#FEE2E2', color: '#EF4444' }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </Layout>
  );
}