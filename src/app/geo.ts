// Reverse geocode with OpenStreetMap Nominatim (keyless; low-volume use, one call per pin).
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`,
      { headers: { Accept: 'application/json' }, signal: controller.signal }
    );
    if (!res.ok) throw new Error('Reverse geocoding failed');
    const data = await res.json();
    const a = data.address || {};
    const parts = [
      a.quarter || a.neighbourhood || a.suburb || a.village || a.hamlet,
      a.town || a.city || a.municipality,
      a.state,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : data.display_name || '';
  } finally {
    clearTimeout(timer);
  }
}
