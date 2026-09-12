import { optimizeRoute, haversineDistanceKm } from './optimize-route';

describe('optimizeRoute', () => {
  it('visits the nearest stop first', () => {
    const origin = { lat: 0, lng: 0 };
    const stops = [
      { orderId: 'far', lat: 10, lng: 10 },
      { orderId: 'near', lat: 0.1, lng: 0.1 },
      { orderId: 'mid', lat: 1, lng: 1 },
    ];

    const result = optimizeRoute(origin, stops);
    expect(result[0].orderId).toBe('near');
    expect(result[result.length - 1].orderId).toBe('far');
  });

  it('returns all stops exactly once', () => {
    const origin = { lat: 0, lng: 0 };
    const stops = Array.from({ length: 8 }, (_, i) => ({ orderId: `s${i}`, lat: i, lng: i }));
    const result = optimizeRoute(origin, stops);
    expect(result).toHaveLength(stops.length);
    expect(new Set(result.map((s) => s.orderId)).size).toBe(stops.length);
  });

  it('haversine distance is symmetric and zero for identical points', () => {
    const a = { lat: 51.5, lng: -0.1 };
    const b = { lat: 48.8, lng: 2.3 };
    expect(haversineDistanceKm(a, a)).toBeCloseTo(0);
    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a));
  });
});
