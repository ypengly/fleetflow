export type OrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETURNED';

export type DriverAvailability = 'AVAILABLE' | 'ON_DELIVERY' | 'OFFLINE' | 'ON_BREAK';

export type VehicleStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OFFLINE';

export interface TrackedShipment {
  trackingNumber: string;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryAt: string | null;
  origin: Record<string, unknown> | null;
  destination: Record<string, unknown> | null;
}

export interface DriverLocationUpdate {
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  ts: string;
}
