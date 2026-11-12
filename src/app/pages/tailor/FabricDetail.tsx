// src/app/pages/tailor/FabricDetail.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Star, MapPin, ShoppingCart, Minus, Plus, CheckCircle, MessageSquare } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { PaymentModal } from '../../components/PaymentModal';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { doc, getDoc, addDoc, collection, Timestamp } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

interface Fabric {
  id: string;
  name: string;
  seller: string;
  price: number;
  unit: string;
  image: string;
  category: string;
  description: string;
  colors: string[];
  tags: string[];
  stock: number;
  rating: number;
  reviews: number;
  location: string;
  sellerId: string;
}

export default function FabricDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [fabric, setFabric] = useState<Fabric | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [ordered, setOrdered] = useState(false);

  useEffect(() => {
    const fetchFabric = async () => {
      if (!id) return;
      try {
        // Sellers list stock in "inventory"; "fabrics" only holds a few legacy docs.
        let snap = await getDoc(doc(db, 'inventory', id));
        if (!snap.exists()) snap = await getDoc(doc(db, 'fabrics', id));
        if (!snap.exists()) {
          navigate('/tailor/fabrics');
          return;
        }
        const data: any = snap.data();
        let seller = data.seller || '';
        if (!seller && data.sellerId) {
          const shopSnap = await getDoc(doc(db, 'shops', data.sellerId));
          if (shopSnap.exists()) seller = shopSnap.data().shopName || '';
        }
        const mapped: Fabric = {
          id: snap.id,
          name: data.name || 'Fabric',
          seller: seller || 'Fabric Seller',
          price: Number(data.price) || 0,
          unit: data.unit || 'm',
          image: data.imageUrl || data.image || '',
          category: data.category || 'Fabric',
          description: data.description || '',
          colors: Array.isArray(data.colors) ? data.colors : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          stock: Number(data.stock) || 0,
          rating: Number(data.rating) || 0,
          reviews: Number(data.reviews) || 0,
          location: data.location || '',
          sellerId: data.sellerId || '',
        };
        setFabric(mapped);
        setSelectedColor(mapped.colors[0] || '');
      } catch (error) {
        console.error("Error fetching fabric:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFabric();
  }, [id, navigate]);

  const handleOrder = async () => {
    if (!currentUser || !fabric) return;
    try {
      // The buyer is the tailor; customerId keeps the existing rules/seller view working.
      await addDoc(collection(db, 'fabricOrders'), {
        customerId: currentUser.uid,
        customerName: currentUser.name,
        buyerRole: 'tailor',
        fabricId: fabric.id,
        fabricName: fabric.name,
        sellerId: fabric.sellerId,
        sellerName: fabric.seller,
        quantity,
        price: fabric.price,
        total: fabric.price * quantity,
        color: selectedColor,
        status: 'pending',
        createdAt: Timestamp.now(),
      });
      setOrdered(true);
    } catch (error) {
      console.error("Error placing order:", error);
    }
  };

  const backToFabrics = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/tailor/fabrics'));

  if (loading) {
    return (
      <Layout title="Fabric">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!fabric) return null;

  const total = fabric.price * quantity;

  if (ordered) {
    return (
      <Layout title="Fabric">
        <div className="flex flex-col items-center justify-center px-6 py-16">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: '#E8F9F0' }}>
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl mb-2 text-center" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>Order Placed!</h2>
          <p className="text-sm text-gray-500 text-center mb-6">{quantity}{fabric.unit} of {fabric.name} from {fabric.seller}</p>
          <button onClick={() => navigate('/tailor/fabrics')} className="px-6 py-3 rounded-xl text-white text-sm" style={{ background: C.primary }}>
            Back to Fabrics
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Fabric">
      <div className="relative">
        <div className="h-72 overflow-hidden">
          {fabric.image ? (
            <img src={fabric.image} alt={fabric.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#E5E7EB' }}>
              <ShoppingCart size={40} className="text-gray-400" />
            </div>
          )}
        </div>
        <button onClick={backToFabrics} className="absolute top-4 left-4 p-2.5 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors">
          <ArrowLeft size={18} style={{ color: C.dark }} />
        </button>
        <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs text-white" style={{ background: C.teal }}>
          {fabric.category}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h1 className="text-xl mb-1" style={{ color: C.dark, fontFamily: "'Playfair Display', serif" }}>{fabric.name}</h1>
          <p className="text-sm text-gray-400 mb-3">{fabric.seller}</p>
          <div className="flex items-center gap-4 mb-3">
            {fabric.reviews > 0 && (
              <div className="flex items-center gap-1">
                <Star size={13} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm text-gray-600">{fabric.rating}</span>
                <span className="text-xs text-gray-400">({fabric.reviews} reviews)</span>
              </div>
            )}
            {fabric.location && (
              <div className="flex items-center gap-1">
                <MapPin size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400">{fabric.location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: C.bg }}>
            <div>
              <p className="text-2xl" style={{ color: C.primary }}>₱{fabric.price}</p>
              <p className="text-xs text-gray-400">{fabric.unit}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Available Stock</p>
              <p className="text-sm" style={{ color: fabric.stock > 20 ? '#10B981' : '#F59E0B' }}>{fabric.stock} {fabric.unit === 'm' ? 'meters' : fabric.unit}</p>
            </div>
          </div>
        </div>

        {fabric.description && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="mb-2" style={{ color: C.dark }}>Description</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{fabric.description}</p>
          </div>
        )}

        {fabric.colors.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <h3 className="mb-3" style={{ color: C.dark }}>Available Colors</h3>
            <div className="flex flex-wrap gap-2">
              {fabric.colors.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className="px-3 py-1.5 rounded-full text-xs border-2 transition-all"
                  style={{
                    borderColor: selectedColor === c ? C.primary : '#E5E7EB',
                    background: selectedColor === c ? '#FDF5F2' : 'white',
                    color: selectedColor === c ? C.primary : '#6B7280',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {fabric.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {fabric.tags.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs" style={{ background: '#E8F8F6', color: C.teal }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 style={{ color: C.dark }}>Quantity ({fabric.unit === 'm' ? 'meters' : fabric.unit})</h3>
              <p className="text-xs text-gray-400 mt-0.5">Total: ₱{total.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={fabric.stock <= 0}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                <Minus size={14} style={{ color: C.dark }} />
              </button>
              <span className="text-lg w-8 text-center" style={{ color: C.dark }}>{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(fabric.stock, q + 1))}
                disabled={fabric.stock <= 0}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: C.primary }}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {fabric.sellerId && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => navigate(`/tailor/messages?to=${fabric.sellerId}&name=${encodeURIComponent(fabric.seller)}&role=seller`)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm transition-colors hover:bg-gray-50"
              style={{ color: C.dark }}
            >
              <MessageSquare size={16} /> Message Seller
            </button>
          </div>
        )}

        <button
          onClick={() => setPaymentOpen(true)}
          disabled={fabric.stock <= 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white text-sm hover:opacity-90 transition-opacity mb-8 disabled:opacity-50"
          style={{ background: C.primary }}
        >
          <ShoppingCart size={16} /> {fabric.stock > 0 ? `Order Now — ₱${total.toLocaleString()}` : 'Out of Stock'}
        </button>
      </div>

      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        amount={total}
        description={`${quantity}${fabric.unit} × ${fabric.name}`}
        onSuccess={() => {
          setPaymentOpen(false);
          handleOrder();
        }}
      />
    </Layout>
  );
}
