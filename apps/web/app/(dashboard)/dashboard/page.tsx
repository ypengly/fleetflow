'use client';

import { useEffect, useState } from 'react';

interface Metrics {
  totalOrders: number;
  delivered: number;
  failed: number;
  onTimeRate: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ff_access_token') : null;
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setMetrics)
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_320px] min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <aside className="border-r border-[var(--color-border)] p-4 hidden lg:block">
        <p className="font-semibold mb-6">FleetFlow</p>
        <nav className="space-y-1 text-sm text-[var(--color-muted)]">
          {['Dashboard', 'Orders', 'Drivers', 'Vehicles', 'Routes', 'Warehouses', 'Analytics'].map((item) => (
            <div key={item} className="rounded-md px-3 py-2 hover:bg-[var(--color-surface)] cursor-pointer">
              {item}
            </div>
          ))}
        </nav>
      </aside>

      <main className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Total Orders" value={metrics?.totalOrders} />
          <MetricCard label="Delivered" value={metrics?.delivered} />
          <MetricCard label="Failed" value={metrics?.failed} />
          <MetricCard
            label="On-Time Rate"
            value={metrics ? `${Math.round(metrics.onTimeRate * 100)}%` : undefined}
          />
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] h-[520px] flex items-center justify-center text-[var(--color-muted)]">
          Live map renders here — driver markers, delivery markers, routes, warehouses
          (see architecture doc §9 for the WebSocket feed powering this).
        </div>
      </main>

      <aside className="border-l border-[var(--color-border)] p-4 hidden lg:block">
        <p className="font-medium mb-4">Live activity</p>
        <p className="text-sm text-[var(--color-muted)]">
          Connect to /ws and subscribe to `driver:location` and order events to populate this feed.
        </p>
      </aside>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value ?? '—'}</p>
    </div>
  );
}
