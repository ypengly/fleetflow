import Link from 'next/link';

const SECTIONS = [
  { title: 'Real-time fleet visibility', body: 'Every driver, every vehicle, every delivery — live on one map.' },
  { title: 'Smarter delivery routes', body: 'Sequence stops automatically and cut wasted miles.' },
  { title: 'Track every shipment', body: 'A branded, public tracking page customers actually enjoy using.' },
  { title: 'Powerful analytics', body: 'On-time rate, driver performance, and cost, in one dashboard.' },
  { title: 'Built for developers', body: 'A clean REST API, webhooks, and API keys out of the box.' },
  { title: 'Security', body: 'Tenant isolation, RBAC, and audit logs from day one.' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          Move smarter. Deliver faster.
        </h1>
        <p className="mt-4 text-lg text-[var(--color-muted)] max-w-2xl mx-auto">
          FleetFlow gives logistics teams real-time visibility, intelligent routing, and complete
          control over every delivery.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/auth/register"
            className="rounded-lg bg-[var(--color-accent)] px-6 py-3 font-medium text-white hover:opacity-90"
          >
            Start Free
          </Link>
          <Link
            href="/track/FF-2026-DEMO01"
            className="rounded-lg border border-[var(--color-border)] px-6 py-3 font-medium hover:bg-[var(--color-surface)]"
          >
            View Live Demo
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {SECTIONS.map((s) => (
          <div key={s.title} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h3 className="font-medium">{s.title}</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{s.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
