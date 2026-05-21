'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/auth');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <main className="min-h-screen bg-[#080b11] flex flex-col items-center justify-center font-sans">
      {/* Recti Code Brand Loading Spinner */}
      <div className="flex items-center gap-3 mb-6 animate-pulse">
        <svg className="w-10 h-10 text-[#818cf8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h4" />
        </svg>
        <span className="text-3xl font-bold tracking-tight text-white">Recti Code</span>
      </div>
      <div className="flex items-center gap-2 text-xs font-mono text-[#64748b]">
        <svg className="animate-spin h-4 w-4 text-[#818cf8]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>CONNECTING TO RECTI NETWORK...</span>
      </div>
    </main>
  );
}

