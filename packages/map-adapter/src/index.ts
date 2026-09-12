export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapProvider {
  name: 'osm' | 'mapbox' | 'google';
  /** Returns a tile/style URL or config the frontend map component consumes. */
  getMapConfig(): { styleUrl?: string; apiKey?: string };
  /** Straight-line distance in km — used as a stand-in until a real
   *  provider's directions API is wired in for actual road distance. */
  distanceKm(a: LatLng, b: LatLng): number;
}

class OsmProvider implements MapProvider {
  name = 'osm' as const;
  getMapConfig() {
    return { styleUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' };
  }
  distanceKm(a: LatLng, b: LatLng) {
    return haversine(a, b);
  }
}

class MapboxProvider implements MapProvider {
  name = 'mapbox' as const;
  constructor(private apiKey: string) {}
  getMapConfig() {
    return { styleUrl: 'mapbox://styles/mapbox/dark-v11', apiKey: this.apiKey };
  }
  distanceKm(a: LatLng, b: LatLng) {
    return haversine(a, b); // swap for Mapbox Directions API in production
  }
}

class GoogleMapsProvider implements MapProvider {
  name = 'google' as const;
  constructor(private apiKey: string) {}
  getMapConfig() {
    return { apiKey: this.apiKey };
  }
  distanceKm(a: LatLng, b: LatLng) {
    return haversine(a, b); // swap for Google Distance Matrix API in production
  }
}

export function createMapProvider(): MapProvider {
  const provider = process.env.MAP_PROVIDER ?? process.env.NEXT_PUBLIC_MAP_PROVIDER ?? 'osm';
  switch (provider) {
    case 'mapbox':
      return new MapboxProvider(process.env.MAPBOX_TOKEN ?? '');
    case 'google':
      return new GoogleMapsProvider(process.env.GOOGLE_MAPS_API_KEY ?? '');
    default:
      return new OsmProvider();
  }
}

function haversine(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
