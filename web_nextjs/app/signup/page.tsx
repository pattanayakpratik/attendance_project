'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/register');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F5F7F8] dark:bg-[#0B1619] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#2D8885] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
