// Haversine formula — do lat/lng points ke beech ki straight-line distance (km)
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Delivery bike ki average city speed ~25 km/h maan ke rough ETA
export function getEtaMinutes(distanceKm: number): number {
  const avgSpeedKmh = 25;
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
}