// src/app/pages/seller/Inventory.tsx
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F' };

const STATUS_CONFIG = {
  in_stock: { label: 'In Stock', color: '#10B981', bg: '#ECFDF5', icon: <CheckCircle size={12} /> },
  low_stock: { label: 'Low Stock', color: '#F59E0B', bg: '#FFFBEB', icon: <AlertTriangle size={12} /> },
  out_of_stock: { label: 'Out of Stock', color: '#EF4444', bg: '#FEF2F2', icon: <XCircle size={12} /> },
};

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  unit?: string;
}

export default function Inventory() {
  const { currentUser } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ category: '', name: '', stock: 0, price: 0, unit: 'm' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const fetchInventory = async () => {
      try {
        const q = query(collection(db, 'inventory'), where('sellerId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const itemsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
        setItems(itemsList);
      } catch (error) {
        console.error("Error fetching inventory:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [currentUser]);

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.category || newProduct.stock < 0 || newProduct.price <= 0) return;
    setAdding(true);
    try {
      const status = newProduct.stock === 0 ? 'out_of_stock' : newProduct.stock < 15 ? 'low_stock' : 'in_stock';
      const docRef = await addDoc(collection(db, 'inventory'), {
        sellerId: currentUser?.uid,
        ...newProduct,
        status,
        createdAt: new Date(),
      });
      setItems(prev => [...prev, { id: docRef.id, ...newProduct, status }]);
      setNewProduct({ category: '', name: '', stock: 0, price: 0, unit: 'm' });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setAdding(false);
    }
  };

  const editStockField = (id: string, currentStock: number) => {
    setEditId(id);
    setEditStock(currentStock);
  };

  const saveStock = async (id: string) => {
    const status = editStock === 0 ? 'out_of_stock' : editStock < 15 ? 'low_stock' : 'in_stock';
    try {
      await updateDoc(doc(db, 'inventory', id), { stock: editStock, status });
      setItems(prev => prev.map(i => i.id === id ? { ...i, stock: editStock, status } : i));
      setEditId(null);
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const removeItem = async (id: string) => {
    if (window.confirm('Delete this product?')) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
        setItems(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  if (loading) {
    return (
      <Layout title="Inventory">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Inventory">
      <div className="max-w-xl mx-auto md:max-w-4xl px-4 md:px-8 py-5">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl" style={{ color: C.dark }}>Inventory</h2>
            <p className="text-xs text-gray-400">{items.length} products</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm hover:opacity-90 transition-opacity"
            style={{ background: C.primary }}
          >
            <Plus size={16} /> Add Product
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'In Stock', count: items.filter(i => i.status === 'in_stock').length, color: '#10B981' },
            { label: 'Low Stock', count: items.filter(i => i.status === 'low_stock').length, color: '#F59E0B' },
            { label: 'Out of Stock', count: items.filter(i => i.status === 'out_of_stock').length, color: '#EF4444' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-2xl" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {['Category', 'Product', 'Stock', 'Price', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const cfg = STATUS_CONFIG[item.status];
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500">{item.category}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: C.dark }}>{item.name}</td>
                    <td className="px-4 py-3">
                      {editId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" value={editStock} onChange={e => setEditStock(+e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs" />
                          <button onClick={() => saveStock(item.id)} className="text-xs text-green-600 hover:underline">Save</button>
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: C.dark }}>{item.stock}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: C.primary }}>₱{item.price}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => editStockField(item.id, item.stock)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <Edit2 size={13} style={{ color: C.teal }} />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          <Trash2 size={13} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {items.map(item => {
            const cfg = STATUS_CONFIG[item.status];
            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm" style={{ color: C.dark }}>{item.name}</p>
                    <p className="text-xs text-gray-400">{item.category}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Stock</p>
                      {editId === item.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" value={editStock} onChange={e => setEditStock(+e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-xs" />
                          <button onClick={() => saveStock(item.id)} className="text-xs text-green-600">Save</button>
                        </div>
                      ) : (
                        <p style={{ color: C.dark }}>{item.stock} units</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Price</p>
                      <p style={{ color: C.primary }}>₱{item.price}/m</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => editStockField(item.id, item.stock)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                      <Edit2 size={14} style={{ color: C.teal }} />
                    </button>
                    <button onClick={() => removeItem(item.id)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg" style={{ color: C.dark }}>Add New Product</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Category (e.g., Cotton, Silk)"
                value={newProduct.category}
                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-3 text-sm"
              />
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-3 text-sm"
              />
              <input
                type="number"
                placeholder="Stock Quantity"
                value={newProduct.stock}
                onChange={e => setNewProduct({ ...newProduct, stock: +e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-3 text-sm"
              />
              <input
                type="number"
                placeholder="Price per meter (₱)"
                value={newProduct.price}
                onChange={e => setNewProduct({ ...newProduct, price: +e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4 text-sm"
              />
              <button
                onClick={addProduct}
                disabled={adding || !newProduct.name || !newProduct.category || newProduct.price <= 0}
                className="w-full py-3 rounded-xl text-white text-sm disabled:opacity-50"
                style={{ background: C.primary }}
              >
                {adding ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}