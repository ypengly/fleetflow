import { api } from '@/lib/api';

const TIMELINE_STEPS = [
  'CREATED',
  'CONFIRMED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export default async function TrackPage({ params }: { params: { trackingNumber: string } }) {
  let shipment: any = null;
  let error: string | null = null;

  try {
    shipment = await api.trackShipment(params.trackingNumber);
  } catch (e) {
    error = (e as Error).message;
  }

  if (error || !shipment) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="text-center">
          <p className="text-lg font-medium">We couldn&apos;t find that tracking number.</p>
          <p className="text-sm text-[var(--color-muted)] mt-2">
            Double-check the number and try again.
          </p>
        </div>
      </main>
    );
  }

  const currentStepIndex = TIMELINE_STEPS.indexOf(shipment.status);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-[var(--color-muted)]">Tracking number</p>
        <h1 className="text-2xl font-semibold">{shipment.trackingNumber}</h1>

        <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <p className="text-sm text-[var(--color-muted)]">Status</p>
          <p className="text-xl font-medium mt-1">{formatStatus(shipment.status)}</p>

          <div className="mt-6 space-y-3">
            {TIMELINE_STEPS.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    index <= currentStepIndex ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
                  }`}
                />
                <span className={index <= currentStepIndex ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]'}>
                  {formatStatus(step)}
                </span>
              </div>
            ))}
          </div>

          {shipment.estimatedDeliveryAt && (
            <p className="mt-6 text-sm text-[var(--color-muted)]">
              Estimated delivery: {new Date(shipment.estimatedDeliveryAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
}
