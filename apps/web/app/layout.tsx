import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'StayNest — Vacation Rental Marketplace',
  description: 'StayNest is a full-stack vacation rental marketplace connecting hosts with travelers.',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}