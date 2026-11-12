import { useState, useEffect } from 'react';
import { Save, MapPin, Phone, Clock, Globe } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F' };

interface ShopData {
  shopName: string;
  description: string;
  address: string;
  phone: string;
  hours: string;
  website: string;
}

export default function Shop() {
  const { currentUser } = useApp();
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const loadShop = async () => {
      try {
        const [shopSnap, sellerSnap] = await Promise.all([
          getDoc(doc(db, 'shops', currentUser.uid)),
          getDoc(doc(db, 'sellers', currentUser.uid)),
        ]);
        if (sellerSnap.exists()) {
          setRating(Number(sellerSnap.data().rating) || 0);
        }
        if (shopSnap.exists()) {
          const data = shopSnap.data() as ShopData;
          setShopName(data.shopName || '');
          setDescription(data.description || '');
          setAddress(data.address || '');
          setPhone(data.phone || '');
          setHours(data.hours || '');
          setWebsite(data.website || '');
        } else {
          setShopName(currentUser?.name ? `${currentUser.name}'s Shop` : '');
          setPhone(currentUser?.phone || '');
        }
      } catch (error) {
        console.error("Error loading shop:", error);
      } finally {
        setLoading(false);
      }
    };
    loadShop();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser?.uid) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'shops', currentUser.uid), {
        shopName,
        description,
        address,
        phone,
        hours,
        website,
        updatedAt: new Date(),
      }, { merge: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving shop:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Shop Profile">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Shop Profile">
      <div className="max-w-xl mx-auto md:max-w-2xl px-4 md:px-8 py-5">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-5">
          <div className="h-32" style={{ background: `linear-gradient(135deg, ${C.dark} 0%, ${C.teal} 100%)` }} />
          <div className="px-5 pb-5">
            <div className="flex items-end gap-4 -mt-8 mb-3">
              <div className="w-16 h-16 rounded-2xl border-4 border-white flex items-center justify-center text-white" style={{ background: C.dark }}>
                <span>{shopName.substring(0, 2).toUpperCase()}</span>
              </div>
              <div className="mb-1">
                <p className="text-sm text-gray-400">Shop Profile</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Verified Seller
              </div>
              <div className="px-2.5 py-1 rounded-full text-xs" style={{ background: '#FDF5F2', color: C.primary }}>
                {rating > 0 ? `${rating.toFixed(1)}★ Rating` : 'No ratings yet'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4 mb-5">
          <h3 className="mb-3" style={{ color: C.dark }}>Shop Information</h3>
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">Shop Name</label>
            <input
              type="text"
              value={shopName}
              onChange={e => setShopName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1.5">Shop Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:bg-white transition-all resize-none"
            />
          </div>
          {[
            { label: 'Address', icon: <MapPin size={15} />, value: address, set: setAddress, type: 'text' },
            { label: 'Contact Number', icon: <Phone size={15} />, value: phone, set: setPhone, type: 'tel' },
            { label: 'Business Hours', icon: <Clock size={15} />, value: hours, set: setHours, type: 'text' },
            { label: 'Website (optional)', icon: <Globe size={15} />, value: website, set: setWebsite, type: 'url' },
          ].map(field => (
            <div key={field.label}>
              <label className="text-sm text-gray-600 block mb-1.5 flex items-center gap-1.5">
                <span style={{ color: C.primary }}>{field.icon}</span> {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.set(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:bg-white transition-all"
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 mb-5">
          <h3 className="mb-3" style={{ color: C.dark }}>Accepted Payments</h3>
          <div className="flex flex-wrap gap-2">
            {['GCash', 'Maya', 'Cash on Delivery', 'Bank Transfer', 'Credit Card'].map(p => (
              <div key={p} className="px-3 py-1.5 rounded-full text-xs" style={{ background: '#E8F8F6', color: C.teal }}>
                ✓ {p}
              </div>
            ))}
          </div>
        </div>

        {/* ✅ Fixed: removed 'block' from className */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-sm hover:opacity-90 transition-all"
          style={{ background: saved ? '#10B981' : C.primary }}
        >
          <Save size={16} /> {saving ? 'Saving...' : saved ? 'Changes Saved!' : 'Save Shop Profile'}
        </button>
      </div>
    </Layout>
  );
}