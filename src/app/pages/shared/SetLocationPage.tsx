import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Layout } from "../../components/Layout";
import { db } from "../../firebase";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Victoria, Oriental Mindoro
const VICTORIA_CENTER: [number, number] = [13.1783, 121.2733];
const VICTORIA_BOUNDS: [[number, number], [number, number]] = [
  [13.05, 121.15],
  [13.30, 121.40],
];

type Coords = { lat: number; lng: number };

function ClickHandler({ onPick }: { onPick: (c: Coords) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function SetLocationPage({
  collectionName,
}: {
  collectionName: "tailors" | "sellers";
}) {
  const [uid, setUid] = useState<string | null>(null);
  const [pos, setPos] = useState<Coords | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Kunin ang naka-login na user mula sa Firebase
  useEffect(() => {
    return onAuthStateChanged(getAuth(), (u) => setUid(u ? u.uid : null));
  }, []);

  // I-load ang dating naka-save na lokasyon (kung meron)
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, collectionName, uid)).then((snap) => {
      if (!snap.exists()) {
        setMessage(`Walang document na "${uid}" sa "${collectionName}". Ipakita ito sa developer.`);
        return;
      }
      const d: any = snap.data();
      if (Number.isFinite(Number(d.lat)) && Number.isFinite(Number(d.lng))) {
        setPos({ lat: Number(d.lat), lng: Number(d.lng) });
      }
    });
  }, [uid, collectionName]);

  const save = async () => {
    if (!uid || !pos) return;
    setSaving(true);
    setMessage("");
    try {
      const ref = doc(db, collectionName, uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setMessage(`Hindi makita ang document mo sa "${collectionName}", kaya hindi na-save.`);
        return;
      }
      await setDoc(ref, { lat: pos.lat, lng: pos.lng }, { merge: true });
      setMessage("Na-save na ang lokasyon. Makikita na ito sa Map.");
    } catch (e: any) {
      console.error(e);
      setMessage("Hindi na-save: " + (e?.message ?? "may error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Lokasyon ng Shop">
      <div className="p-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <h3 className="text-sm mb-1">I-pin ang shop mo</h3>
          <p className="text-xs text-gray-500 mb-3">
            I-click ang mapa kung nasaan ang shop mo, tapos pindutin ang Save.
          </p>

          <MapContainer
            center={pos ? [pos.lat, pos.lng] : VICTORIA_CENTER}
            zoom={14}
            minZoom={12}
            maxZoom={18}
            maxBounds={VICTORIA_BOUNDS}
            maxBoundsViscosity={1.0}
            style={{ height: 380, width: "100%", borderRadius: 12 }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <ClickHandler onPick={setPos} />
            {pos && <Marker position={[pos.lat, pos.lng]} />}
          </MapContainer>

          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <button
              onClick={save}
              disabled={!pos || !uid || saving}
              className="px-4 py-2 rounded-xl text-white text-sm disabled:opacity-50"
              style={{ background: "#C4623F" }}
            >
              {saving ? "Sine-save..." : "Save location"}
            </button>
            {!pos && <span className="text-xs text-gray-400">Wala pang napipili.</span>}
            {message && <span className="text-xs text-gray-600">{message}</span>}
          </div>
        </div>
      </div>
    </Layout>
  );
}