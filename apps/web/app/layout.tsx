import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FleetFlow — Move smarter. Deliver faster.',
  description:
    'FleetFlow gives logistics teams real-time visibility, intelligent routing, and complete control over every delivery.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
