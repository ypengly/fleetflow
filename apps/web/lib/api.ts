const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Request failed: ${response.status}`);
  }

  return response.json();
}

export const api = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  orders: (token: string) => apiFetch('/orders', { token }),
  trackShipment: (trackingNumber: string) => apiFetch(`/shipments/${trackingNumber}`),
  analyticsOverview: (token: string) => apiFetch('/analytics/overview', { token }),
};
