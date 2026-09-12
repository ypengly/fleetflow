export default function DriverHomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] px-4 py-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold">Today</h1>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <StatCard label="Pending" value="—" />
        <StatCard label="Completed" value="—" />
        <StatCard label="Failed" value="—" />
        <StatCard label="Distance" value="—" />
      </div>

      <p className="mt-6 text-sm text-[var(--color-muted)]">
        Assigned deliveries for today will appear below. Tap one to start navigation, capture
        proof of delivery, or report a failed delivery.
      </p>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}
