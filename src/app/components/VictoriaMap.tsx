import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const VICTORIA_CENTER: [number, number] = [13.1783, 121.2733];
const VICTORIA_BOUNDS: [[number, number], [number, number]] = [
  [13.05, 121.15],
  [13.30, 121.40],
];

type Item = {
  id: string;
  name: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

type Props = {
  items?: Item[];
  onPick?: (coords: { latitude: number; longitude: number }) => void;
  height?: string;
};

function ClickHandler({ onPick }: { onPick: Props["onPick"] }) {
  useMapEvents({
    click(e) {
      onPick?.({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}

export default function VictoriaMap({ items = [], onPick, height = "500px" }: Props) {
  return (
    <MapContainer
      center={VICTORIA_CENTER}
      zoom={13}
      minZoom={12}
      maxZoom={18}
      maxBounds={VICTORIA_BOUNDS}
      maxBoundsViscosity={1.0}
      style={{ height, width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {onPick && <ClickHandler onPick={onPick} />}

      {items
        .filter(
          (i) =>
            i.latitude != null &&
            i.longitude != null &&
            !isNaN(Number(i.latitude)) &&
            !isNaN(Number(i.longitude))
        )
        .map((i) => (
          <Marker key={i.id} position={[Number(i.latitude), Number(i.longitude)]}>
            <Popup>{i.name}</Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}