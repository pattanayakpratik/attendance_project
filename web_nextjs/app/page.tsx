'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSavedUser } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getSavedUser();
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F5F7F8] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#2D8885] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
