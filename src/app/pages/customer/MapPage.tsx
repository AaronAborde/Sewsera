// src/app/pages/customer/MapPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Scissors, Package, X, Star, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layout } from '../../components/Layout';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const C = { primary: '#C4623F', dark: '#1A2B3C', teal: '#2A9D8F', bg: '#F5F0E8' };

// Victoria, Oriental Mindoro
const VICTORIA_CENTER: [number, number] = [13.1783, 121.2733];
const VICTORIA_BOUNDS: [[number, number], [number, number]] = [
  [13.05, 121.15],
  [13.30, 121.40],
];

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createCustomIcon = (color: string, emoji: string) =>
  L.divIcon({
    html: `<div style="width:36px;height:36px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:15px;line-height:1;">${emoji}</span></div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });

type MarkerData = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating: number;
  specialty: string;
  type: 'tailor' | 'seller';
  fields: string[];
};

type Coords = { lat: number; lng: number };
const NO_COORDS: Coords = { lat: NaN, lng: NaN };

const toNum = (v: any) => (v === null || v === undefined || v === '' ? NaN : Number(v));

const pick = (o: any, keys: string[]) => {
  for (const k of keys) {
    if (o && o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k];
  }
  return undefined;
};

// Makatwirang coordinates para sa Pilipinas
const inPH = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat > 4 && lat < 22 && lng > 116 && lng < 128;

// Hinahanap ang coordinates kahit saan sa loob ng object (hanggang 3 antas)
const findCoords = (s: any, depth = 0): Coords => {
  if (s === null || s === undefined || depth > 3) return NO_COORDS;

  if (Array.isArray(s)) {
    if (s.length >= 2) {
      const a = toNum(s[0]);
      const b = toNum(s[1]);
      if (inPH(a, b)) return { lat: a, lng: b };
      if (inPH(b, a)) return { lat: b, lng: a };
    }
    return NO_COORDS;
  }

  if (typeof s === 'string') {
    const m = s.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      if (inPH(a, b)) return { lat: a, lng: b };
      if (inPH(b, a)) return { lat: b, lng: a };
    }
    return NO_COORDS;
  }

  if (typeof s === 'object') {
    const lat = toNum(pick(s, ['lat', 'latitude', '_lat', 'Latitude', 'Lat']));
    const lng = toNum(pick(s, ['lng', 'lon', 'long', 'longitude', '_long', 'Longitude', 'Lng']));
    if (inPH(lat, lng)) return { lat, lng };

    for (const k of Object.keys(s)) {
      const r = findCoords(s[k], depth + 1);
      if (Number.isFinite(r.lat)) return r;
    }
  }

  return NO_COORDS;
};

const hasCoords = (m: { lat: number; lng: number }) =>
  Number.isFinite(m.lat) && Number.isFinite(m.lng);

function FlyToMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 1 });
  }, [position, map]);
  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [filter, setFilter] = useState<'all' | 'tailors' | 'sellers'>('all');
  const [selected, setSelected] = useState<MarkerData | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const [tailorsSnap, sellersSnap] = await Promise.all([
          getDocs(collection(db, 'tailors')),
          getDocs(collection(db, 'sellers')),
        ]);

        // Kunin din ang 'users' (kung may lokasyon doon). Hindi mag-e-error kung wala.
        const usersById: Record<string, any> = {};
        try {
          const usersSnap = await getDocs(collection(db, 'users'));
          usersSnap.docs.forEach(d => { usersById[d.id] = d.data(); });
        } catch {
          // walang access o walang 'users' collection, okay lang
        }

        const build = (d: any, type: 'tailor' | 'seller'): MarkerData => {
          const data = d.data();

          const linkedId = data.uid ?? data.userId ?? data.ownerId ?? data.user_id;
          let c = findCoords(data);
          if (!Number.isFinite(c.lat)) c = findCoords(usersById[d.id]);
          if (!Number.isFinite(c.lat) && linkedId) c = findCoords(usersById[linkedId]);

          return {
            id: d.id,
            type,
            name: data.name ?? data.shopName ?? data.businessName ?? 'Unnamed',
            specialty: data.specialty ?? data.specialization ?? (type === 'seller' ? 'Fabric Seller' : ''),
            rating: data.rating ?? 0,
            lat: c.lat,
            lng: c.lng,
            fields: Object.keys(data),
          };
        };

        const list = [
          ...tailorsSnap.docs.map(d => build(d, 'tailor')),
          ...sellersSnap.docs.map(d => build(d, 'seller')),
        ];

        setMarkers(list);
      } catch (error) {
        console.error('Error fetching map markers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkers();
  }, []);

  const filtered = markers.filter(m => filter === 'all' ? true : filter === 'tailors' ? m.type === 'tailor' : m.type === 'seller');
  const mappable = filtered.filter(hasCoords);

  const handleSelectFromList = (m: MarkerData) => {
    setSelected(m);
    if (hasCoords(m)) {
      setFlyTarget([m.lat, m.lng]);
      setTimeout(() => setFlyTarget(null), 1500);
    }
  };

  if (loading) {
    return (
      <Layout title="Map View">
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Map View">
      <div className="flex flex-col" style={{ height: 'calc(100vh - 114px)' }}>
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-2 flex-wrap z-10 md:hidden">
          {(['all', 'tailors', 'sellers'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs border transition-all"
              style={{ background: filter === f ? C.dark : 'white', color: filter === f ? 'white' : '#6B7280', borderColor: filter === f ? C.dark : '#E5E7EB' }}>
              {f === 'all' ? 'All' : f === 'tailors' ? '✂ Tailors' : '🧵 Sellers'}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400">{mappable.length} locations</span>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 flex-shrink-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 space-y-2">
              <h3 className="text-sm" style={{ color: C.dark }}>Locations</h3>
              <div className="flex flex-wrap gap-1">
                {(['all', 'tailors', 'sellers'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="px-2.5 py-1 rounded-full text-xs border transition-all"
                    style={{ background: filter === f ? C.dark : 'white', color: filter === f ? 'white' : '#6B7280', borderColor: filter === f ? C.dark : '#E5E7EB' }}>
                    {f === 'all' ? 'All' : f === 'tailors' ? '✂ Tailors' : '🧵 Sellers'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">{mappable.length} sa {filtered.length} ay may pin sa mapa</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="p-4 text-xs text-gray-400">Wala pang naka-register na lokasyon.</p>
              )}
              {filtered.map(m => (
                <button key={`${m.type}-${m.id}`} onClick={() => handleSelectFromList(m)}
                  className="w-full flex items-center gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left"
                  style={{ background: selected?.id === m.id ? '#FDF5F2' : undefined }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: m.type === 'tailor' ? C.primary : C.teal }}>
                    {m.type === 'tailor' ? <Scissors size={16} /> : <Package size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: C.dark }}>{m.name}</p>
                    <p className="text-xs text-gray-400">{m.specialty}</p>
                    {!hasCoords(m) && (
                      <>
                        <p className="text-xs text-red-400">Walang location pa</p>
                        <p className="text-[10px] text-gray-400 break-words">
                          ID: {m.id} · Fields: {(m.fields ?? []).join(', ')}
                        </p>
                      </>
                    )}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Star size={10} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-500">{m.rating}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 relative">
            <MapContainer
              center={VICTORIA_CENTER}
              zoom={13}
              minZoom={12}
              maxZoom={18}
              maxBounds={VICTORIA_BOUNDS}
              maxBoundsViscosity={1.0}
              className="w-full h-full z-0"
              zoomControl={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
              {flyTarget && <FlyToMarker position={flyTarget} />}
              {mappable.map(m => (
                <Marker key={`${m.type}-${m.id}`} position={[m.lat, m.lng]} icon={createCustomIcon(m.type === 'tailor' ? C.primary : C.teal, m.type === 'tailor' ? '✂' : '🧵')}
                  eventHandlers={{ click: () => setSelected(m) }}>
                  <Popup>
                    <div style={{ fontFamily: "'Inter', sans-serif", minWidth: 160 }}>
                      <p style={{ color: C.dark, fontWeight: 500, fontSize: 13 }}>{m.name}</p>
                      <p style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>{m.specialty}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <span style={{ color: '#F59E0B', fontSize: 11 }}>★</span>
                        <span style={{ fontSize: 11, color: '#374151' }}>{m.rating}</span>
                      </div>
                      {m.type === 'tailor' && (
                        <button onClick={() => navigate(`/customer/tailor/${m.id}`)} style={{ marginTop: 8, padding: '4px 12px', background: C.primary, color: 'white', border: 'none', borderRadius: 8, fontSize: 11, cursor: 'pointer', width: '100%' }}>
                          View Profile
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <div className="absolute top-3 right-3 z-[1000] bg-white rounded-xl shadow-md p-3 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: C.primary }} /><span className="text-gray-600">Tailor</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ background: C.teal }} /><span className="text-gray-600">Fabric Seller</span></div>
            </div>
          </div>
        </div>

        {selected && (
          <div className="md:hidden absolute bottom-16 left-0 right-0 z-[1000] px-4 pb-2">
            <div className="bg-white rounded-2xl shadow-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: selected.type === 'tailor' ? C.primary : C.teal }}>
                    {selected.type === 'tailor' ? <Scissors size={18} /> : <Package size={18} />}
                  </div>
                  <div><p className="text-sm" style={{ color: C.dark }}>{selected.name}</p><p className="text-xs text-gray-400">{selected.specialty}</p></div>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"><X size={15} className="text-gray-400" /></button>
              </div>
              <div className="flex items-center gap-1.5 mb-3"><Star size={12} className="fill-yellow-400 text-yellow-400" /><span className="text-sm text-gray-600">{selected.rating} rating</span></div>
              <div className="flex gap-2">
                <button onClick={() => selected.type === 'tailor' ? navigate(`/customer/tailor/${selected.id}`) : navigate('/customer/discover')} className="flex-1 py-2.5 rounded-xl text-white text-sm" style={{ background: selected.type === 'tailor' ? C.primary : C.teal }}>
                  View Profile
                </button>
                <button className="px-3 py-2.5 rounded-xl border border-gray-200 flex items-center gap-1.5 text-sm" style={{ color: C.dark }}><Navigation size={13} /> Go</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}