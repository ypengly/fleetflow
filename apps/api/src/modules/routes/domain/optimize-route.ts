interface Stop {
  orderId: string;
  lat: number;
  lng: number;
}

/**
 * Nearest-neighbor heuristic: starting from the warehouse, repeatedly
 * pick the closest not-yet-visited stop. Not optimal (that's TSP,
 * NP-hard), but O(n^2) and good enough for the realistic stop counts
 * (~5-20) a single route has — a real optimizer (e.g. a mapping
 * provider's route-optimization API, or OR-Tools) can be swapped in
 * behind this same function signature later without touching callers.
 */
export function optimizeRoute(origin: { lat: number; lng: number }, stops: Stop[]): Stop[] {
  const remaining = [...stops];
  const ordered: Stop[] = [];
  let current = origin;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;

    remaining.forEach((stop, index) => {
      const distance = haversineDistanceKm(current, stop);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    current = next;
  }

  return ordered;
}

export function haversineDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
