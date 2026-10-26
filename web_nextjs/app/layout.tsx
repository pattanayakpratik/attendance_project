import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Attendance Pro - Location & QR Attendance System',
  description: 'Smart campus attendance management powered by Geofencing and Dynamic QR Codes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F5F7F8] text-[#1E293B]">
        <Suspense fallback={<header className="h-16 bg-[#2D8885] w-full" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1">
          <Suspense fallback={<div className="p-12 text-center text-slate-400 font-medium text-xs">Loading page...</div>}>
            {children}
          </Suspense>
        </main>
      </body>
    </html>
  );
}
